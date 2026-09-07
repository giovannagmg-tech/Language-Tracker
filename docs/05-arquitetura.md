# 05 — Arquitetura

> ⚠️ **Superado em 07/09/2026 nas seções 1, 2, 4, 5 e 6.2.** A stack decidida é **Next.js (App Router) + Supabase (Postgres + Auth) + Vercel**, com contas isoladas por RLS. A argumentação local-first abaixo fica registrada como histórico da decisão. Continuam valendo integralmente: a separação de camadas (seção 3), a regra de domínio puro, a estratégia de testes (seção 7) e o ferramental (seção 8). A fonte da verdade técnica é o `CLAUDE.md`.

## 1. A pergunta que define tudo: por que não tem backend

O app tem **uma usuária, um dispositivo por vez, e nenhum dado que precise ser compartilhado, moderado, autorizado ou processado em servidor**. Um backend multiusuário aqui não resolveria nenhum problema real e criaria seis:

| O que um backend traria | Por que não vale |
|---|---|
| Autenticação | Não há segundo usuário para autenticar contra |
| Sincronização multi-dispositivo | Resolvida por export/import JSON e, se necessário, por pasta sincronizada do sistema |
| Backup | Resolvido por arquivo local + cópia em nuvem do próprio sistema operacional |
| Processamento pesado | O maior cálculo é varrer ~3.000 registros. Isso é 10 ms no cliente |
| Disponibilidade | Um backend **piora**: o app precisa funcionar no metrô, sem rede |
| Custo | Zero contra uma conta paga mensal e um deploy para manter |

O modo de falha que importa é o oposto do que backend protege: **ela para de registrar**. Latência de rede, tela de login e "erro ao sincronizar" empurram exatamente nessa direção.

`[DECISÃO: local-first, sem servidor, sem conta, PWA instalável.]` Justificativa: as três exigências reais são registro em menos de 10 s, funcionamento offline e propriedade total dos dados. Todas apontam para o cliente.

**O que mudaria a decisão:** ela querer usar o app em dois dispositivos ao mesmo tempo com escrita nos dois. Nesse caso, o caminho já preparado é trocar a camada `repositories/` por um adaptador remoto (ver 6.3) — sem tocar em domínio nem em interface.

---

## 2. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Build | **Vite 5** | Dev server instantâneo, build estático, zero configuração de SSR que não é necessária |
| Linguagem | **TypeScript** (strict) | As regras do método são um monte de enum e invariante; tipo é documentação executável |
| UI | **React 18** | Ecossistema de gráficos e tabelas maduro; a usuária não precisa de framework exótico |
| Roteamento | **React Router 6** (data routers) | 13 rotas, loaders por rota, nenhuma necessidade além disso |
| Estado de servidor/consulta | **TanStack Query** sobre o Dexie | Cache, invalidação e revalidação por chave já resolvidos; troca de período no dashboard fica instantânea |
| Estado de interface | **Zustand** | Cronômetro, modal, filtros, tema. Pequeno e sem cerimônia |
| Persistência | **Dexie 4** sobre IndexedDB | Índices compostos (`[idioma_id+data]`) que o modelo exige, transações e migrações versionadas |
| Estilo | **Tailwind CSS 4** com tokens em CSS custom properties | O design system do doc 07 é uma lista de tokens; Tailwind consome direto e o tema escuro sai de graça |
| Gráficos | **Recharts** | Cobre os 12 tipos do doc 04 (barra empilhada, agrupada, donut, colunas, linha em degraus, calendário via grade própria); o anel de progresso é SVG próprio, não da biblioteca |
| Datas | **date-fns** + `date-fns-tz` | ISO week, fuso America/Sao_Paulo, sem carregar locale inteiro |
| CSV | **PapaParse** | Streaming, dentro de Web Worker |
| Formulários | **React Hook Form** + **Zod** | Validação declarativa que espelha as invariantes do doc 03 |
| Testes | **Vitest** + **Testing Library** + **fake-indexeddb** | As regras de negócio são testáveis sem navegador |
| PWA | **vite-plugin-pwa** (Workbox) | Instalável, offline por padrão |
| Exportação de imagem | **html-to-image** | Card de conquista em PNG (doc 04, seção 11) |

