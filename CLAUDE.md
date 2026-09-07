# Poliglota

App web pessoal de gestão de estudos de idiomas. **Uma única usuária**, três idiomas (inglês, espanhol, francês).

`docs/` é a fonte da verdade sobre **produto e comportamento**. Este arquivo é a fonte da verdade sobre **stack, processo e qualidade**. Em conflito: este arquivo vence na parte técnica, `docs/` vence na parte de produto — e o conflito é anunciado, nunca resolvido em silêncio.

## Conflitos já resolvidos entre `docs/` e este arquivo

| Assunto | `docs/` dizia | Vale agora | Consequência |
|---|---|---|---|
| Persistência | Local-first, IndexedDB/Dexie, sem servidor (doc 05) | **Supabase/Postgres** | Doc 05 está superado na seção de stack; o resto dele (fronteiras, estrutura de domínio, testes) continua valendo |
| Framework | Vite + React SPA (doc 05) | **Next.js App Router** | Idem |
| Identidade | "não existe `user_id` em lugar nenhum" (doc 03) | **Toda tabela tem `user_id` + RLS** | O modelo de dados do doc 03 vale integralmente; `user_id` é acrescentado a todas as tabelas |
| Gráficos | Recharts (doc 05) | Recharts | sem conflito |

## Stack

Next.js (App Router) · TypeScript strict · Tailwind + shadcn/ui · Supabase (Postgres + Auth) · Recharts · Zod · TanStack Query · date-fns (`America/Sao_Paulo` fixo) · Vitest · Playwright · Vercel.

Regras da stack:
- Sem ORM. Client do Supabase com tipos gerados (`npm run db:types`).
- Server Components por padrão. `"use client"` só onde há interação real.
- Server Actions para escrita. Route Handler só onde é obrigatório (upload de CSV do Toggl).
- Sem estado global. TanStack Query + URL como estado.
- Sem biblioteca de datas além de date-fns.
- Zero `any`, zero `@ts-ignore`. Tipo difícil = modelo errado.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm test` | Vitest (lógica de domínio) |
| `npm run test:e2e` | Playwright (fluxos críticos) |
| `npm run lint` | ESLint + `tsc --noEmit` |
| `npm run db:types` | `supabase gen types typescript` → `lib/supabase/types.ts` |
| `npm run db:migrate` | aplica `supabase/migrations/` |
| `npm run db:seed` | aplica `supabase/seed.sql` |

## Mapa de pastas

```
app/
  (auth)/login/              magic link, allowlist por env
  (app)/                     layout com sidebar
    dashboard/ hoje/ registro/ tarefas/ flashcards/ metas/
    revisao/ materiais/ recursos/ distribuicao/ conquistas/ configuracoes/
  api/toggl/import/route.ts  único Route Handler (upload de CSV)
components/
  ui/                        shadcn
  charts/                    wrappers de Recharts com os tokens
  <dominio>/                 componentes por área
lib/
  domain/                    FUNÇÕES PURAS — sem React, sem Supabase
    classificacao.ts marchas.ts regras.ts vocabulario.ts interferencia.ts
    camadas.ts retomada.ts metrics.ts conquistas.ts toggl.ts datas.ts
  actions/                   Server Actions (escrita)
  queries/                   leitura + hooks TanStack Query
  supabase/                  client server/browser, types.ts gerado
  schemas/                   Zod
supabase/
  migrations/                uma migração por mudança, nunca editada depois
  seed.sql
