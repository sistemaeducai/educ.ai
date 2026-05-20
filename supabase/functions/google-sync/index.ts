import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

const GOOGLE_API = "https://classroom.googleapis.com/v1";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const getSupabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

app.use("*", cors({
  origin: "*",
  allowHeaders: ["authorization", "x-client-info", "apikey", "content-type"],
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
}));

// ─── Auth helper ────────────────────────────────────────────────────────────
async function getUser(c: any) {
  const auth = c.req.header("Authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

// ─── Google API helper ──────────────────────────────────────────────────────
async function googleFetch(path: string, accessToken: string, options: RequestInit = {}) {
  return fetch(`${GOOGLE_API}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

// ─── Refresh token helper ───────────────────────────────────────────────────
async function refreshAccessToken(professorId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .eq("professor_id", professorId)
    .single();

  if (!data?.refresh_token) return null;

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refresh_token,
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();

  // Update stored token
  await supabase.from("google_tokens").upsert({
    professor_id: professorId,
    access_token: json.access_token,
    expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });

  return json.access_token;
}

// ─── Audit log helper ───────────────────────────────────────────────────────
async function log(professorId: string, direction: string, entityType: string, entityId: string | null, action: string, status: string, details?: any) {
  const supabase = getSupabase();
  await supabase.from("google_sync_log").insert({
    professor_id: professorId,
    direction,
    entity_type: entityType,
    entity_id: entityId,
    action,
    status,
    details,
  });
}

// ─── Pull helper (Google → Supabase DB) ─────────────────────────────────────
async function pullTurmasEAlunos(professorId: string, accessToken: string) {
  const supabase = getSupabase();
  let turmasSynced = 0;
  let alunosSynced = 0;

  const coursesRes = await googleFetch("/courses?courseStates=ACTIVE&pageSize=50", accessToken);
  if (!coursesRes.ok) throw new Error(`Google Classroom API error: ${coursesRes.status}`);

  const { courses = [] } = await coursesRes.json();

  for (const course of courses) {
    // Upsert turma in Supabase
    const { data: turma } = await supabase
      .from("turmas")
      .upsert({
        google_classroom_id: course.id,
        professor_id: professorId,
        nome: course.name,
        serie: course.section ?? "",
        disciplina: course.descriptionHeading ?? course.name,
        ano_letivo: new Date().getFullYear().toString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "google_classroom_id" })
      .select("id")
      .single();

    if (!turma) continue;
    turmasSynced++;

    // Sync students for this course
    const studentsRes = await googleFetch(`/courses/${course.id}/students?pageSize=100`, accessToken);
    if (!studentsRes.ok) continue;

    const { students = [] } = await studentsRes.json();

    for (const student of students) {
      await supabase.from("alunos").upsert({
        turma_id: turma.id,
        google_user_id: student.userId,
        nome: student.profile?.name?.fullName ?? "Aluno",
        email: student.profile?.emailAddress ?? null,
        matricula: student.userId,
        status: "ativo",
        updated_at: new Date().toISOString(),
      }, { onConflict: "google_user_id,turma_id" });

      alunosSynced++;
    }
  }

  return { turmasSynced, alunosSynced };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — Sistema → Google Classroom
// ═══════════════════════════════════════════════════════════════════════════

// POST /google-sync/turma/criar  →  creates course in Google Classroom
app.post("/google-sync/turma/criar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Não autorizado" }, 401);

  const { accessToken, nome, serie, disciplina } = await c.req.json();
  if (!accessToken) return c.json({ error: "accessToken obrigatório" }, 400);

  const res = await googleFetch("/courses", accessToken, {
    method: "POST",
    body: JSON.stringify({
      name: nome,
      section: serie,
      descriptionHeading: disciplina,
      courseState: "ACTIVE",
      ownerId: "me",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    await log(user.id, "to_google", "turma", null, "criar", "erro", { error: err });
    return c.json({ error: "Erro ao criar turma no Google Classroom", details: err }, 500);
  }

  const course = await res.json();
  await log(user.id, "to_google", "turma", course.id, "criar", "ok");
  return c.json({ success: true, googleId: course.id });
});

// PATCH /google-sync/turma/atualizar  →  updates course in Google Classroom
app.patch("/google-sync/turma/atualizar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Não autorizado" }, 401);

  const { accessToken, googleId, nome, serie } = await c.req.json();
  if (!accessToken || !googleId) return c.json({ error: "accessToken e googleId obrigatórios" }, 400);

  const body: any = {};
  const mask: string[] = [];
  if (nome) { body.name = nome; mask.push("name"); }
  if (serie) { body.section = serie; mask.push("section"); }
  if (!mask.length) return c.json({ success: true, message: "Nada para atualizar" });

  const res = await googleFetch(`/courses/${googleId}?updateMask=${mask.join(",")}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    await log(user.id, "to_google", "turma", googleId, "atualizar", "erro", { error: err });
    return c.json({ error: "Erro ao atualizar turma no Google Classroom", details: err }, 500);
  }

  await log(user.id, "to_google", "turma", googleId, "atualizar", "ok");
  return c.json({ success: true });
});

// PATCH /google-sync/turma/arquivar  →  archives (soft-deletes) course in Google
app.patch("/google-sync/turma/arquivar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Não autorizado" }, 401);

  const { accessToken, googleId } = await c.req.json();
  if (!accessToken || !googleId) return c.json({ error: "accessToken e googleId obrigatórios" }, 400);

  const res = await googleFetch(`/courses/${googleId}?updateMask=courseState`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ courseState: "ARCHIVED" }),
  });

  if (!res.ok) {
    const err = await res.text();
    await log(user.id, "to_google", "turma", googleId, "arquivar", "erro", { error: err });
    return c.json({ error: "Erro ao arquivar turma no Google Classroom", details: err }, 500);
  }

  await log(user.id, "to_google", "turma", googleId, "arquivar", "ok");
  return c.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — Google Classroom → Sistema (pull + webhook + cron)