**Não usar:** Next.js (SSR sem uso e servidor para manter), Redux (excesso), biblioteca de componentes pronta (o design system é específico e teria que ser sobrescrito inteiro), ORM (Dexie já é a camada certa), backend-as-a-service (ver seção 1).

---

## 3. Estrutura de pastas

```
poliglota/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── router.tsx              # 13 rotas + loaders
│   │   ├── shell.tsx               # sidebar + cabeçalho + área de conteúdo
│   │   ├── providers.tsx           # Query, tema, atalhos globais
│   │   └── atalhos.ts              # mapa de teclas do doc 04, seção 0.3
│   │
│   ├── dominio/                    # SEM React, SEM Dexie. Funções puras.
│   │   ├── tipos.ts                # enums e tipos do doc 03
│   │   ├── classificacao.ts        # RN-101 a RN-106
│   │   ├── marchas.ts              # RN-201 a RN-206
│   │   ├── regras-inviolaveis.ts   # RN-301 a RN-307
│   │   ├── vocabulario.ts          # RN-401 a RN-410
│   │   ├── interferencia.ts        # RN-406, RN-407
│   │   ├── camadas.ts              # RN-501 a RN-503
│   │   ├── retomada.ts             # RN-601 a RN-604
│   │   ├── indicadores/            # RN-701 a RN-713, um arquivo por indicador
│   │   │   ├── composicao.ts
│   │   │   ├── lacunas.ts
│   │   │   ├── sequencias.ts
│   │   │   ├── fala.ts
│   │   │   ├── pilares.ts
│   │   │   ├── tempos.ts
│   │   │   ├── horarios.ts
│   │   │   └── diagnostico.ts      # RN-712, o motor de texto
│   │   ├── tarefas-automaticas.ts  # RN-801 a RN-804
│   │   ├── distribuicao.ts         # RN-901 a RN-904
│   │   ├── toggl/
│   │   │   ├── parser.ts           # RN-1001
│   │   │   ├── mapeamento.ts       # RN-1002, RN-1003
│   │   │   └── dedup.ts            # RN-1004
│   │   └── conquistas/
│   │       ├── catalogo.ts         # dado semente do doc 06
│   │       └── avaliadores.ts      # uma função por criterio_chave
│   │
│   ├── dados/
│   │   ├── db.ts                   # schema Dexie + migrações
│   │   ├── semente.ts              # idiomas, metas, marchas, blocos, conquistas, regras Toggl
│   │   ├── repositorios/           # única camada que fala com o Dexie
│   │   │   ├── sessoes.ts
│   │   │   ├── vocabulario.ts
│   │   │   ├── tarefas.ts
│   │   │   ├── metas.ts
│   │   │   ├── conquistas.ts
│   │   │   └── ...
│   │   ├── consultas/              # hooks TanStack Query por tela
│   │   │   ├── use-hoje.ts
│   │   │   ├── use-dashboard.ts
│   │   │   └── ...
│   │   └── backup.ts               # export/import JSON, backup automático
│   │
│   ├── motores/                    # orquestração: leem dados, chamam domínio, escrevem
│   │   ├── motor-diario.ts         # roda na abertura e na virada do dia
│   │   ├── motor-tarefas.ts        # gera tarefas automáticas (idempotente)
│   │   ├── motor-conquistas.ts     # avalia o catálogo após cada escrita relevante
│   │   └── motor-retomada.ts
│   │
│   ├── ui/
│   │   ├── tokens.css              # doc 07: cores, tipografia, espaços, raios, sombras
│   │   ├── componentes/            # Card, AnelDeProgresso, GradeDeRotulos, Chip,
│   │   │                           # Pastilha, CardDeConquista, Semaforo, ...
│   │   └── graficos/               # wrappers de Recharts com os tokens aplicados
│   │
│   ├── telas/                      # uma pasta por tela do doc 04
│   │   ├── hoje/
│   │   ├── registro/
│   │   ├── dashboard/
│   │   ├── metas/
│   │   ├── tarefas/
│   │   ├── flashcards/
│   │   ├── revisao/
│   │   ├── distribuicao/
│   │   ├── materiais/
│   │   ├── recursos/
│   │   ├── conquistas/
│   │   ├── importacao/
│   │   └── configuracoes/
│   │
│   └── workers/
│       └── toggl.worker.ts         # parse + mapeamento + dedup fora da thread principal
│
└── testes/
    ├── dominio/                    # a maior parte dos testes mora aqui
    └── fixtures/
        └── linha-de-base-2026.ts   # o histórico real, usado como cenário de teste
```

