-- Esquema inicial do Poliglota.
-- Modelo de dados: docs/03-modelo-de-dados.md
-- Cada pessoa tem seu próprio app: isolamento total por RLS em user_id.
-- Nenhuma linha é visível entre contas; não há compartilhamento (fronteira do produto).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type pilar as enum ('vocabulario', 'gramatica', 'pronuncia', 'fala');
create type categoria_sessao as enum ('ativo', 'imersao');
create type tempo_do_dia as enum ('cadeira', 'maos_livres', 'maos_ocupadas');

create type atividade as enum (
  'flashcards', 'gramatica', 'pronuncia', 'fala_sozinha', 'conversacao',
  'aula', 'audio_grupo', 'gravacao_video', 'escrita', 'conteudo_instagram',
  'leitura', 'serie_filme', 'podcast', 'audiobook', 'youtube',
  'browser_mode', 'outro'
);

create type nivel as enum (
  'A0', 'A1.1', 'A1.2', 'A2.1', 'A2.2',
  'B1.1', 'B1.2', 'B2.1', 'B2.2', 'C1.1', 'C1.2', 'C2'
);

create type origem_sessao as enum ('manual', 'toggl', 'automatica');
create type via_registro as enum ('formulario', 'cronometro', 'atalho', 'botao_regra');

create type tipo_tarefa as enum (
  'frases_apos_erro', 'ativar_palavras', 'audio_grupo', 'clube_conversacao',
  'autoavaliacao', 'gravar_video', 'aula_paga', 'retomada_fase', 'manual'
);
create type estado_tarefa as enum ('aberta', 'concluida', 'adiada', 'dispensada');
create type janela_tarefa as enum ('dia', 'semana', 'mes', 'bloco');
create type recorrencia_tarefa as enum ('nenhuma', 'diaria', 'semanal', 'mensal');

create type tipo_meta as enum ('palavras', 'nivel', 'conversacao', 'painel_mensal');
create type direcao_meta as enum ('maior_melhor', 'menor_melhor');
create type periodicidade_meta as enum ('dia', 'semana', 'mes', 'bloco', 'prazo_fixo');
create type cor_meta as enum ('longo_prazo', 'mensal', 'semanal');

create type dimensao_distribuicao as enum ('idioma', 'pilar');
create type estado_ponto as enum ('ok', 'errei', 'em_correcao');

create type categoria_conquista as enum (
  'consistencia', 'camada', 'producao', 'metodo', 'recuperacao'
);
create type escopo_conquista as enum ('global', 'por_idioma');
create type estado_conquista as enum ('bloqueada', 'conquistada');

create type tipo_material as enum (
  'app', 'livro', 'canal_youtube', 'podcast', 'curso', 'playlist',
  'lista_palavras', 'deck', 'outro'
);
create type tipo_recurso as enum (
  'dicionario', 'colocacoes', 'lista_frequencia', 'canal', 'podcast', 'app',
  'ipa', 'comunidade', 'clube', 'outro'
);

create type campo_regra_toggl as enum ('project', 'description', 'tags', 'client', 'task');
create type operador_regra_toggl as enum ('contem', 'igual', 'regex');

create type tema_app as enum ('claro', 'escuro', 'sistema');

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Configuração e catálogos por usuário
-- ---------------------------------------------------------------------------
create table config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tema tema_app not null default 'sistema',
  hora_aperto smallint not null default 20 check (hora_aperto between 0 and 23),
  dias_para_retomada smallint not null default 7 check (dias_para_retomada > 0),
  meta_pct_ativo numeric(4, 3) not null default 0.350,
  meta_min_fala_semana int not null default 60,
  meta_dias_flash_semana smallint not null default 5,
  lacuna_alerta smallint not null default 3,
  limiar_desvio_pilar numeric(4, 3) not null default 0.150,
  limiar_concentracao numeric(4, 3) not null default 0.400,
  lote_minimo_checagem smallint not null default 10,
  faixas_frequencia jsonb not null default '[
    {"ate": 2000, "rotulo": "Ainda em A1/A2 — as 2.000 mais frequentes tiram você daqui"},
    {"ate": 3000, "rotulo": "Saindo de A2"},
    {"ate": 9000, "rotulo": "Território B1/B2"},
    {"ate": null, "rotulo": "Faixa avançada"}
  ]'::jsonb,
  backup_automatico boolean not null default true,
  backup_ultimo_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table idiomas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  nome text not null,
  bandeira text not null default '',
  cor text not null default '#9AA095',
  ativo boolean not null default true,
  nivel_inicial nivel not null default 'A0',
  nivel_atual nivel not null default 'A0',
  nivel_meta nivel not null default 'B2.1',
  data_meta_nivel date,
  palavras_base int not null default 0 check (palavras_base >= 0),
  meta_palavras_dia int not null default 5 check (meta_palavras_dia >= 0),
  ordem smallint not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, slug)
);
create index idiomas_user_ativo on idiomas (user_id, ativo, ordem);

