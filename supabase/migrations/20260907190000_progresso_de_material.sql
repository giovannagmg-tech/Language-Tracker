-- Histórico de progresso do material principal.
--
-- Sem isto, a conquista "Material andando" (10 unidades avançadas no mês) não
-- tem como ser calculada: a tabela `materiais` guarda só a posição atual, e
-- comparar com o começo do mês exige saber onde ela estava.

create table material_progresso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references materiais(id) on delete cascade,
  data date not null,
  posicao int not null check (posicao >= 0),
  criado_em timestamptz not null default now(),
  unique (user_id, material_id, data)
);

create index material_progresso_user_data on material_progresso (user_id, data);

alter table material_progresso enable row level security;

create policy material_progresso_proprio on material_progresso
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Toda mudança de posição deixa um ponto no histórico. Uma linha por dia:
-- avançar três vezes no mesmo dia grava a última posição, não três linhas.
create or replace function public.registrar_progresso_material()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.posicao_atual is distinct from old.posicao_atual then
    insert into material_progresso (user_id, material_id, data, posicao)
    values (
      new.user_id,
      new.id,
      (now() at time zone 'America/Sao_Paulo')::date,
      new.posicao_atual
    )
    on conflict (user_id, material_id, data) do update set posicao = excluded.posicao;
  end if;
  return new;
end;
$$;

create trigger materiais_progresso
  after insert or update of posicao_atual on materiais
  for each row execute function public.registrar_progresso_material();
