# 08 — Roadmap

Oito fatias. Cada uma é entregável e usável sozinha: ao fim de qualquer fatia, o app pode ser usado todos os dias sem quebrar. A ordem é ditada por uma pergunta só — **o que muda o comportamento mais cedo?**

Estimativas são relativas (P = pequena, M = média, G = grande), não em dias.

---

## Fatia 1 — O piso (M)

> O menor app que já muda o comportamento.

**Objetivo:** ela registra em menos de 10 segundos e vê, todo dia, se cumpriu flashcards + 1 minuto de fala.

**Entra**
- Projeto: Vite + React + TS + Tailwind com os tokens do doc 07 (tema claro apenas), Dexie com o schema do doc 03 (todas as tabelas criadas, mesmo as não usadas ainda), semente de idiomas e marchas.
- Casca: sidebar com os 12 itens (os não implementados aparecem desabilitados), cabeçalho de página.
- **Tela Registro de Estudo** completa: `RN-101` a `RN-106`, cronômetro, classificação ativo/imersão travada (`RN-102`), pastilha ATIVO/IMERSÃO.
- **Tela Hoje**: cartão do piso diário (`RN-302`), tarefas da marcha 1 (`RN-202`, `RN-206`), registro rápido, sequências (`RN-705`).
- Check diário de flashcards (`RN-403`) e o botão "Falei 1 min".
- Atalhos `N`, `F`, `V`, `T`.
- Desfazer por toast.

**Fica de fora:** dashboard, metas, conquistas, importação, marchas 2 e 3, as outras cinco regras, tema escuro.

**Critério de pronto**
1. Registrar uma sessão de imersão em ≤ 10 s, medido pela telemetria, sem que nada seja pedido depois (`RN-002`).
2. Cumprir o piso pelos dois botões e ver o streak subir para 1.
3. Fechar e reabrir o navegador: tudo continua lá.
4. Testes de `dominio/classificacao.ts` e `dominio/indicadores/sequencias.ts` passando.

---

## Fatia 2 — As seis regras e as três marchas (M)

**Objetivo:** o app passa a cobrar o método, não só a registrar.

**Entra**
- `RN-201`, `RN-203` a `RN-206`: catálogo completo das três marchas, troca em uma tecla, histórico.
- `RN-301` a `RN-307`: semáforo das seis regras na tela Hoje, com os botões de ação de cada uma.
- `RN-801` a `RN-804`: motor de tarefas automáticas (idempotente) e a **tela Tarefas**.
- `RN-410`: marcar ponto gramatical como "errei" e a tarefa de 2 frases.
- `RN-1102`: badges na sidebar.
- `RN-1101`: os gatilhos ficam em constantes; a tela de Configurações vem depois.

**Critério de pronto**
1. Numa sexta-feira, a tela Hoje oferece pronúncia e não oferece gramática (`RN-204`).
2. Registrar gramática e depois pronúncia no mesmo dia mostra o aviso, deixa salvar e grava `violou_regra_5`.
3. Sem clube agendado e na marcha 2, a regra 3 fica vermelha com botão de agendar.
4. Rodar o motor de tarefas duas vezes no mesmo dia não duplica nenhuma tarefa.

---

## Fatia 3 — Dashboard semanal e mensal (G)

**Objetivo:** tornar visíveis os dois problemas centrais — consumo passivo e ausência de produção.

**Entra**
- `RN-701` a `RN-712`: todos os indicadores e o motor de diagnóstico em texto.
- Blocos A a L do doc 04, seção 3.2, nos recortes **semana** e **mês**.
- Fixture de teste `linha-de-base-2026` reproduzindo 76,8% / 15,7% / 7,5%, maior lacuna 22 e 97 dias com registro.

**Fica de fora:** recorte anual, blocos M, N, O.

**Critério de pronto**
1. Com o fixture da linha de base carregado, os números batem com o diagnóstico do Toggl.
2. O diagnóstico automático de um mês típico de 2026 abre com a frase de consumo passivo.
3. A composição nunca exibe um número que some ativo e imersão.

