-- Metas livres: o que você quer alcançar, escrito com suas palavras.
--
-- Diferente de `metas` (indicadores do método, com fórmula fixa) e de
-- `materiais` (de onde você estuda). Aqui cabe "ler 1 livro em inglês",
-- "assistir 8 episódios em espanhol", "gravar 10 áudios" — qualquer coisa
-- contável, com ou sem prazo.
--
-- `idioma_id` é opcional: existe meta que atravessa idioma ("fazer 3 aulas").

create table metas_livres (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idioma_id uuid references idiomas(id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  unidade text not null default 'unidade'
    check (char_length(trim(unidade)) between 1 and 24),
  alvo int not null check (alvo > 0 and alvo <= 100000),
  feito int not null default 0 check (feito >= 0 and feito <= 100000),
  prazo date,
  concluida_em date,
  nota text check (nota is null or char_length(nota) <= 500),
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- Marcar concluída sem ter chegado no alvo deixaria o número mentindo.
  constraint metas_livres_conclusao_coerente
    check (concluida_em is null or feito >= alvo)
);

create index metas_livres_user_ativa
  on metas_livres (user_id, ativa, prazo nulls last);
create index metas_livres_user_idioma
  on metas_livres (user_id, idioma_id);

create trigger metas_livres_atualizado_em
  before update on metas_livres
  for each row execute function public.set_atualizado_em();

alter table metas_livres enable row level security;
create policy metas_livres_proprio on metas_livres
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