-- Limiares de camada: nunca hardcoded no código (regra 4 do CLAUDE.md).
create table camadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  numero smallint not null check (numero between 1 and 9),
  nome text not null,
  limiar int not null check (limiar > 0),
  unique (user_id, numero)
);

create table marchas_def (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  numero smallint not null check (numero between 1 and 3),
  nome text not null,
  descricao text not null default '',
  tarefas jsonb not null default '[]'::jsonb,
  unique (user_id, numero)
);

create table marcha_historico (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  numero smallint not null check (numero between 1 and 3),
  data_inicio date not null,
  data_fim date,
  motivo text,
  criado_em timestamptz not null default now(),
  check (data_fim is null or data_fim >= data_inicio)
);
create index marcha_historico_user_periodo on marcha_historico (user_id, data_inicio desc);
-- no máximo uma marcha vigente por usuário
create unique index marcha_historico_vigente on marcha_historico (user_id) where data_fim is null;

-- ---------------------------------------------------------------------------
-- Sessões — o registro central
-- ---------------------------------------------------------------------------
create table sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idioma_id uuid not null references idiomas(id) on delete restrict,
  data date not null,
  hora_inicio time,
  duracao_min int not null check (duracao_min between 1 and 480),
  categoria categoria_sessao not null,
  pilar pilar,
  atividade atividade not null,
  tempo tempo_do_dia not null,
  producao boolean not null default false,
  palavras_novas int not null default 0 check (palavras_novas >= 0),
  minutos_fala int not null default 0 check (minutos_fala >= 0),
  pontos_gramaticais int not null default 0 check (pontos_gramaticais >= 0),
  frases_produzidas int not null default 0 check (frases_produzidas >= 0),
  nota text check (nota is null or char_length(nota) <= 500),
  material_id uuid,
  violou_regra_5 boolean not null default false,
  origem origem_sessao not null default 'manual',
  via via_registro not null default 'formulario',
  chave_toggl text,
  lote_importacao uuid,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- invariantes de docs/03, 3.2
  constraint sessao_imersao_sem_pilar check (
    (categoria = 'imersao' and pilar is null and producao = false)
    or (categoria = 'ativo' and pilar is not null)
  ),
  constraint sessao_fala_cabe_na_duracao check (minutos_fala <= duracao_min)
);
create index sessoes_user_data on sessoes (user_id, data);
create index sessoes_user_idioma_data on sessoes (user_id, idioma_id, data);
create index sessoes_user_data_categoria on sessoes (user_id, data, categoria);
create index sessoes_user_data_pilar on sessoes (user_id, data, pilar);
create index sessoes_user_atividade on sessoes (user_id, atividade);
create index sessoes_lote on sessoes (lote_importacao) where lote_importacao is not null;
create unique index sessoes_chave_toggl on sessoes (user_id, chave_toggl) where chave_toggl is not null;

-- ---------------------------------------------------------------------------
-- Vocabulário — contagens, nunca cartões (RN-003)
-- ---------------------------------------------------------------------------
create table registros_vocabulario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idioma_id uuid not null references idiomas(id) on delete cascade,
  data date not null,
  palavras_novas int not null default 0 check (palavras_novas >= 0),
  palavras_ativadas int not null default 0 check (palavras_ativadas >= 0),
  minutos_criacao int check (minutos_criacao is null or minutos_criacao >= 0),
  min_por_palavra numeric(6, 2),
  faixa_velocidade text,
  checagem_rodada boolean not null default false,
  qtd_avisos_interferencia int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, idioma_id, data)
);
create index registros_vocab_user_data on registros_vocabulario (user_id, data);

