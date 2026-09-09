# 10 — Calendário de estudos

> **Status:** briefing para discussão. Nada aqui foi implementado.
> Referência visual: planner Poliglota (capturas de 09/09/2026).

---

## 1. O problema

Hoje o app responde bem a **"o que eu faço agora"** (tela Hoje) e a **"como
estou indo"** (Dashboard, Metas). Depois da tela `/historico`, também responde
a **"o que eu fiz"**.

Falta responder a duas perguntas que só um calendário responde:

1. **"Como foi meu mês?"** — ver constância e buracos de relance, não em lista.
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

- **Visão de mês e de semana**, alternáveis, com navegação para trás e para frente.
- **Cada célula de dia mostra duas camadas**: o que foi **feito** (sessões) e o
  que está **planejado** (tarefas abertas). São coisas diferentes e nunca se
  confundem visualmente.
- **Clicar num dia abre o painel do dia**: lista de tarefas com concluir,
  editar, duplicar, adiar e excluir; e a lista de sessões daquele dia.
- **Criar tarefa numa data**, com idioma, pilar, duração prevista, horário
  opcional, recorrência e recursos vinculados.
- **Arrastar tarefa de um dia para outro** (equivale a adiar, e respeita `RN-803`).
- **Busca** por título dentro do período visível.

### 3.2 Não faz — fronteiras

- **Não substitui o motor de marcha.** As tarefas automáticas continuam nascendo
  de `lib/motores/tarefas.ts`. O calendário as **mostra**; não as inventa nem as
  apaga. Planejar à mão é adição, não substituição.
- **Não gerencia flashcards.** Vale a fronteira de sempre: dá para agendar
  *"revisar flashcards"* como tarefa, nunca gerenciar cartão.
- **Não vira cobrança de imersão.** `RN-002` continua: nada agendado pode gerar
  cobrança de produção logo após imersão.
- **Não é agenda geral.** Nutrição, CNH e freela ficam no Toggl. O calendário é
  de estudo de idioma.
- **Não sincroniza com Google Calendar.** Fora de escopo nesta rodada.

---

## 4. As telas

### 4.1 Mês

Grade sete colunas, segunda a domingo. Cabeçalho com o mês, setas, alternador
**Semana · Mês**, campo de busca e botão **+ Tarefa**.

Cada célula:

```
┌─────────────────┐
│ 9               │   número do dia; hoje ganha contorno
│ 🇺🇸 🇪🇸          │   idiomas com sessão nesse dia
│ ▇▇▇▁            │   barra fina: minutos do dia (feito)
│ ● ● ○           │   pontos: tarefas abertas (○) e concluídas (●)
└─────────────────┘
```

- **Dia sem nada** fica vazio e silencioso. Estado vazio é feature (regra 6):
  um mês em branco não pode gritar fracasso.
- **Dia futuro** não mostra barra de feito, só pontos de planejado.

[DECISÃO: usar bandeira + barra + pontos em vez do código de duas letras da
referência ("US"). O app inteiro já identifica idioma por bandeira; introduzir
um segundo código seria um vocabulário a mais para aprender.]

### 4.2 Semana

Mesmas células, mais altas, com os títulos das tarefas legíveis em vez de
pontos. É a visão de trabalho; o mês é a visão de constância.

### 4.3 Painel do dia

Abre ao clicar na célula. Duas seções, nesta ordem:

1. **Feito** — as sessões do dia, iguais às do `/historico`, com o mesmo botão
   de excluir. Sem duplicar componente: reaproveita `components/historico/tabela`.
2. **Planejado** — as tarefas, cada uma com concluir · editar · duplicar ·
   adiar · excluir. Tarefa automática mostra ícone de engrenagem e título não
   editável, como já manda `docs/04`.

### 4.4 Formulário de tarefa

Campos, na ordem:

| Campo | Obrigatório | Observação |
|---|---|---|
| Título | sim | livre |
| Idioma | não | "qualquer um" é válido |
| Data | sim | padrão: o dia clicado |
| Pilar | não | vocabulário · gramática · pronúncia · fala |
| Duração prevista | não | minutos |
| Horário | não | só informativo, não dispara nada |
| Repetir | não | frequência + **data final** |
| Recursos vinculados | não | do acervo que já existe |
| Observações | não | até 500 caracteres |
| Passo a passo | não | subtarefas, com fase antes · durante · depois |

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
  add column serie_id uuid;   -- agrupa as ocorrências de uma repetição
```

### 5.2 Tabelas novas

```sql
create table tarefa_passos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tarefa_id uuid not null references tarefas(id) on delete cascade,
  fase text not null check (fase in ('antes','durante','depois')),
  ordem smallint not null default 0,
  titulo text not null check (char_length(titulo) between 1 and 140),
  feito boolean not null default false
);

