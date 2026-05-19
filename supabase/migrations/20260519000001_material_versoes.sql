create table if not exists public.material_versoes (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materiais(id) on delete cascade,
  versao integer not null default 1,
  conteudo_anterior text,
  descricao_mudanca text,
  autor_id uuid references public.usuarios(id),
  autor_nome text,
  created_at timestamptz default now()
);
alter table public.material_versoes enable row level security;
create policy "Professores veem versões dos seus materiais"
  on public.material_versoes for select
  using (autor_id = auth.uid());
create policy "Professores criam versões"
  on public.material_versoes for insert
  with check (autor_id = auth.uid());