create table revisoes_flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idioma_id uuid not null references idiomas(id) on delete cascade,
  data date not null,
  revisou boolean not null default true,
  pct_acerto_deck smallint check (pct_acerto_deck between 0 and 100),
  pct_acerto_gramatica smallint check (pct_acerto_gramatica between 0 and 100),
  criado_em timestamptz not null default now(),
  unique (user_id, idioma_id, data)
);
create index revisoes_user_data on revisoes_flashcards (user_id, data) where revisou;

create table pontos_gramaticais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idioma_id uuid not null references idiomas(id) on delete cascade,
  titulo text not null check (char_length(titulo) <= 120),
  material_id uuid,
  estudado_em date not null,
  estado estado_ponto not null default 'ok',
  marcado_errei_em date,
  frases_exigidas smallint not null default 2,
  frases_feitas smallint not null default 0,
  ultima_revisao_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index pontos_user_estado on pontos_gramaticais (user_id, estado);

-- ---------------------------------------------------------------------------
-- Tarefas e metas
-- ---------------------------------------------------------------------------
create table tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo tipo_tarefa not null,
  automatica boolean not null default false,
  titulo text not null check (char_length(titulo) <= 140),
  idioma_id uuid references idiomas(id) on delete cascade,
  data_prevista date not null,
  janela janela_tarefa not null default 'dia',
  chave_idempotencia text not null,
  quantidade_exigida int not null default 1 check (quantidade_exigida >= 1),
  quantidade_feita int not null default 0 check (quantidade_feita >= 0),
  estado estado_tarefa not null default 'aberta',
  recorrencia recorrencia_tarefa not null default 'nenhuma',
  meta_id uuid,
  ponto_gramatical_id uuid references pontos_gramaticais(id) on delete cascade,
  sessao_id uuid references sessoes(id) on delete set null,
  adiada_vezes smallint not null default 0,
  concluida_em date,
  dispensada_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index tarefas_user_estado_data on tarefas (user_id, estado, data_prevista);
create index tarefas_user_tipo on tarefas (user_id, tipo);
-- idempotência: uma tarefa aberta por chave (RN-802)
create unique index tarefas_idempotencia_aberta
  on tarefas (user_id, chave_idempotencia) where estado = 'aberta';

create table metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo tipo_meta not null,
  idioma_id uuid references idiomas(id) on delete cascade,
  titulo text not null,
  indicador text not null,
  valor_base numeric not null default 0,
  valor_alvo numeric not null,
  direcao direcao_meta not null default 'maior_melhor',
  periodicidade periodicidade_meta not null,
  data_alvo date,
  cor cor_meta not null default 'mensal',
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index metas_user_tipo on metas (user_id, tipo, ativa);
alter table tarefas add constraint tarefas_meta_fk
  foreign key (meta_id) references metas(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Plano e distribuição
-- ---------------------------------------------------------------------------
create table blocos_plano (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  data_inicio date not null,
  data_fim date not null,
  idioma_foco uuid references idiomas(id) on delete set null,
  foco_mes_idioma uuid references idiomas(id) on delete set null,
  foco_mes_pilar pilar,
  foco_mes_nota text check (foco_mes_nota is null or char_length(foco_mes_nota) <= 200),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (data_fim >= data_inicio)
);
create index blocos_user_periodo on blocos_plano (user_id, data_inicio);

create table distribuicao_alvo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bloco_id uuid references blocos_plano(id) on delete cascade,
  dimensao dimensao_distribuicao not null,
  chave text not null,
  percentual smallint not null check (percentual between 0 and 100),
  atualizado_em timestamptz not null default now()
);
create unique index distribuicao_unica
  on distribuicao_alvo (user_id, coalesce(bloco_id, '00000000-0000-0000-0000-000000000000'::uuid), dimensao, chave);

-- ---------------------------------------------------------------------------
-- Acervo
-- ---------------------------------------------------------------------------
create table materiais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idioma_id uuid not null references idiomas(id) on delete cascade,
  tipo tipo_material not null default 'livro',
  titulo text not null,
  principal boolean not null default false,
  unidade text not null default 'licao',
  posicao_atual int not null default 0 check (posicao_atual >= 0),
  total int check (total is null or total > 0),
  ultima_sessao_em date,
  url text,
  nota text check (nota is null or char_length(nota) <= 500),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index materiais_user_idioma on materiais (user_id, idioma_id, ativo);