**A regra que sustenta a estrutura:** `dominio/` não importa React, não importa Dexie, não conhece tela. Recebe dados, devolve resultado. É onde as ~60 regras do doc 02 viram funções testáveis, e é o que sobrevive a qualquer troca de framework.

---

## 4. Persistência

### 4.1 Camadas

```
Tela  →  hook de consulta (TanStack Query)  →  repositório  →  Dexie  →  IndexedDB
                                                    ↑
                                              domínio (puro)
```

Nenhuma tela chama Dexie diretamente. Nenhum repositório contém regra de negócio.

### 4.2 Chaves de cache e invalidação

```
['sessoes', periodo]        invalidada por: criar/editar/excluir sessão, importação
['dia', data]               invalidada por: qualquer escrita com aquela data
['dashboard', recorte, ref] invalidada por: sessões, vocabulário, marcha
['tarefas', 'abertas']      invalidada por: motor de tarefas, conclusão
['conquistas']              invalidada por: motor de conquistas
```

O motor diário roda em três momentos: abertura do app, virada do dia (timer até a próxima meia-noite) e retorno de visibilidade da aba.

### 4.3 Transações

Toda operação que toca mais de uma tabela roda em transação Dexie única. Casos: salvar sessão (sessão + registro de vocabulário + tarefa concluída + avaliação de conquista), importar lote, marcar material principal, importar backup.

### 4.4 Integridade

As invariantes do doc 03 são checadas em dois lugares: no schema Zod do formulário e numa função `validarSessao()` chamada pelo repositório antes de gravar. Violação no repositório é erro de programação — lança e é reportada no console, nunca silenciada.

### 4.5 Performance

Volume esperado: ~3.000 sessões/ano. O dashboard anual carrega tudo em memória e agrega com `reduce`. Medição-alvo: < 100 ms. Se passar de 300 ms em uso real, a resposta é a tabela `agregados_diarios` prevista no doc 03, seção 5 — **e não antes disso**.

---

## 5. Exportação e backup

### 5.1 Backup automático

- Frequência: uma vez por dia, na primeira abertura.
- Formato: JSON único com todas as tabelas + `versao_schema` + `exportado_em`.
- Destino: **File System Access API** com handle persistido no IndexedDB — a usuária escolhe a pasta uma vez (idealmente uma pasta sincronizada: OneDrive, Drive, Dropbox) e o app grava lá silenciosamente.
- Retenção: os 30 arquivos mais recentes, nomeados `poliglota-backup-YYYY-MM-DD.json`; os mais antigos são apagados pelo app.
- Navegador sem File System Access API (Firefox, Safari): cai para download manual, com lembrete semanal no rodapé de Configurações.

`[DECISÃO: backup por arquivo em pasta sincronizada, não por nuvem própria.]` Justificativa: entrega redundância real e portabilidade sem nenhum servidor, e deixa os dados legíveis fora do app.

### 5.2 Exportações manuais

| Formato | Conteúdo | Uso |
|---|---|---|
| JSON completo | todas as tabelas | backup, migração de dispositivo |
| CSV de sessões | uma linha por sessão, todas as colunas | análise externa em planilha |
| CSV de vocabulário | data, idioma, palavras novas, ativadas, acumulado | acompanhar camadas fora do app |
| PNG | card de conquista, recorte do dashboard | compartilhar |

