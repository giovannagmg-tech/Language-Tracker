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

| Variável | Onde encontrar | Visibility na Vercel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | **Config** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | **Config** |
| `EMAILS_PERMITIDOS` | você escolhe; separados por vírgula | **Secret** |

As duas primeiras têm prefixo `NEXT_PUBLIC_`: são embutidas no bundle do navegador por definição, e a Vercel recusa marcá-las como *Secret*. Isso não é um vazamento — a chave anon identifica o projeto, não autoriza nada. Quem protege os dados é o RLS: toda tabela só devolve linhas com `user_id = auth.uid()`.

`EMAILS_PERMITIDOS` só é lido no servidor e deve ficar como *Secret*.

Não há cadastro aberto: um e-mail fora de `EMAILS_PERMITIDOS` é recusado no envio do link **e** na confirmação dele.

## Primeira configuração do banco

1. Crie o projeto no Supabase.
2. `npx supabase link --project-ref <ref-do-projeto>`
3. `npm run db:migrate` — cria o esquema, os índices, as políticas de RLS e o gatilho de bootstrap.
4. `npm run db:seed` — carrega o catálogo de conquistas e sincroniza as contas que já existem. Roda uma vez por versão do arquivo: o CLI guarda o hash.
5. Em **Authentication → URL Configuration**, aponte *Site URL* para a URL do deploy e adicione `http://localhost:3000` em *Redirect URLs*.
6. Faça o primeiro login. O gatilho `on_auth_user_created` cria a conta já configurada e **vazia**: três idiomas, cinco camadas, três marchas, divisão-alvo dos pilares, as metas do painel mensal e o estado inicial das conquistas.
7. Depois do primeiro login, aplique os dados da conta principal:
   ```sql
   select public.aplicar_dados_conta_principal('seu@email.com');
   ```
   Idempotente e restrita a essa conta — pode rodar quantas vezes quiser.
8. `npm run db:types` — gera `lib/supabase/types.ts`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run lint` | ESLint + `tsc --noEmit` |
| `npm test` | Vitest, com `TZ=UTC` (o fuso do servidor) |
| `npm run test:e2e` | Playwright — os fluxos com login pulam sem sessão gravada |
| `npm run e2e:sessao` | abre o navegador para você logar uma vez e grava `e2e/.sessao.json` |
| `npm run db:migrate` | aplica as migrações |
| `npm run db:types` | regenera os tipos do banco |
| `npm run db:seed` | aplica migrações e o catálogo de conquistas. Seeds rodam uma vez só: o CLI guarda o hash |

## Deploy na Vercel

1. Importe o repositório.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `EMAILS_PERMITIDOS` em *Environment Variables* (Production e Preview).
3. Depois do primeiro deploy, volte no Supabase e ajuste *Site URL* e *Redirect URLs* para o domínio da Vercel.

O servidor da Vercel roda em UTC. O app trata "hoje" como o dia civil em `America/Sao_Paulo` — os testes de `lib/domain/datas.ts` rodam com `TZ=UTC` justamente para provar isso.

## Convidar outra pessoa

Acrescente o e-mail em `EMAILS_PERMITIDOS`, redeploy, e mande o link. No primeiro login ela recebe o app configurado e sem nenhum dado. Não há compartilhamento entre contas — nenhuma linha atravessa a fronteira do `user_id`.
