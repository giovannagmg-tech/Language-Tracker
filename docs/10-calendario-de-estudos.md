# 10 — Calendário de estudos

> **Status:** briefing fechado, decisões tomadas em 09/09/2026. Nada implementado.
> Referência visual: planner Poliglota (capturas de 09/09/2026).

---

## 1. O problema

Hoje o app responde bem a **"o que eu faço agora"** (tela Hoje) e a **"como
estou indo"** (Dashboard, Metas). Depois da tela `/historico`, também responde
a **"o que eu fiz"**.

Falta responder a duas perguntas que só um calendário responde:

1. **"Como foi meu mês?"** — ver constância, volume e buracos de relance.
2. **"O que vou fazer na quinta?"** — colocar intenção numa data futura.

A segunda é a novidade real. O app hoje só sabe do presente: as tarefas nascem
da marcha, para o dia corrente, e somem. Não existe forma de planejar.

---

## 2. O que já existe — e por que isso encolhe o projeto

A tabela `tarefas` foi desenhada com data desde o início:

| Coluna | Já serve para |
|---|---|
| `data_prevista` | posicionar a tarefa numa célula do calendário |
| `janela` | `dia` · `semana` · `mes` · `bloco` |
| `recorrencia` | `nenhuma` · `diaria` · `semanal` · `mensal` |
| `estado` | `aberta` · `concluida` · `adiada` · `dispensada` |
| `automatica` | separa o que a marcha gerou do que ela escreveu |
| `quantidade_exigida` / `quantidade_feita` | "0/2 frases" |
| `tipo` | já inclui `manual` |
| `adiada_vezes` | `RN-803`, adiar uma vez só |

E as sessões já dão a camada do "feito", com `data`, `duracao_min`, `categoria`,
`pilar` e `idioma_id`.

**Conclusão:** o calendário é majoritariamente uma *tela*. O delta de banco é
pequeno (seção 5). Isso é o oposto do que a referência sugere à primeira vista.

---

## 3. Escopo

### 3.1 Faz

- **Visão de mês e de semana**, alternáveis, navegando para trás e para frente.
- **Cada célula de dia mostra duas camadas**: o que foi **feito** (sessões) e o
  que está **planejado** (tarefas abertas). Nunca se confundem visualmente.
- **Filtro por idioma**: `Todos · 🇺🇸 · 🇪🇸 · 🇫🇷`. "Todos" existe justamente
  para dar noção de volume; o filtro por idioma, para enxergar um de cada vez.
- **Painel do dia** ao clicar numa célula: tarefas com concluir, editar,
  duplicar, adiar e excluir; e as sessões daquele dia.
- **Criar tarefa numa data**, com idioma, pilar, duração prevista, horário
  opcional, recorrência, recursos vinculados e subtarefas.
- **Arrastar tarefa de um dia para outro** (equivale a adiar, respeita `RN-803`).
- **Busca** por título, no histórico inteiro — não só no mês visível.

### 3.2 Não faz — fronteiras

- **Não substitui o motor de marcha.** As tarefas automáticas continuam nascendo
  de `lib/motores/tarefas.ts`. O calendário as **mostra**; não as inventa nem as
  apaga. Planejar à mão é adição, não substituição.
- **Não gerencia flashcards.** Dá para agendar *"revisar flashcards"* como
  tarefa; nunca gerenciar cartão.
- **Não vira cobrança de imersão.** `RN-002` continua valendo.
- **Não é agenda geral.** Nutrição, CNH e freela ficam no Toggl.
- **Não sincroniza com Google Calendar.** Fora de escopo nesta rodada.
- **Não mostra idioma inativo.** Italiano e alemão têm histórico, e ele aparece
  em `/historico` — mas fora do calendário, que é ferramenta do que está em
  andamento.

---

## 4. As telas

### 4.1 Mês

Grade de sete colunas, **domingo a sábado**. Cabeçalho com o mês, setas,
alternador **Semana · Mês**, filtro de idioma, busca e botão **+ Tarefa**.

Cada célula:

```
┌─────────────────┐
│ 9            ★  │  número do dia · ★ marca a tarefa do dia
│ 🇺🇸 🇪🇸          │  idiomas com sessão nesse dia
│ ▇▇▇▁            │  barra fina: minutos do dia (feito)
│ ● ● ○           │  tarefas concluídas (●) e abertas (○)
└─────────────────┘
```

- **Dia sem nada** fica vazio e silencioso. Estado vazio é feature (regra 6):
  um mês em branco não pode gritar fracasso.