-- um material principal por idioma
create unique index materiais_um_principal
  on materiais (user_id, idioma_id) where principal;
alter table sessoes add constraint sessoes_material_fk
  foreign key (material_id) references materiais(id) on delete set null;
alter table pontos_gramaticais add constraint pontos_material_fk
  foreign key (material_id) references materiais(id) on delete set null;

create table recursos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  url text not null,
  tipo tipo_recurso not null default 'outro',
  idiomas uuid[] not null default '{}',
  pilares pilar[] not null default '{}',
  favorito boolean not null default false,
  nota text check (nota is null or char_length(nota) <= 300),
  ultimo_acesso_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index recursos_user_tipo on recursos (user_id, tipo);
create index recursos_idiomas on recursos using gin (idiomas);

create table autoavaliacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idioma_id uuid not null references idiomas(id) on delete cascade,
  bloco_id uuid not null references blocos_plano(id) on delete cascade,
  data date not null,
  nivel_declarado nivel not null,
  nivel_anterior nivel not null,
  observacao text check (observacao is null or char_length(observacao) <= 1000),
  pontos_fortes text,
  pontos_fracos text,
  criado_em timestamptz not null default now(),
  unique (user_id, idioma_id, bloco_id)
);

-- ---------------------------------------------------------------------------
-- Conquistas — catálogo global, estado por usuário
-- ---------------------------------------------------------------------------
create table conquistas (
  codigo text primary key,
  nome text not null,
  categoria categoria_conquista not null,
  criterio_texto text not null,
  criterio_chave text not null,
  parametros jsonb not null default '{}'::jsonb,
  escopo escopo_conquista not null default 'global',
  repetivel boolean not null default false,
  janela_repeticao text,
  ordem int not null default 0
);

create table conquista_estado (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conquista_codigo text not null references conquistas(codigo) on delete cascade,
  idioma_id uuid references idiomas(id) on delete cascade,
  estado estado_conquista not null default 'bloqueada',
  progresso_atual numeric not null default 0,
  progresso_alvo numeric not null default 1,
  conquistada_em date,
  vezes int not null default 0,
  ultima_avaliacao_em timestamptz
);
create unique index conquista_estado_unico
  on conquista_estado (user_id, conquista_codigo, coalesce(idioma_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index conquista_estado_user on conquista_estado (user_id, estado);

-- ---------------------------------------------------------------------------
-- Retomada
-- ---------------------------------------------------------------------------
create table retomadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inicio date not null,
  dias_de_lacuna int not null,
  fase smallint not null default 1 check (fase between 1 and 5),
  ativa boolean not null default true,
  concluida_em date,
  abandonada boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index retomada_ativa_unica on retomadas (user_id) where ativa;

create table retomada_fases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  retomada_id uuid not null references retomadas(id) on delete cascade,
  fase smallint not null check (fase between 1 and 5),
  data date not null,
  cumprida boolean not null default false,
  unique (retomada_id, fase, data)
);

-- ---------------------------------------------------------------------------
-- Importação do Toggl
-- ---------------------------------------------------------------------------
create table regras_mapeamento_toggl (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ordem int not null default 0,
  campo campo_regra_toggl not null,
  operador operador_regra_toggl not null default 'contem',
  valor text not null,
  saida_idioma uuid references idiomas(id) on delete cascade,
  saida_atividade atividade,
  saida_pilar pilar,
  saida_tempo tempo_do_dia,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);
create index regras_toggl_user_ordem on regras_mapeamento_toggl (user_id, ordem);

create table lotes_importacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  arquivo_nome text not null,
  importado_em timestamptz not null default now(),
  intervalo_inicio date,
  intervalo_fim date,
  linhas_total int not null default 0,
  importadas int not null default 0,
  ignoradas int not null default 0,
  conflitos int not null default 0,
  revisadas_manualmente int not null default 0,
  desfeito_em timestamptz
);
alter table sessoes add constraint sessoes_lote_fk
  foreign key (lote_importacao) references lotes_importacao(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Telemetria local do produto (nunca sai da conta do usuário)
-- ---------------------------------------------------------------------------
create table log_abertura_app (
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  aberturas int not null default 1,
  primary key (user_id, data)
);

create table telemetria_registro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  momento timestamptz not null default now(),
  duracao_ms int not null,
  via via_registro not null
);
create index telemetria_user_momento on telemetria_registro (user_id, momento desc);