// ═══════════════════════════════════════════════════════════════════════════

// POST /google-sync/pull  →  manual pull from Google → Supabase DB
app.post("/google-sync/pull", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Não autorizado" }, 401);

  const body = await c.req.json().catch(() => ({}));
  let accessToken: string = body.accessToken ?? "";

  // provider_token não persiste após refresh de página — usar token armazenado como fallback
  if (!accessToken) {
    const supabase = getSupabase();
    const { data: stored } = await supabase
      .from("google_tokens")
      .select("access_token, expires_at")
      .eq("professor_id", user.id)
      .single();

    if (!stored) {
      return c.json({ error: "Token do Google não encontrado. Faça login com Google primeiro." }, 400);
    }

    const expiresAt = new Date(stored.expires_at ?? 0).getTime();
    if (!stored.access_token || expiresAt < Date.now() + 5 * 60_000) {
      accessToken = (await refreshAccessToken(user.id)) ?? "";
    } else {
      accessToken = stored.access_token;
    }

    if (!accessToken) {
      return c.json({ error: "Token do Google expirado. Reconecte sua conta Google nas configurações." }, 400);
    }
  }

  try {
    const result = await pullTurmasEAlunos(user.id, accessToken);
    await log(user.id, "from_google", "turma", null, "pull", "ok", result);
    return c.json({ success: true, ...result });
  } catch (err: any) {
    await log(user.id, "from_google", "turma", null, "pull", "erro", { error: err.message });
    return c.json({ error: err.message }, 500);
  }
});

// POST /google-sync/token  →  store user's Google tokens for cron use
app.post("/google-sync/token", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Não autorizado" }, 401);

  const { accessToken, refreshToken, expiresAt } = await c.req.json();
  const supabase = getSupabase();

  await supabase.from("google_tokens").upsert({
    professor_id: user.id,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return c.json({ success: true });
});

// POST /google-sync/webhook/registrar  →  register Google push notification channel
app.post("/google-sync/webhook/registrar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Não autorizado" }, 401);

  const { accessToken, courseId } = await c.req.json();
  if (!accessToken) return c.json({ error: "accessToken obrigatório" }, 400);

  const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-sync/webhook`;

  const res = await fetch("https://classroom.googleapis.com/v1/registrations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      feed: courseId
        ? { feedType: "COURSE_ROSTER_CHANGES", courseRosterChangesInfo: { courseId } }
        : { feedType: "COURSE_WORK_CHANGES" },
      destinationUri: webhookUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return c.json({ error: "Erro ao registrar webhook", details: err }, 500);
  }

  const registration = await res.json();
  return c.json({ success: true, registrationId: registration.registrationId, expiry: registration.expiryTime });
});

// POST /google-sync/webhook  →  receive Google push notifications
app.post("/google-sync/webhook", async (c) => {
  // Google sends a JSON body with the change notification
  const body = await c.req.json().catch(() => ({}));
  console.log("[WEBHOOK] Notificação do Google Classroom:", JSON.stringify(body));

  // Extract changed entity info
  const { courseId, registrationId } = body;
  if (!courseId) return c.json({ ok: true }); // acknowledge even if no data

  // Find which professor owns this course and trigger a pull
  const supabase = getSupabase();
  const { data: turma } = await supabase
    .from("turmas")
    .select("professor_id")
    .eq("google_classroom_id", courseId)
    .single();

  if (turma) {
    const token = await refreshAccessToken(turma.professor_id);
    if (token) {
      await pullTurmasEAlunos(turma.professor_id, token).catch(console.error);
      await log(turma.professor_id, "from_google", "turma", courseId, "webhook", "ok", { registrationId });
    }
  }

  return c.json({ ok: true });
});

// POST /google-sync/cron  →  called by pg_cron every 30 min
app.post("/google-sync/cron", async (c) => {
  // Service-role only — no user auth required (called by pg_cron)
  const supabase = getSupabase();
  const { data: tokens } = await supabase
    .from("google_tokens")
    .select("professor_id, access_token, refresh_token, expires_at")
    .not("refresh_token", "is", null);

  const results: any[] = [];

  for (const tokenRow of tokens ?? []) {
    try {
      let accessToken = tokenRow.access_token;

      // Refresh if expired or about to expire (within 5 min)
      const expiresAt = new Date(tokenRow.expires_at ?? 0).getTime();
      if (!accessToken || expiresAt < Date.now() + 5 * 60_000) {
        accessToken = await refreshAccessToken(tokenRow.professor_id) ?? "";
      }

      if (!accessToken) {
        results.push({ professor_id: tokenRow.professor_id, error: "Sem token válido" });
        continue;
      }

      const result = await pullTurmasEAlunos(tokenRow.professor_id, accessToken);
      await log(tokenRow.professor_id, "cron", "turma", null, "pull", "ok", result);
      results.push({ professor_id: tokenRow.professor_id, ...result });
    } catch (err: any) {
      await log(tokenRow.professor_id, "cron", "turma", null, "pull", "erro", { error: err.message });
      results.push({ professor_id: tokenRow.professor_id, error: err.message });
    }
  }

  return c.json({ success: true, processed: results.length, results });
});

Deno.serve(app.fetch);