- **Dia futuro** não mostra barra de "feito", só planejado.
- **Dia passado com tarefa aberta** mostra o ponto em vermelho — ver `RN-1211`.

[DECISÃO: bandeira + barra + pontos, em vez do código de duas letras da
referência ("US"). O app inteiro já identifica idioma por bandeira; um segundo
código seria vocabulário a mais para aprender.]

[DECISÃO: semana começa no **domingo**, contrariando a referência, que começa
na segunda.]

### 4.2 Semana

Mesmas células, mais altas, com os títulos das tarefas legíveis em vez de
pontos. É a visão de trabalho; o mês é a visão de constância.

### 4.3 Painel do dia

Abre ao clicar na célula. Três seções, nesta ordem:

1. **Atrasadas** — só aparece no dia de hoje, e só se houver. Lista as tarefas
   abertas de dias que já passaram, com a data original visível.
2. **Feito** — as sessões do dia, iguais às do `/historico`, com o mesmo botão
   de excluir. Reaproveita `components/historico/tabela`, sem duplicar componente.
3. **Planejado** — as tarefas do dia. Tarefa automática mostra ícone de
   engrenagem e título não editável, como já manda `docs/04`.

### 4.4 Formulário de tarefa

| Campo | Obrigatório | Observação |
|---|---|---|
| Título | sim | livre |
| Idioma | não | "qualquer um" é válido |
| Data | sim | padrão: o dia clicado |
| Pilar | não | vocabulário · gramática · pronúncia · fala |
| Duração prevista | não | minutos |
| Horário | não | só informativo, não dispara nada |
| **É a tarefa do dia** | não | marcador único por dia — ver `RN-1212` |
| Repetir | não | frequência + **data final** |
| Recursos vinculados | não | do acervo que já existe |
| Observações | não | até 500 caracteres |
| Subtarefas | não | lista simples, arrastável, cada uma com seu check |

---

## 5. Delta de banco

### 5.1 Colunas novas em `tarefas`

```sql
alter table tarefas
  add column descricao text check (descricao is null or char_length(descricao) <= 500),
  add column hora_prevista time,
  add column duracao_prevista_min int check (duracao_prevista_min between 1 and 480),
  add column pilar pilar,
  add column recorrencia_ate date,
  add column serie_id uuid,          -- agrupa as ocorrências de uma repetição
  add column do_dia boolean not null default false;

-- "A do dia" é uma só. O banco garante, não a tela.
create unique index tarefas_uma_do_dia
  on tarefas (user_id, data_prevista) where do_dia;
```

### 5.2 Tabelas novas

```sql
create table tarefa_passos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tarefa_id uuid not null references tarefas(id) on delete cascade,
  ordem smallint not null default 0,
  titulo text not null check (char_length(trim(titulo)) between 1 and 140),
  feito boolean not null default false
);

create table tarefa_recursos (
  tarefa_id uuid not null references tarefas(id) on delete cascade,
  recurso_id uuid references recursos(id) on delete cascade,
  material_id uuid references materiais(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  constraint um_alvo check (num_nonnulls(recurso_id, material_id) = 1)
);
```

RLS por `user_id = auth.uid()` nas duas, como em todas as outras.

### 5.3 O que **não** entra

- **Tags.** A referência as exige. Aqui já existem quatro eixos com regra
  computável atrás — idioma, pilar, atividade, recurso. Tag seria um quinto eixo
  sem regra nenhuma, e sem regra ela vira gaveta.
  [DECISÃO: fora da v1.]
- **Prioridade baixa/média/alta.** No método, a prioridade do dia é decidida
  pelas seis regras e pela marcha. Três níveis à mão criariam duas fontes de
  verdade que podem se contradizer.
  [DECISÃO: fora. Entra no lugar um marcador único — "a do dia" — que não
  compete com o semáforo porque não classifica: escolhe uma.]
- **Fases antes/durante/depois nas subtarefas.**
  [DECISÃO: lista simples. A ordem em que ela escreve já carrega a sequência, e
  `ordem` na tabela permite acrescentar fase depois sem refazer nada.]
- **"Competência" separada.** A referência tem *Leitura* como competência. No
  método, leitura é **atividade de imersão**, e os pilares são quatro. Um eixo
  paralelo fraturaria o modelo que o Dashboard inteiro usa.
  [DECISÃO: usar `pilar`.]
- **Faixa dos blocos do plano no fundo do calendário.** [DECISÃO: fora.]

---

## 6. Regras de negócio

Numeração seguindo `docs/02`, bloco 12 livre.

