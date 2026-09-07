# Poliglota

App de gestão de estudos de idiomas. Cada pessoa tem a própria conta, isolada por RLS — quem recebe o link entra num app vazio, sem nenhum dado de ninguém.

Documentação de produto em [`docs/`](docs/). Regras de engenharia e fronteiras do produto em [`CLAUDE.md`](CLAUDE.md).

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev
```

## Variáveis de ambiente

| Variável | Onde encontrar | Obrigatória |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | sim |
| `EMAILS_PERMITIDOS` | você escolhe; separados por vírgula | sim |
| `SUPABASE_DB_URL` | Supabase → Settings → Database → Connection string | só para `npm run db:*` |

Não há cadastro aberto: um e-mail fora de `EMAILS_PERMITIDOS` é recusado no envio do link **e** na confirmação dele.

## Primeira configuração do banco

1. Crie o projeto no Supabase.
2. `npx supabase link --project-ref <ref-do-projeto>`
3. `npm run db:migrate` — cria o esquema, os índices, as políticas de RLS e o gatilho de bootstrap.
4. Rode `supabase/seed.sql` (catálogo de conquistas). Pelo CLI: `npm run db:seed`; ou cole no SQL Editor.
5. Em **Authentication → URL Configuration**, aponte *Site URL* para a URL do deploy e adicione `http://localhost:3000` em *Redirect URLs*.
6. Faça o primeiro login. O gatilho `on_auth_user_created` cria a conta já configurada e **vazia**: três idiomas, cinco camadas, três marchas, divisão-alvo dos pilares, as metas do painel mensal e o estado inicial das conquistas.
7. Só na conta principal: rode `supabase/seed_pessoal.sql` para aplicar níveis, vocabulário acumulado, metas por idioma, blocos do plano e o mapeamento do Toggl. É idempotente e não toca em nenhuma outra conta.
8. `npm run db:types` — gera `lib/supabase/types.ts`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run lint` | ESLint + `tsc --noEmit` |
| `npm test` | Vitest, com `TZ=UTC` (o fuso do servidor) |
| `npm run test:e2e` | Playwright |
| `npm run db:migrate` | aplica as migrações |
| `npm run db:types` | regenera os tipos do banco |
| `npm run db:seed` | catálogo de conquistas + dados da conta principal |

## Deploy na Vercel

1. Importe o repositório.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `EMAILS_PERMITIDOS` em *Environment Variables* (Production e Preview).
3. Depois do primeiro deploy, volte no Supabase e ajuste *Site URL* e *Redirect URLs* para o domínio da Vercel.

O servidor da Vercel roda em UTC. O app trata "hoje" como o dia civil em `America/Sao_Paulo` — os testes de `lib/domain/datas.ts` rodam com `TZ=UTC` justamente para provar isso.

## Convidar outra pessoa

Acrescente o e-mail em `EMAILS_PERMITIDOS`, redeploy, e mande o link. No primeiro login ela recebe o app configurado e sem nenhum dado. Não há compartilhamento entre contas — nenhuma linha atravessa a fronteira do `user_id`.