### 5.3 Importação de backup

Substitui **todos** os dados. Fluxo: escolher arquivo → validar versão de schema → mostrar resumo (contagens por tabela, intervalo de datas) → exigir digitar "substituir" → backup automático do estado atual antes de apagar → transação única → recarregar o app.

### 5.4 Migração entre dispositivos

Exportar JSON no dispositivo A, importar no B. Não há merge automático. `[DECISÃO: sem merge.]` Justificativa: merge de dois estados divergentes exige resolução de conflito, que exige interface e regra — custo alto para um cenário que, com uma usuária, é raro e evitável.

---

## 6. Decisões técnicas de fronteira

### 6.1 O que nunca vai para a rede

Nenhuma requisição de rede é feita pelo app, exceto o carregamento do próprio bundle e as fontes (que são empacotadas localmente, então nem isso). Sem analytics, sem CDN de dados, sem chamada de tradução ou de fonética. A checagem de interferência (`RN-406`, `RN-407`) é heurística local justamente por isso.

### 6.2 PWA

`manifest.webmanifest` com ícone, cor de tema e `display: standalone`. Service worker com estratégia *precache* do shell e *network-first apenas para o index.html*, para atualizar sem prender versão antiga. Sem cache de dados — os dados nunca vêm da rede.

### 6.3 Ponto de extensão para sincronização futura

Todo acesso ao banco passa por `dados/repositorios/*`, que expõem uma interface por entidade (`listar`, `obter`, `salvar`, `remover`, `observar`). Trocar Dexie por um adaptador remoto (Supabase, por exemplo) significa implementar essa interface e injetá-la nos providers — nenhuma linha de `dominio/` ou `telas/` muda. Isso é preparação de fronteira, não implementação: **não construir o adaptador remoto na v1**.

### 6.4 Fuso e virada de dia

Uma única função `hoje()` em `dominio/datas.ts` devolve a data local em `America/Sao_Paulo`. Nenhum outro lugar chama `new Date()` para obter a data corrente. Testes injetam um relógio fixo.

### 6.5 Semente e versionamento de conteúdo

Idiomas, metas, marchas, blocos, catálogo de conquistas e regras de mapeamento vêm de `dados/semente.ts`, aplicada na primeira execução. Alterações posteriores no catálogo de conquistas são aplicadas por migração aditiva (novos códigos entram como bloqueados; códigos removidos ficam órfãos, nunca apagados).

---

## 7. Testes

| Camada | Cobertura-alvo | O que testar |
|---|---|---|
| `dominio/` | alta, próxima de 100% nas regras | Cada `RN-nnn` tem pelo menos um teste nomeado com o ID |
| `dominio/indicadores/` | alta | Cenário fixo `linha-de-base-2026`: os indicadores calculados têm que reproduzir 76,8% imersão, 15,7% ativo, 7,5% flashcards, maior lacuna 22, 97 dias com registro |
| `motores/` | média | Idempotência do gerador de tarefas (`RN-802`), avaliação de conquistas sem duplicar |
| `dados/` | média | Migrações, export→import redondo (round-trip), dedup do Toggl |
| `telas/` | baixa, focada | Fluxo de registro em menos de 10 s (contagem de interações), aviso da regra 5, travamento do pilar em imersão |

O fixture da linha de base é o teste mais valioso do projeto: se os números do diagnóstico não forem reproduzidos, o dashboard está mentindo.

---

## 8. Qualidade e ferramental

- ESLint + `@typescript-eslint` com `strict-type-checked`; regra própria proibindo `import` de `dexie` fora de `dados/`, e de `react` dentro de `dominio/`.
- Prettier.
- `tsc --noEmit` no CI local (pre-commit via husky + lint-staged).
- Build de produção estático; hospedagem: pasta local aberta no navegador, ou qualquer host estático. Sem pipeline obrigatório.