| Regra | Gatilho | Ação |
|---|---|---|
| `RN-1201` | Abrir o calendário | Carrega sessões e tarefas do período visível, nada além |
| `RN-1202` | Célula de dia futuro | Nunca mostra barra de "feito"; só planejado |
| `RN-1203` | Arrastar tarefa para outro dia | Muda `data_prevista` e incrementa `adiada_vezes`; bloqueia na segunda vez (`RN-803`) |
| `RN-1204` | Tarefa automática | Não editável nem arrastável; só concluída ou dispensada |
| `RN-1205` | Criar tarefa com repetição | **Gera as ocorrências no banco** até `recorrencia_ate`, com `serie_id` comum, teto de 366 |
| `RN-1206` | Editar tarefa de uma série | Pergunta "só esta" ou "esta e as seguintes" |
| `RN-1207` | Concluir tarefa | Abre o registro rápido pré-preenchido com idioma, pilar e duração prevista. **Salvar grava a sessão e conclui a tarefa no mesmo gesto** |
| `RN-1208` | Excluir tarefa concluída | Não apaga a sessão; são registros independentes |
| `RN-1209` | Mês sem nenhum registro | Estado vazio neutro, sem número vermelho e sem cobrança |
| `RN-1210` | Busca | Varre o histórico inteiro, não só o período visível; o resultado diz em que mês está |
| `RN-1211` | Tarefa aberta em dia que passou | Continua ancorada na data original, em vermelho, **e** aparece em "Atrasadas" no painel de hoje. Nunca some |
| `RN-1212` | Marcar "a do dia" | Desmarca automaticamente a anterior daquele dia — o índice único garante |
| `RN-1213` | Filtro de idioma | Só idiomas `ativo = true`; um idioma sem nenhuma tarefa nem sessão no período não ganha pastilha |

---

## 7. Conflitos com o método — resolvidos

### 7.1 Concluir tarefa vira sessão?

A referência trata tarefa concluída como fato consumado. No Poliglota, **sessão
é medida** — alimenta Dashboard, camadas, conquistas e a linha de base de
`docs/09`. Se concluir "30 min de gramática" gravasse 30 minutos direto, o app
mediria **intenção** como **execução**, e todo número inflaria.

[DECISÃO: `RN-1207`. Concluir abre o registro rápido já preenchido; ela ajusta
o que for diferente e salva. Um gesto, dois efeitos: a sessão é gravada com o
que de fato aconteceu, e a tarefa fecha junto.]

### 7.2 Planejar contradiz "não force produção após imersão"?

Não, desde que o planejado nunca vire alerta. Tarefa agendada e não feita fica
vermelha no calendário, mas **não** entra em `regrasEmRisco` nem acende o
semáforo da tela Hoje. Atraso é informação, não cobrança.

### 7.3 Duas listas de tarefas?

`/tarefas` continua sendo a lista do presente; o calendário é outra vista da
mesma tabela, com item próprio na sidebar, rotulado **Calendário**. Nenhuma das
duas cria dado que a outra não veja.

---

## 8. Entrega sugerida

| Fase | Entrega | Depende de |
|---|---|---|
| A | Visão de mês só-leitura: sessões + tarefas existentes, filtro de idioma | **nada** |
| B | Painel do dia, com concluir (`RN-1207`), excluir e atrasadas | A |
| C | Criar e editar tarefa manual: data, pilar, duração, "a do dia" | B + colunas 5.1 |
| D | Recorrência com data final e séries | C |
| E | Recursos vinculados e subtarefas | C + tabelas 5.2 |
| F | Arrastar entre dias, visão de semana, busca no histórico todo | B |

A fase A já responde "como foi meu mês" **sem tocar no banco** — e agora ela
tem 251 sessões do ano importadas para desenhar. Vale entregar sozinha e usar
por uma semana antes de decidir o resto.

---

## 9. Decisões desta rodada

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Concluir tarefa | Abre o registro pré-preenchido; salvar conclui |
| 2 | Tarefa não feita | Continua visível como atrasada |
| 3 | Recorrência | Gerada no banco |
| 4 | Prioridade | Só o marcador "a do dia", um por dia |
| 5 | Blocos como faixa de fundo | Não |
| 6 | Início da semana | Domingo |
| 7 | Subtarefas | Lista simples, sem antes/durante/depois |
| 8 | Idiomas | Só ativos; com filtro por idioma e visão "todos" |
| 9 | Busca | Histórico inteiro |
| 10 | Nome na sidebar | Calendário |
