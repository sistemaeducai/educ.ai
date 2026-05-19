import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DadosBoletim {
  aluno: string;
  turma: string;
  periodo: string;
  mediaFinal: number;
  frequencia: number;
  participacao: number;
  notasPorBimestre: number[];
  observacao: string;
}

interface RequestBody {
  aluno_id: string;
  boletim: DadosBoletim;
}

function buildEmailHtml(boletim: DadosBoletim, professorNome: string): string {
  const cor = boletim.mediaFinal >= 7 ? "#22c55e" : boletim.mediaFinal >= 6 ? "#f59e0b" : "#ef4444";
  const situacao = boletim.mediaFinal >= 7 ? "Aprovado" : boletim.mediaFinal >= 6 ? "Em recuperação" : "Reprovado";

  const bimestres = boletim.notasPorBimestre.map((n, i) =>
    `<tr>
      <td style="padding:8px 16px;border-bottom:1px solid #f1f5f9;">${i + 1}º Bimestre</td>
      <td style="padding:8px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:600;color:${n >= 6 ? "#22c55e" : "#ef4444"};">${n.toFixed(1)}</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Boletim Escolar — ${boletim.aluno}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <!-- Cabeçalho -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;">
            <p style="margin:0;color:rgba(255,255,255,.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">EDUC.AI</p>
            <h1 style="margin:8px 0 4px;color:#ffffff;font-size:26px;font-weight:700;">Boletim Escolar</h1>
            <p style="margin:0;color:rgba(255,255,255,.85);font-size:15px;">${boletim.periodo}</p>
          </td>
        </tr>

        <!-- Dados do aluno -->
        <tr>
          <td style="padding:28px 40px 0;">
            <h2 style="margin:0 0 4px;font-size:20px;color:#1e293b;">${boletim.aluno}</h2>
            <p style="margin:0;color:#64748b;font-size:14px;">Turma: ${boletim.turma}</p>
          </td>
        </tr>

        <!-- Média e situação -->
        <tr>
          <td style="padding:20px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f8fafc;border-radius:10px;padding:20px;text-align:center;width:33%;">
                  <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Média Final</p>
                  <p style="margin:0;font-size:32px;font-weight:800;color:${cor};">${boletim.mediaFinal.toFixed(1)}</p>
                </td>
                <td width="12"></td>
                <td style="background:#f8fafc;border-radius:10px;padding:20px;text-align:center;width:33%;">
                  <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Frequência</p>
                  <p style="margin:0;font-size:32px;font-weight:800;color:#6366f1;">${boletim.frequencia}%</p>
                </td>
                <td width="12"></td>
                <td style="background:#f8fafc;border-radius:10px;padding:20px;text-align:center;width:33%;">
                  <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Situação</p>
                  <p style="margin:0;font-size:18px;font-weight:700;color:${cor};">${situacao}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Notas por bimestre -->
        <tr>
          <td style="padding:0 40px 24px;">
            <h3 style="margin:0 0 12px;font-size:14px;color:#1e293b;text-transform:uppercase;letter-spacing:.5px;">Notas por Bimestre</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:10px 16px;text-align:left;font-size:13px;color:#475569;font-weight:600;">Período</th>
                  <th style="padding:10px 16px;text-align:center;font-size:13px;color:#475569;font-weight:600;">Nota</th>
                </tr>
              </thead>
              <tbody>${bimestres}</tbody>
            </table>
          </td>
        </tr>

        <!-- Observação -->
        <tr>
          <td style="padding:0 40px 28px;">
            <div style="background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 8px 8px 0;padding:14px 16px;">
              <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">${boletim.observacao}</p>
            </div>
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
              Enviado por <strong>${professorNome}</strong> via EDUC.AI &bull; Este é um e-mail automático
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada no servidor" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const body: RequestBody = await req.json();
    const { aluno_id, boletim } = body;

    if (!aluno_id || !boletim) {
      return new Response(JSON.stringify({ error: "aluno_id e boletim são obrigatórios" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Busca email do aluno
    const { data: aluno, error: alunoErr } = await supabase
      .from("alunos")
      .select("nome, email")
      .eq("id", aluno_id)
      .single();

    if (alunoErr || !aluno) {
      return new Response(JSON.stringify({ error: "Aluno não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (!aluno.email) {
      await supabase.from("boletim_envios").insert({
        aluno_id,
        professor_id: user.id,
        periodo: boletim.periodo,
        email_destino: "",
        status: "erro",
        erro_msg: "Aluno sem e-mail cadastrado",
        dados_boletim: boletim,
      });

      return new Response(JSON.stringify({ error: "Aluno não possui e-mail cadastrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      });
    }

    // Busca nome do professor
    const { data: professor } = await supabase
      .from("usuarios")
      .select("nome")
      .eq("id", user.id)
      .single();

    const professorNome = professor?.nome ?? "Professor(a)";
    const html = buildEmailHtml(boletim, professorNome);

    // Envia via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EDUC.AI <onboarding@resend.dev>",
        to: [aluno.email],
        subject: `Boletim Escolar — ${boletim.aluno} | ${boletim.periodo}`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      await supabase.from("boletim_envios").insert({
        aluno_id,
        professor_id: user.id,
        periodo: boletim.periodo,
        email_destino: aluno.email,
        status: "erro",
        erro_msg: errBody,
        dados_boletim: boletim,
      });

      return new Response(JSON.stringify({ error: "Falha ao enviar e-mail", details: errBody }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    // Registra envio bem-sucedido
    await supabase.from("boletim_envios").insert({
      aluno_id,
      professor_id: user.id,
      periodo: boletim.periodo,
      email_destino: aluno.email,
      status: "enviado",
      dados_boletim: boletim,
    });

    return new Response(JSON.stringify({ success: true, email: aluno.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Erro interno" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