tests/                       Vitest, espelha lib/domain/
e2e/                         Playwright
docs/                        documentação de produto (fonte da verdade)
```

## As dez regras de engenharia

1. **Domínio fora do React.** Toda regra do método vive em `lib/domain/`, pura. Componente chama e renderiza.
2. **Teste antes da UI.** Toda função de domínio tem teste unitário antes de ser usada. Bordas obrigatórias: mês vazio, sessão que cruza a meia-noite, importação duplicada, sequência quebrada por um dia, palavra contada em dois idiomas.
3. **Data é ponto de bug.** UTC no banco, conversão na borda para `America/Sao_Paulo`. "Hoje" é o dia civil em SP, nunca `new Date()` do servidor. Teste com relógio do sistema em UTC provando que 21h em SP ainda é o mesmo dia.
4. **Nada de número mágico.** Metas, limiares de camada, percentuais da divisão-alvo e definição das marchas vêm da tabela de configuração, semeada por `seed.sql`. `1500` escrito num componente é bug.
5. **Migrações versionadas**, uma por mudança, nunca editadas depois de aplicadas.
6. **Estado vazio é feature.** Primeira abertura sem dado nenhum e volta depois de 22 dias sumida. O segundo caso é o mais importante: nenhuma tela grita fracasso.
7. **Escrita otimista.** Registrar sessão e marcar tarefa respondem na hora, com rollback em falha.
8. **Teclado.** Registrar uma sessão inteira sem mouse. Atalhos globais para as ações frequentes.
9. **Commits pequenos**, em português, um assunto por commit. Nunca com build quebrado ou teste vermelho.
10. **Ambiguidade vira pergunta**, não decisão silenciosa.

## Fronteiras do produto — não cruzar

- **O app não gerencia flashcards.** Os cartões vivem no Flashcards Deluxe. Sem CRUD de cartão, sem repetição espaçada, sem tela de revisão de cartão, sem fila de devidos. O app registra contagem de palavras novas, dias com revisão e % de acerto informada. A lista colada na checagem de interferência **não é persistida**. (`RN-003`, `RN-401`, `RN-409`, `RN-1103`)
- **Imersão nunca dispara produção.** Registrar imersão não gera tarefa, alerta, modal nem cobrança. A cobrança de produção é semanal e agregada. (`RN-002`)
- **Escuta não é pilar.** Consumo passivo é categoria `imersao` e jamais entra na conta de estudo ativo. (`RN-001`, `RN-102`)
- **Não é multiusuário.** Sem convite, papel, time ou compartilhamento. "Compartilhar" conquista gera imagem local, nunca link público.
- **Não é gamificação genérica.** Sem ponto, XP, nível inventado ou mascote. Só o catálogo de `docs/06-conquistas.md`.
- **Nada de feature não pedida.** Sugerir, nunca implementar por conta.

## Glossário do método

| Termo | Definição operacional |
|---|---|
| **Pilar** | Uma de quatro categorias de estudo ativo: vocabulário, gramática, pronúncia, fala |
| **Imersão** | Consumo passivo (série, podcast, audiobook, YouTube, leitura). **Não é pilar** |
| **Estudo ativo** | Tempo em sessão de pilar cuja atividade não é `flashcards` |
| **Piso diário** | Flashcards revisados + ≥ 1 min de fala. Independe da marcha |
| **Marcha** | Intensidade ativa: 1 Sobrevivência (~15 min/dia), 2 Cruzeiro (~5 h/sem), 3 Turbo (8–10 h/sem). Define as tarefas do dia |
| **Três tempos** | Cadeira (bloco focado) · mãos livres (fila, café) · mãos ocupadas (louça, trânsito) |
| **Camada de fluência** | 1 Viajante 1.500 · 2 Conexão 3.000 · 3 Negócios 5.000 · 4 Acadêmico 10.000 · 5 Maestria 20.000 palavras |
| **As seis regras** | 1 nunca dois dias em branco · 2 o piso independe da marcha · 3 clube é compromisso marcado · 4 um áudio no grupo por semana · 5 gramática e pronúncia nunca no mesmo dia (sexta é pronúncia) · 6 Instagram só na marcha 3 |
| **Modo retomada** | Estado após 7+ dias sem registro; substitui as metas por cinco fases sequenciais |
| **Bloco do plano** | Quadrimestre com idioma-foco e distribuição própria entre idiomas |
| **Velocidade A / B** | 2 min por palavra / 1 min por palavra na criação do lote |
| **Card / cartão** | Sempre o componente de interface. Cartão de estudo é **flashcard**, e vive fora do app |

## Convenção de commits

`tipo: assunto em português, minúscula, imperativo` — um assunto por commit.
Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `db` (migração ou seed).

```
feat: tela hoje com piso diário e semáforo das seis regras

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

## Fases

0 fundação · 1 registrar e ver hoje · 2 dashboard · 3 metas, distribuição e tarefas · 4 revisão, flashcards e modo retomada · 5 conquistas, materiais e recursos · 6 importação do Toggl · 7 acabamento.

Uma fase por vez. Ao fim de cada uma: build limpo, testes verdes, um commit, resumo curto — e esperar confirmação antes da próxima.
