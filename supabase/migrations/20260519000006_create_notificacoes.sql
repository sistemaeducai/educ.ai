create table if not exists public.notificacoes (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users(id) on delete cascade,
  tipo       text not null check (tipo in ('aprovacao', 'aluno_risco', 'atividade', 'sistema')),
  titulo     text not null,
  mensagem   text not null,
  lida       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notificacoes enable row level security;

create policy "usuarios veem suas notificacoes"
  on public.notificacoes for select
  using (usuario_id = auth.uid());

create policy "usuarios marcam suas notificacoes como lidas"
  on public.notificacoes for update
  using (usuario_id = auth.uid());

create policy "service role insere notificacoes"
  on public.notificacoes for insert
  with check (true);

create index if not exists idx_notificacoes_usuario_lida
  on public.notificacoes (usuario_id, lida, created_at desc);
