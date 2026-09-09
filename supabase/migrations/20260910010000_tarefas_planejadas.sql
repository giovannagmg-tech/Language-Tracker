-- Calendário, fase C (docs/10, seção 5.1): tarefa escrita à mão numa data.
--
-- Tudo aqui é coluna nova em `tarefas`. A tabela já tinha data_prevista,
-- recorrencia, janela, estado e automatica — o planejamento manual precisava
-- só do que descreve a intenção: o que, com qual pilar, por quanto tempo.

alter table tarefas
  add column descricao text
    check (descricao is null or char_length(descricao) <= 500),
  add column hora_prevista time,
  add column duracao_prevista_min int
    check (duracao_prevista_min is null or duracao_prevista_min between 1 and 480),
  add column pilar pilar,
  add column recorrencia_ate date,
  add column serie_id uuid,
  add column do_dia boolean not null default false;

-- "A tarefa do dia" é uma só (docs/10, RN-1212). Quem garante é o banco:
-- deixar isso para a tela significaria duas abas abertas criando duas.
create unique index tarefas_uma_do_dia
  on tarefas (user_id, data_prevista) where do_dia;

-- O calendário varre por intervalo de data; sem isto vira varredura completa.
create index tarefas_user_data on tarefas (user_id, data_prevista);

-- Ocorrências de uma repetição (fase D) andam juntas.
create index tarefas_serie on tarefas (user_id, serie_id) where serie_id is not null;

comment on column tarefas.do_dia is
  'Marcador único por dia: se der para fazer uma coisa hoje, é esta. Substitui prioridade em três níveis, que competiria com o semáforo das seis regras.';