create table tarefa_recursos (
  tarefa_id uuid not null references tarefas(id) on delete cascade,
  recurso_id uuid references recursos(id) on delete cascade,
  material_id uuid references materiais(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (tarefa_id, coalesce(recurso_id, material_id)),
  constraint um_alvo check (num_nonnulls(recurso_id, material_id) = 1)
);
```

RLS por `user_id = auth.uid()` nas duas, como em todas as outras.

### 5.3 O que **não** entra

- **Tags.** A referência as exige. Aqui já existem quatro eixos com regra
  computável atrás — idioma, pilar, atividade, recurso. Tag seria um quinto
  eixo sem regra nenhuma, e sem regra ela vira gaveta.
  [DECISÃO: fora da v1. Se depois faltar, entra com um relatório que a use.]
- **Prioridade (baixa/média/alta).** No método, a prioridade do dia é decidida
  pelas seis regras e pela marcha, não à mão. Uma tarefa "alta" que contradiga
  o semáforo criaria duas fontes de verdade.
  [DECISÃO: fora. Conflito real com `RN-307`, registrado na seção 7.]
- **"Competência" separada.** A referência tem *Leitura* como competência. No
  método, leitura é **atividade de imersão**, e os pilares são quatro. Criar um
  eixo paralelo fraturaria o modelo que o Dashboard inteiro usa.
  [DECISÃO: usar `pilar`. Leitura continua sendo atividade.]

---

## 6. Regras de negócio propostas

Numeração seguindo `docs/02`, bloco 12 livre.

| Regra | Gatilho | Ação |
|---|---|---|
| `RN-1201` | Abrir o calendário | Carrega sessões e tarefas do período visível, nada além |
| `RN-1202` | Célula de dia futuro | Nunca mostra barra de "feito"; só planejado |
| `RN-1203` | Arrastar tarefa para outro dia | Muda `data_prevista` e incrementa `adiada_vezes`; bloqueado na segunda vez (`RN-803`) |
| `RN-1204` | Tarefa automática | Não pode ser editada nem arrastada; só concluída ou dispensada |
| `RN-1205` | Criar tarefa com repetição | Gera as ocorrências até `recorrencia_ate`, com `serie_id` comum, teto de 366 |
| `RN-1206` | Editar tarefa de uma série | Pergunta "só esta" ou "esta e as seguintes" |
| `RN-1207` | Concluir tarefa com duração prevista | **Não** cria sessão automaticamente — ver seção 7 |
| `RN-1208` | Excluir tarefa concluída | Não apaga a sessão correspondente; são registros independentes |
| `RN-1209` | Mês sem nenhum registro | Estado vazio neutro, sem número vermelho e sem cobrança |
| `RN-1210` | Busca sem resultado | "Nada para '{termo}' neste período." + limpar |

---

## 7. Conflitos com o método — decidir antes de codar

### 7.1 Concluir tarefa deveria virar sessão?

A referência trata tarefa concluída como fato consumado. No Poliglota, **sessão
é medida** — alimenta Dashboard, camadas, conquistas e a linha de base de
`docs/09`. Se concluir uma tarefa de "30 min de gramática" gravasse 30 minutos
de sessão, o app passaria a medir **intenção** como se fosse **execução**, e
todo número do Dashboard ficaria inflado.

[DECISÃO: concluir tarefa **não** cria sessão. O botão de concluir abre o
registro rápido pré-preenchido, e ela confirma o que realmente aconteceu. Um
clique a mais, em troca de números que não mentem.]

### 7.2 Planejar contradiz "não force produção após imersão"?

Não, desde que o planejado nunca vire alerta. Uma tarefa agendada que não foi
feita **não** gera vermelho no semáforo nem entra em `regrasEmRisco`. Ela
simplesmente continua lá.

### 7.3 Duas listas de tarefas?

Hoje `/tarefas` já lista tarefas. O calendário é outra vista da mesma tabela.
[DECISÃO: `/tarefas` permanece como lista do presente; o calendário ganha item
próprio na sidebar. Nenhuma das duas cria dado que a outra não veja.]

---

## 8. Entrega sugerida

| Fase | Entrega | Depende de |
|---|---|---|
| A | Visão de mês só-leitura, sessões + tarefas existentes | nada |
| B | Painel do dia, com concluir e excluir | A |
| C | Criar e editar tarefa manual com data, pilar, duração | B + colunas 5.1 |
| D | Recorrência com data final e séries | C |
| E | Recursos vinculados e passo a passo | C + tabelas 5.2 |
| F | Arrastar entre dias, visão de semana, busca | B |

A fase A já responde "como foi meu mês" sem tocar no banco. Vale entregar
sozinha e usar por uma semana antes de decidir o resto.

---

## 9. Pontos a confirmar

1. Concluir tarefa abrindo o registro pré-preenchido (7.1) resolve, ou você
   prefere um botão que grave a sessão direto assumindo a duração prevista?
2. Tarefa não feita deve sumir do dia que passou, ou continuar visível como
   pendência arrastada?
3. Recorrência: gerar as ocorrências no banco (previsível, ocupa espaço) ou
   calcular na hora (elástico, mas não deixa marcar uma ocorrência isolada)?
4. Prioridade fora mesmo, ou você quer um marcador simples de "essa é a do dia"?
5. O calendário deve mostrar os blocos do plano quadrimestral como faixa de
   fundo, para você ver em que bloco cada semana cai?
6. Semana começa na segunda, como na referência — confirma?
7. Passo a passo com antes/durante/depois vale a complexidade, ou uma lista
   simples de subtarefas basta na v1?
8. Idiomas inativos (italiano, alemão) aparecem no calendário?
9. A busca deve varrer só o período visível ou o histórico inteiro?
10. Item na sidebar: "Calendário" ou "Planejamento"?