---

## Fatia 4 — Vocabulário, camadas e flashcards (M)

**Objetivo:** o pilar base ganha medição própria — e a fronteira com o Flashcards Deluxe fica explícita na interface.

**Entra**
- **Tela Flashcards** inteira: `RN-401` a `RN-409`, calendário de calor, cronômetro de criação com velocidade A/B, % de acerto, caixa de checagem de interferência.
- `RN-501` a `RN-503`: camadas, régua de frequência, escala de níveis.
- Bloco I do dashboard (anéis de camada por idioma).
- `RN-408`: tarefa de ativação de palavras.

**Critério de pronto**
1. Colar 12 palavras em ordem alfabética, com dois pares parecidos e 60% de verbos, dispara três avisos distintos.
2. Sair da tela e voltar: a lista colada sumiu (`RN-409`).
3. Nenhuma tela do app oferece criar, editar ou revisar um cartão.
4. Criar 10 palavras em 9 minutos mostra "velocidade B".

---

## Fatia 5 — Metas, distribuição e revisão (M)

**Objetivo:** o app passa a ter direção, não só espelho.

**Entra**
- **Tela Metas**: as quatro famílias, `RN-504` a `RN-507`.
- **Tela Planilha de Distribuição**: `RN-901` a `RN-904`, com os quatro blocos semeados.
- **Tela Revisão**: `RN-1103`, fila ordenada por urgência, com a linha fixa sobre o Flashcards Deluxe.
- Autoavaliação de bloco.

**Critério de pronto**
1. O painel mensal mostra os cinco indicadores com base e alvo corretos.
2. Editar a divisão-alvo dos pilares muda o gráfico C do dashboard na hora.
3. A tela Revisão nunca lista cartões devidos.

---

## Fatia 6 — Modo retomada (P)

**Objetivo:** o ponto de falha real ganha tratamento.

**Entra**
- `RN-601` a `RN-604`: detecção de 7+ dias, as cinco fases, avanço, sem regressão, saída manual.
- Tela Hoje em estado de retomada; metas pausadas; sidebar com a faixa de fase.
- Conquistas `REC-01` a `REC-05` (avaliador mínimo, antes da tela de conquistas).

**Critério de pronto**
1. Simular 8 dias sem registro entra em retomada automaticamente na abertura.
2. Cumprir as cinco fases desativa o modo e concede `REC-01`.
3. Três dias em branco no meio da retomada não fazem a fase voltar.

> Fatia deliberadamente pequena e cedo no roadmap: sem ela, uma lacuna de 22 dias mata o app antes da fatia 7.

---

## Fatia 7 — Importação do Toggl e dashboard anual (G)

**Objetivo:** o passado entra no app e o recorte anual passa a existir.

**Entra**
- `RN-1001` a `RN-1006`: parser, motor de mapeamento, mapeamento default, dedup, pré-visualização, desfazer — tudo em Web Worker.
- **Tela Importação** completa e o editor de regras.
- Recorte **anual** do dashboard: blocos M, N e O (`RN-713`).

**Critério de pronto**
1. Importar o CSV real de jan–set 2026 e ver o dashboard anual reproduzir o diagnóstico da linha de base.
2. Reimportar o mesmo arquivo não cria nenhuma sessão duplicada.
3. Desfazer o lote devolve o app ao estado anterior, com os indicadores recalculados.

---

## Fatia 8 — Conquistas, acervo e configurações (M)

**Entra**
- **Tela Conquistas** com o catálogo completo do doc 06 e o compartilhamento em PNG.
- **Telas Materiais de Estudo** e **Recursos**.
- **Tela Configurações** completa, incluindo `RN-1101` editável e o editor de marchas.

**Critério de pronto**
1. Todas as 51 definições têm avaliador implementado e teste.
2. Mudar o limiar de "dias para retomada" em Configurações afeta `RN-601` imediatamente.
3. Um material marcado como principal desmarca o anterior do mesmo idioma.

---

## Fatia 9 — Acabamento (P)