-- ---------------------------------------------------------------------------
-- Gatilhos de atualizado_em
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'config', 'idiomas', 'sessoes', 'registros_vocabulario', 'pontos_gramaticais',
    'tarefas', 'metas', 'blocos_plano', 'materiais', 'recursos', 'retomadas'
  ] loop
    execute format(
      'create trigger %I_atualizado_em before update on %I
       for each row execute function public.set_atualizado_em()', t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS: tudo por user_id = auth.uid()
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'config', 'idiomas', 'camadas', 'marchas_def', 'marcha_historico', 'sessoes',
    'registros_vocabulario', 'revisoes_flashcards', 'pontos_gramaticais', 'tarefas',
    'metas', 'blocos_plano', 'distribuicao_alvo', 'materiais', 'recursos',
    'autoavaliacoes', 'conquista_estado', 'retomadas', 'retomada_fases',
    'regras_mapeamento_toggl', 'lotes_importacao', 'log_abertura_app', 'telemetria_registro'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_proprio on %I for all to authenticated
       using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t, t
    );
  end loop;
end $$;

-- Catálogo de conquistas: leitura para qualquer autenticado, escrita só por migração.
alter table conquistas enable row level security;
create policy conquistas_leitura on conquistas for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Bootstrap: toda conta nova nasce configurada e VAZIA de histórico.
-- É o que permite mandar o app para outra pessoa sem levar dado junto.
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_usuario(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from config where user_id = uid) then
    return;
  end if;

  insert into config (user_id) values (uid);

  insert into idiomas (user_id, slug, nome, bandeira, cor, ordem)
  values
    (uid, 'ingles',   'Inglês',   '🇺🇸', '#2F6FED', 1),
    (uid, 'espanhol', 'Espanhol', '🇪🇸', '#E4A11B', 2),
    (uid, 'frances',  'Francês',  '🇫🇷', '#D14D5A', 3);

  insert into camadas (user_id, numero, nome, limiar) values
    (uid, 1, 'Viajante',  1500),
    (uid, 2, 'Conexão',   3000),
    (uid, 3, 'Negócios',  5000),
    (uid, 4, 'Acadêmico', 10000),
    (uid, 5, 'Maestria',  20000);

  insert into marchas_def (user_id, numero, nome, descricao, tarefas) values
    (uid, 1, 'Sobrevivência', '~15 min/dia', '[
      {"chave":"flashcards","titulo":"Revisar flashcards","dias_semana":[1,2,3,4,5,6,7],"escopo":"dia","criterio":{"tipo":"check_flashcards"},"opcional":false},
      {"chave":"fala_1min","titulo":"1 minuto de fala","dias_semana":[1,2,3,4,5,6,7],"escopo":"dia","criterio":{"tipo":"minutos_fala","min":1},"opcional":false},
      {"chave":"imersao_maos_ocupadas","titulo":"Imersão de mãos ocupadas","dias_semana":[1,2,3,4,5,6,7],"escopo":"dia","criterio":{"tipo":"minutos_categoria_tempo","categoria":"imersao","tempo":"maos_ocupadas","min":1},"opcional":false}
    ]'::jsonb),
    (uid, 2, 'Cruzeiro', '~5 h/semana', '[
      {"chave":"bloco_manha","titulo":"Bloco de 40 min pela manhã","dias_semana":[1,2,3,4],"escopo":"dia","criterio":{"tipo":"minutos_categoria_tempo","categoria":"ativo","tempo":"cadeira","min":40},"opcional":false},
      {"chave":"clube","titulo":"Clube de conversação","dias_semana":[],"escopo":"semana","criterio":{"tipo":"sessao_atividade","atividade":"conversacao","min":1},"opcional":false},
      {"chave":"audio_grupo","titulo":"1 áudio no grupo","dias_semana":[],"escopo":"semana","criterio":{"tipo":"sessao_atividade","atividade":"audio_grupo","min":1},"opcional":false},
      {"chave":"sexta_pronuncia","titulo":"Sexta de pronúncia (25 min)","dias_semana":[5],"escopo":"dia","criterio":{"tipo":"minutos_pilar","pilar":"pronuncia","min":25},"opcional":false}
    ]'::jsonb),
    (uid, 3, 'Turbo', '8–10 h/semana', '[
      {"chave":"aula_extra","titulo":"Aula particular ou conversação extra","dias_semana":[],"escopo":"semana","criterio":{"tipo":"sessao_atividade","atividade":"aula","min":1},"opcional":false},
      {"chave":"sabado_escrita","titulo":"Bloco de sábado: revisão + escrita","dias_semana":[6],"escopo":"dia","criterio":{"tipo":"sessao_atividade","atividade":"escrita","min":1},"opcional":false},
      {"chave":"instagram","titulo":"Conteúdo no Instagram","dias_semana":[],"escopo":"semana","criterio":{"tipo":"sessao_atividade","atividade":"conteudo_instagram","min":1},"opcional":true}
    ]'::jsonb);

  insert into marcha_historico (user_id, numero, data_inicio)
  values (uid, 1, (now() at time zone 'America/Sao_Paulo')::date);

  -- divisão-alvo global dos pilares (docs/02, RN-703)
  insert into distribuicao_alvo (user_id, bloco_id, dimensao, chave, percentual) values
    (uid, null, 'pilar', 'vocabulario', 25),
    (uid, null, 'pilar', 'gramatica',   25),
    (uid, null, 'pilar', 'pronuncia',   20),
    (uid, null, 'pilar', 'fala',        30);

  -- os cinco indicadores do painel mensal (RN-507)
  insert into metas (user_id, tipo, titulo, indicador, valor_base, valor_alvo, direcao, periodicidade, cor) values
    (uid, 'painel_mensal', 'Dias com registro',        'dias_registro',      0, 20, 'maior_melhor', 'mes',    'mensal'),
    (uid, 'painel_mensal', 'Tempo em estudo ativo',    'pct_ativo',          0, 0.35, 'maior_melhor', 'mes',  'mensal'),
    (uid, 'painel_mensal', 'Minutos de fala por semana','min_fala_semana',   0, 60, 'maior_melhor', 'semana', 'mensal'),
    (uid, 'painel_mensal', 'Dias com flashcards',      'dias_flash_semana',  0, 5,  'maior_melhor', 'semana', 'mensal'),
    (uid, 'painel_mensal', 'Maior lacuna do mês',      'maior_lacuna',      30, 2,  'menor_melhor', 'mes',    'mensal');

  -- metas por idioma
  insert into metas (user_id, tipo, idioma_id, titulo, indicador, valor_alvo, periodicidade, cor)
  select uid, 'palavras', i.id, 'Palavras novas por dia — ' || i.nome, 'palavras_dia', i.meta_palavras_dia, 'dia', 'longo_prazo'
  from idiomas i where i.user_id = uid;

  insert into metas (user_id, tipo, idioma_id, titulo, indicador, valor_alvo, periodicidade, cor)
  select uid, 'nivel', i.id, 'Nível — ' || i.nome, 'nivel', 1, 'bloco', 'longo_prazo'
  from idiomas i where i.user_id = uid;

  insert into metas (user_id, tipo, titulo, indicador, valor_alvo, periodicidade, cor) values
    (uid, 'conversacao', 'Conversações por semana',   'conversas_semana', 1,  'semana', 'semanal'),
    (uid, 'conversacao', 'Minutos de fala por semana','min_fala_semana',  60, 'semana', 'semanal'),
    (uid, 'conversacao', 'Áudio no grupo',            'audio_semana',     1,  'semana', 'semanal');

  -- estado inicial das conquistas
  insert into conquista_estado (user_id, conquista_codigo, idioma_id, progresso_alvo)
  select uid, c.codigo, null, 1 from conquistas c where c.escopo = 'global'
  union all
  select uid, c.codigo, i.id, 1
  from conquistas c cross join idiomas i
  where c.escopo = 'por_idioma' and i.user_id = uid;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.bootstrap_usuario(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