**Entra**
- Tema escuro completo (doc 07, seção 6) e alternador.
- PWA instalável, service worker, ícones.
- Backup automático com File System Access API, exportações JSON/CSV/PNG, importação de backup.
- Painel de atalhos (`?`), responsivo abaixo de 768px revisado tela a tela.
- Seção Diagnóstico em Configurações.

**Critério de pronto**
1. Instalar como app, abrir em modo avião e registrar uma sessão.
2. Backup automático grava na pasta escolhida e mantém no máximo 30 arquivos.
3. Todas as telas navegáveis apenas pelo teclado, com foco sempre visível.

---

## Sequência resumida

| Fatia | Nome | Tamanho | Depende de |
|---|---|---|---|
| 1 | O piso | M | — |
| 2 | Seis regras e três marchas | M | 1 |
| 3 | Dashboard semanal e mensal | G | 1 |
| 4 | Vocabulário, camadas e flashcards | M | 1 |
| 5 | Metas, distribuição e revisão | M | 3, 4 |
| 6 | Modo retomada | P | 2 |
| 7 | Toggl e dashboard anual | G | 3 |
| 8 | Conquistas, acervo e configurações | M | 5, 6 |
| 9 | Acabamento | P | todas |

Caminho crítico para "o app já vale a pena": **1 → 2 → 3 → 6**. As fatias 4, 5, 7 e 8 aprofundam; a 9 acaba.

---

## Riscos e como cada um é mitigado

| Risco | Mitigação já prevista |
|---|---|
| Ela para de registrar por atrito | Fatia 1 existe só para provar o registro em 10 s antes de qualquer outra coisa |
| O app vira mais um lugar de culpa | Nenhuma mensagem de culpa; modo retomada sem regressão; conquistas de recuperação com o mesmo peso das de sequência |
| Construir um gerenciador de flashcards por inércia | `RN-003`, `RN-401`, `RN-409`, `RN-1103` e o critério de pronto da fatia 4 |
| Cobrar produção depois de imersão | `RN-002` e o critério de pronto 1 da fatia 1 |
| Dashboard bonito e mentiroso | Fixture `linha-de-base-2026` como teste obrigatório da fatia 3 |
| Escopo crescer para multiusuário | Doc 05, seção 1, e a fronteira de repositórios da seção 6.3 |

---

# Pontos a confirmar

Dez perguntas. Nenhuma delas bloqueia o início: todas têm um valor assumido e documentado, e trocar o valor é edição de dado, não de código.

| # | Pergunta | Valor assumido |
|---|---|---|
| 1 | O trio de percentuais dos blocos do plano está mesmo na ordem **(francês, espanhol, inglês)**? | Sim — é a única leitura em que cada bloco dá 60% ao seu idioma-foco (`RN-901`) |
| 2 | Quantas palavras acumuladas hoje em **espanhol** e **francês**? (o inglês vem do protótipo: 2.729) | espanhol 2.400 · francês 0 |
| 3 | Meta diária de palavras novas por idioma | inglês 10 · espanhol 10 · francês 15 |
| 4 | A meta de espanhol é **C1.1** ou **C1.2**? | C1.1 |
| 5 | O bloco atual (francês) começou em **01/09/2026**? | Sim |
| 6 | O **clube de conversação** tem dia fixo na semana? | Não — a sugestão automática de agendamento cai na próxima quarta |
| 7 | O **áudio no grupo** conta como minutos de fala e como produção? | Sim, nos dois |
| 8 | O deck de **gramática** tem % de acerto registrado com a mesma frequência do de vocabulário? | Sim — o campo existe em `RevisaoFlashcards.pct_acerto_gramatica`, opcional |
| 9 | Quais são os **materiais principais** de cada idioma hoje, para semear a tela Materiais? | Nenhum semeado; a tela abre pedindo que sejam definidos |
| 10 | Na marcha 3, a **aula particular** é semanal, quinzenal ou avulsa? | Semanal (`RN-202`, tarefa "aula particular ou conversação extra") |
