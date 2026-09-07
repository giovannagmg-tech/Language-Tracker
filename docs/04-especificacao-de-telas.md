# 04 — Especificação de telas

Treze telas. Tokens visuais e componentes em [07-design-system.md](07-design-system.md); regras citadas como `RN-nnn` em [02-regras-de-negocio.md](02-regras-de-negocio.md).

---

## 0. Casca da aplicação (vale para todas as telas)

### 0.1 Estrutura

```
┌──────────┬────────────────────────────────────────────────┐
│ SIDEBAR  │  Cabeçalho de página (ícone + título + ações)   │
│  210px   ├────────────────────────────────────────────────┤
│  fixa    │                                                │
│  escura  │  Conteúdo (grade de 12 colunas, gap 24px,      │
│          │  largura máxima 1280px, centralizado)          │
└──────────┴────────────────────────────────────────────────┘
```

### 0.2 Sidebar

- Topo: logo quadrado 36×36 lime com "P", nome **Poliglota** e subtítulo `estudos de idiomas` em cinza.
- Ordem dos itens, fixa: **Dashboard · Hoje · Registro de Estudo · Tarefas · Flashcards · Metas · Revisão · Materiais de Estudo · Recursos · Planilha de Distribuição · Conquistas · Configurações**.
- Item ativo: pílula lime clara, texto escuro, ícone escuro.
- Badge numérico circular à direita do rótulo em Hoje, Tarefas e Revisão (`RN-1102`). Sem badge quando zero.
- Rodapé da sidebar: seletor de marcha (`M1 · M2 · M3`, ativo destacado) e o streak atual em números pequenos. Clicar no seletor aplica `RN-205`.
- Quando o modo retomada está ativo, uma faixa fina acima do rodapé: `Retomada · fase {n}/5`.

### 0.3 Atalhos globais

| Tecla | Ação |
|---|---|
| `N` | abre o modal de Registrar estudo em qualquer tela |
| `T` | inicia/para o cronômetro de sessão |
| `F` | marca "revisei flashcards" hoje (abre seletor de idioma) |
| `V` | registra 1 minuto de fala (grava direto, idioma-foco do bloco) |
| `1` `2` `3` | troca de marcha (`RN-205`) |
| `G` depois `D/H/R/T/F/M/V/A/C` | vai para Dashboard, Hoje, Registro, Tarefas, Flashcards, Metas, Revisão, Materiais, Conquistas |
| `/` | foco na busca da tela atual (quando existir) |
| `?` | painel de atalhos |
| `Esc` | fecha modal/limpa foco |
| `Ctrl/Cmd + Z` | desfaz o último registro salvo (janela de 30 s, via toast) |

### 0.4 Estados padrão

| Estado | Comportamento |
|---|---|
| **Carregando** | Esqueleto com a forma final do card (retângulos cinza, sem spinner). Nunca deslocar layout ao carregar. Leituras locais são de milissegundos: o esqueleto só aparece após 150 ms. |
| **Vazio** | Cartão com uma frase direta, sem ilustração, e **um** botão de ação primária. Textos específicos por tela abaixo. |
| **Erro** | Faixa vermelho-suave no topo do card com a mensagem técnica curta e botão "Tentar de novo". Erros de escrita no IndexedDB mantêm os dados no formulário e oferecem "Copiar dados". |
| **Offline** | Nenhum tratamento especial — o app é local. Sem indicador de rede. |
| **Modo retomada** | Todas as telas de meta exibem faixa cinza no topo: *"Modo retomada, fase {n}/5. Metas normais pausadas."* |

### 0.5 Responsivo (padrão)

| Faixa | Comportamento |
|---|---|
| ≥ 1280px | Sidebar fixa, grade de 12 colunas, cards de 4/6/8 colunas |
| 1024–1279px | Sidebar fixa, grade de 8 colunas |
| 768–1023px | Sidebar colapsa para 64px (só ícones), grade de 6 colunas |
| < 768px | Sidebar vira barra inferior com 5 itens (Hoje, Registro, Dashboard, Revisão, Mais) + gaveta; cards viram coluna única; tabelas viram lista de cartões; gráficos mantêm proporção com rolagem horizontal própria |

Em telas < 768px, o botão flutuante de registro (`+`) fica fixo no canto inferior direito, acima da barra.

---

## 1. Hoje

**Objetivo:** em 5 segundos ela sabe o que falta hoje e o que está em risco. É a tela de abertura padrão.

### 1.1 Componentes, de cima para baixo

1. **Cabeçalho** — ícone de contorno + "Hoje" + data por extenso ("segunda-feira, 7 de setembro"). À direita: seletor de marcha e botão "Registrar" (primário).
2. **Cartão do piso diário** (largura total, borda de destaque, separado do resto por 32 px de respiro) — `RN-302`:
   - Dois blocos lado a lado: **Flashcards** e **1 minuto de fala**.
   - Cada bloco: círculo de estado (vazio/preenchido), rótulo, e botão de um clique ("Revisei" / "Falei 1 min").
   - Linha inferior: *"O piso não depende da marcha."*
3. **Tarefas da marcha** (`RN-203`) — lista de checkboxes agrupada por escopo (Hoje / Esta semana). Cada linha: checkbox, título, meta numérica quando houver ("40 min", "25 min"), progresso atual em cinza ("18/40 min"). Concluídas descem para o fim, com risco no texto e opacidade 60%.
   - Cabeçalho do bloco: `Marcha 2 — Cruzeiro` + "trocar" discreto à direita.
   - Sexta-feira: `RN-204` substitui o bloco matinal por "Sexta de pronúncia — 25 min", e nenhuma tarefa de gramática é oferecida.
4. **Semáforo das seis regras** (`RN-307`) — seis pastilhas em duas linhas de três. Cada pastilha: ponto colorido, número e nome curto ("1 · dois dias", "5 · gram+pron"). Amarelas e vermelhas trazem o botão de ação inline. Ordenação vermelho → amarelo → verde.
5. **Registro rápido** — barra horizontal com quatro campos pré-preenchidos (idioma-foco, atividade mais frequente do dia da semana, duração 40, tempo default da atividade) e botão "Salvar". Meta: 10 s (`RN` D-produto).
6. **Fila de revisão do dia** — até 5 itens da tela Revisão ordenados por urgência (`RN-1103`), com "ver tudo (n)". Linha fixa em cinza: *"Cartões devidos ficam no Flashcards Deluxe."*
7. **Sequências** — dois números lado a lado: `streak_registro` e `streak_piso` (`RN-705`), e abaixo: *"{k} dias para bater seu recorde do ano ({recorde})."*

### 1.2 Estado do modo retomada

Quando `RetomadaProtocolo.ativa`, os itens 3 e 7 são substituídos por:

- **Cartão de fase**: "Fase {n} de 5 — {nome}", tarefas da fase (`RN-602`), progresso "{x}/{y} dias cumpridos", e as cinco fases como pontos conectados.
- O piso diário permanece; o semáforo permanece, mas a regra 3 fica cinza.
- Botão discreto "Sair do modo retomada" (`RN-604`).

### 1.3 Estados

- **Vazio (dia sem nada registrado, antes das 20h):** o piso aparece em cinza-neutro, tarefas todas desmarcadas, texto do card de registro rápido: *"Nada registrado hoje ainda. Um minuto já muda o dia."*
- **Vazio + ontem em branco:** `RN-301` sobe o cartão da regra 1 para o topo, acima do piso, em vermelho-suave.
- **Erro ao salvar:** toast vermelho, dados preservados nos campos.

### 1.4 Interações

- Checkbox de tarefa da marcha que exige dado (ex.: bloco de 40 min) abre o registro rápido pré-preenchido, em vez de marcar direto.
- Checkbox de tarefa binária (áudio no grupo) grava a sessão correspondente na hora.
- Toast de "desfazer" por 30 s em toda gravação.
- Clique numa pastilha do semáforo abre um popover com o texto completo da regra e o histórico dos últimos 14 dias dela.

### 1.5 Atalhos específicos

`F` piso de flashcards · `V` 1 min de fala · `Enter` no registro rápido salva · `1/2/3` marcha · `R` abre a fila de revisão completa.

### 1.6 Responsivo

< 768px: piso vira dois cartões empilhados de altura reduzida; semáforo vira duas linhas roláveis horizontalmente; registro rápido vira o botão flutuante.

---

## 2. Registro de Estudo

**Objetivo:** registrar uma sessão em menos de 10 segundos, com classificação correta e sem bloqueios.

Existe em dois formatos com o mesmo componente: **página** (`/registro`) e **modal** (tecla `N`).

### 2.1 Campos, na ordem de tabulação

| # | Campo | Controle | Default |
|---|---|---|---|
| 1 | Idioma | três chips com bandeira | idioma-foco do bloco vigente |
| 2 | Atividade | grade de chips agrupada (Ativo / Imersão) | a mais usada nesse dia da semana nos últimos 30 dias |
| 3 | Pilar | quatro chips | default da atividade (`RN-101`); oculto e nulo se imersão (`RN-102`) |
| 4 | Tempo do dia | três chips | default da atividade |
| 5 | Data | date input | hoje |
| 6 | Duração | stepper com atalhos 15/25/40/60 + cronômetro | 40 |
| 7 | Palavras novas | number | 0 (só visível para vocabulário/flashcards) |
| 8 | Minutos de fala | number | `RN-105` |
| 9 | Pontos gramaticais | number | 0 (só visível para pilar gramática) |
| 10 | Frases produzidas | number | 0 (visível para fala, escrita, gramática) |
| 11 | Material | select | material principal do idioma |
| 12 | Nota | textarea | vazio |

Campos 7 a 12 ficam atrás de "mais campos", expandido por padrão apenas quando a atividade os torna relevantes.

### 2.2 Regras ativas na tela

- `RN-102`: escolher atividade de imersão trava categoria e some com o campo Pilar, exibindo a linha *"Escuta e consumo não são pilar. Isso entra como imersão."*
- `RN-305`: ao escolher pilar gramática num dia que já tem pronúncia (ou vice-versa), aparece o aviso confirmável **abaixo do campo**, não em modal, com os botões "Salvar assim mesmo" e "Trocar o pilar".
- `RN-306`: `conteudo_instagram` desabilitado fora da marcha 3, com tooltip.
- `RN-002`: salvar imersão fecha a tela. Sem pergunta, sem sugestão, sem tarefa gerada.
- Indicador de classificação sempre visível ao lado do botão salvar: pastilha `ATIVO` (verde) ou `IMERSÃO` (cinza).

### 2.3 Cronômetro

Botão "Iniciar" grava `hora_inicio`, mostra tempo corrente grande, e persiste em `localStorage` para sobreviver a recarregamento. Ao parar, preenche a duração (`RN-106`). Um cronômetro por vez; iniciar outro pergunta se encerra o anterior.

### 2.4 Estados

- **Vazio:** nunca — o formulário sempre abre preenchido.
- **Erro de validação:** só três podem falhar — duração fora de faixa, minutos de fala maiores que a duração (corrige e avisa), pilar ausente em sessão ativa. Nenhuma delas impede salvar depois da correção automática.
- **Erro de gravação:** faixa vermelha, dados preservados, botão "Copiar dados".

### 2.5 Atalhos

`Tab` percorre os chips; `1..9` selecionam o enésimo chip do grupo focado; `Ctrl+Enter` salva; `Ctrl+Shift+Enter` salva e abre um novo registro em branco; `Esc` fecha o modal com confirmação apenas se houver alteração.

### 2.6 Responsivo

< 768px: chips em grade de 2 colunas; duração com teclado numérico nativo; botão salvar fixo no rodapé da tela.

---

## 3. Dashboard

**Objetivo:** tornar impossível não ver o excesso de consumo passivo e a ausência de produção.

### 3.1 Seletor de recorte

Três abas no cabeçalho — **Semana · Mês · Ano** — mais navegação anterior/próximo e um rótulo do período ("1–7 set 2026"). O mesmo vocabulário visual nos três; o que muda é a granularidade dos eixos e a presença de dois blocos exclusivos do recorte anual.

### 3.2 Blocos comuns aos três recortes

**A. Linha de topo — quatro números grandes**
Horas totais · % em estudo ativo (com a meta 35% impressa ao lado) · dias com registro · maior lacuna. Cada um com delta contra o período anterior equivalente (seta e pontos percentuais).

**B. Composição ativo × passivo × flashcards** (`RN-701`)
Gráfico: **barra empilhada horizontal única**, 100% de largura.
- Eixo X: percentual do tempo total (0–100%), rótulos nas três fatias com % e horas absolutas.
- Sem eixo Y (barra única).
- Marcador vertical tracejado em 35% com rótulo "meta ativo", sempre desenhado sobre a fatia de estudo ativo.
- Ordem das fatias: ativo (verde), flashcards (azul), imersão (cinza). A ordem nunca muda, para a leitura ficar comparável entre períodos.

**C. Pilares: real × alvo** (`RN-703`)
Gráfico: **barras agrupadas horizontais**, quatro grupos (vocabulário, gramática, pronúncia, fala), duas barras por grupo.
- Eixo Y (categórico): os quatro pilares.
- Eixo X: percentual do estudo ativo, 0 a max(40%, maior valor).
- Barra 1 = realizado (cor do pilar), barra 2 = alvo (mesma cor, 25% de opacidade, contorno tracejado).
- Rótulo à direita de cada grupo: delta em pontos percentuais com sinal.

**D. Três tempos** (`RN-709`)
Gráfico: **donut** com três fatias (cadeira, mãos livres, mãos ocupadas).
- Centro: percentual do tempo em cadeira.
- Legenda à direita, com % e horas.

**E. Horas por idioma**
Gráfico: **barras horizontais**, uma por idioma, cor do idioma.
- Eixo X: horas. Eixo Y: idiomas ordenados por horas, decrescente.
- Sob cada barra, uma micro-barra do alvo do bloco vigente (`RN-902`), no mesmo eixo.

**F. Série temporal de horas com marcha sobreposta** (`RN-711`)
Gráfico: **colunas empilhadas** (ativo / flashcards / imersão).
- Eixo X: dias (recorte semanal e mensal) ou semanas ISO (recorte anual).
- Eixo Y: minutos (semanal/mensal) ou horas (anual).
- Faixas de fundo por marcha, com rótulo no topo do primeiro dia de cada faixa.
- Linha fina de referência: mediana diária do período.

**G. Minutos de fala por semana** (`RN-706`)
Gráfico: **colunas verticais** com linha-alvo horizontal em 60.
- Eixo X: semanas do período (uma coluna no recorte semanal, 4–5 no mensal, 52 no anual).
- Eixo Y: minutos, 0 a max(90, maior valor).
- Colunas abaixo da meta em laranja, acima em verde.

**H. Dias com flashcards por semana** (`RN-707`)
Gráfico: **calendário de calor** (7 colunas = dias da semana, N linhas = semanas).
- Célula preenchida quando `dia_com_flashcards`; intensidade única (sem escala), porque o indicador é binário.
- Ao lado: número grande da média semanal e a meta 5.

**I. Palavras e camadas** (`RN-501`)
Um cartão por idioma, com **anel de progresso** (donut) da camada atual:
- Centro: percentual grande.
- Abaixo: `2729 / 5000 palavras`, linha de contexto ("camada 3 — Negócios · faltam 2271") e o percentual repetido em negrito.
- Rodapé do cartão: régua de frequência (`RN-502`) e projeção em dias (`RN-505`).

**J. Distribuição por hora do dia** (`RN-710`)
Gráfico: **colunas verticais**, 24 colunas.
- Eixo X: hora 0–23. Eixo Y: minutos acumulados.
- Coluna do pico destacada, com rótulo "pico: {h}h".
- Nota de rodapé com os minutos de sessões sem hora.

**K. Distribuição por dia da semana** (`RN-710`)
Gráfico: **colunas verticais**, 7 colunas (seg→dom).
- Destaque no maior e no menor, com rótulos "mais forte" e "mais fraco".

**L. Diagnóstico automático** (`RN-712`)
Cartão de texto, largura total, fundo levemente destacado, sem gráfico. Até três frases, cada uma em uma linha, número em negrito, e um link "ver" que abre o bloco correspondente com destaque.

### 3.3 Blocos exclusivos do recorte anual

**M. Comparação bloco a bloco do plano** (`RN-713`)
Gráfico: **barras agrupadas verticais**, um grupo por bloco (B1…B4), três pares por grupo (um por idioma).
- Eixo X: blocos, com o idioma-foco no rótulo ("set–dez · FR").
- Eixo Y: percentual do tempo do bloco, 0–100%.
- Alvo em contorno tracejado, realizado preenchido.

**N. Progresso de nível por idioma** (`RN-503`)
Gráfico: **linha em degraus (step)**, uma linha por idioma.
- Eixo X: tempo (meses do ano).
- Eixo Y: escala de níveis A0…C2 como categorias ordenadas.
- Pontos = autoavaliações; linha tracejada horizontal na meta de cada idioma; anotação da data-alvo.

**O. Concentração** (`RN-708`)
Número grande: "% das horas nos 10 maiores dias", com a lista desses dias, a atividade dominante de cada um, e destaque em cinza para os que foram imersão.

### 3.4 Estados

- **Carregando:** esqueletos com a altura final de cada gráfico.
- **Vazio (período sem dados):** cada bloco mostra o próprio esqueleto vazio e o cartão de diagnóstico exibe *"Nenhum registro entre {d1} e {d2}. Foram {n} dias."* com botão "Registrar agora".
- **Parcialmente vazio:** blocos sem dados suficientes (ex.: nível sem autoavaliação) mostram *"Sem autoavaliação neste período."* e continuam ocupando o mesmo espaço.
- **Erro de cálculo:** o bloco isolado mostra o erro; os outros continuam funcionando.

### 3.5 Interações e atalhos

- Clicar numa coluna do gráfico F abre a lista de sessões daquele dia num painel lateral.
- Passar o mouse em qualquer gráfico mostra tooltip com valor absoluto e percentual.
- Alternar "por idioma" liga/desliga a segmentação por idioma nos blocos B, C, F e G.
- `←` `→` navegam entre períodos; `S` `M` `A` trocam o recorte; `E` exporta o recorte atual em PNG e CSV.

### 3.6 Responsivo

< 1024px: blocos passam a uma coluna, gráficos mantêm 16:9 mínimo. < 768px: gráficos J, K e M ganham rolagem horizontal com largura mínima de 480px; a linha de topo vira grade 2×2.

---

## 4. Metas

**Objetivo:** ver as quatro famílias de meta ao mesmo tempo, com progresso e prazo.

### 4.1 Seções

1. **Painel mensal** (`RN-507`) — cinco medidores de anel em linha, cor rosa (mensal). Cada um: percentual grande no centro, valor absoluto abaixo ("18 / 20 dias"), linha de contexto ("base: 12") e o percentual repetido em negrito. Para "maior lacuna", o anel mede a distância entre base e alvo com direção invertida.
2. **Metas de palavras** — um cartão por idioma, cor laranja (longo prazo). Anel = progresso na camada (`RN-501`). Grade de rótulos abaixo: META/DIA, HOJE, MÉDIA 7D, FALTAM, PROJEÇÃO.
3. **Metas de nível** — um cartão por idioma, cor laranja. Barra de degraus com os níveis entre inicial e meta, ponto atual destacado, data-alvo e "faltam N dias". Botão "Autoavaliar" (habilitado sempre; obrigatório no fim do bloco, `RN-504`).
4. **Metas de conversação** — cor azul (semanal). Três medidores: conversas na semana, minutos de fala na semana (alvo 60), áudio no grupo (binário, vira um selo). Abaixo, lista das sessões pagas agendadas com data.
5. **Foco em Distribuição** — cartão que puxa `foco_mes_*` da Planilha de Distribuição (`RN-903`), com link "editar na Planilha".

### 4.2 Estados

- **Vazio:** impossível — as 14 metas são semeadas na instalação. Se uma for desativada, o cartão some e aparece em "metas inativas" no rodapé.
- **Modo retomada:** todos os anéis em cinza dessaturado com o selo "pausada" e a faixa do topo (`RN-601`).
- **Meta vencida:** cartão ganha borda laranja e o texto "prazo vencido em {data}", com botões "Renovar prazo" e "Arquivar".

### 4.3 Interações e atalhos

Editar meta abre painel lateral com valor-alvo, periodicidade, prazo e cor. `E` edita a meta focada; `A` abre a autoavaliação do idioma focado.

### 4.4 Responsivo

< 1024px: os cinco anéis do painel mensal viram carrossel de 3 visíveis. < 768px: um cartão por linha.

---

## 5. Tarefas

**Objetivo:** separar o que a regra cobrou do que ela mesma decidiu fazer.

### 5.1 Componentes

- Duas seções fixas (`RN-804`): **Geradas pelas regras** e **Minhas tarefas**.
- Filtros no topo: idioma (chips), estado (abertas / hoje / atrasadas / concluídas / todas), tipo.
- Cada linha: checkbox, título, chip do tipo, chip do idioma, prazo (vermelho se atrasado), quantidade ("0/2 frases"), e menu com "adiar" (uma vez, `RN-803`), "dispensar", "ver regra".
- Tarefas automáticas têm ícone de engrenagem e título em cinza-escuro não editável.
- Botão "Nova tarefa" abre painel com: título, idioma, prazo, recorrência, vínculo com meta.

### 5.2 Conclusão com quantidade

Tarefas com `quantidade_exigida > 1` abrem um stepper inline ao marcar. Só concluem ao atingir a quantidade; abaixo disso, gravam progresso parcial e continuam abertas.

### 5.3 Estados

- **Vazio (nenhuma tarefa):** *"Nada pendente. As regras geram tarefa sozinhas quando precisar."* + botão "Nova tarefa".
- **Vazio numa seção:** a seção continua visível com uma linha em cinza.
- **Erro:** toast; a linha volta ao estado anterior.

### 5.4 Atalhos

`J` `K` navegam na lista; `Espaço` marca/desmarca; `A` adia; `D` dispensa; `Ctrl+N` nova tarefa.

### 5.5 Responsivo

< 768px: filtros viram gaveta; cada tarefa vira cartão com prazo e chips em duas linhas.

---

## 6. Flashcards

**Objetivo:** acompanhar um deck que mora fora do app. **Sem CRUD de cartões, sem revisão embutida** (`RN-003`, `RN-401`).

### 6.1 Componentes

1. **Faixa de fronteira** — linha permanente no topo, cinza: *"Seus cartões vivem no Flashcards Deluxe. Aqui a gente só mede."* Com link para o app externo.
2. **Check diário por idioma** — três blocos com o botão "Revisei hoje" (`RN-403`), estado do dia e a sequência de dias com flashcards por idioma.
3. **Palavras novas do dia** — três steppers (um por idioma) com meta do dia ao lado e o acumulado após salvar.
4. **Calendário de calor do mês** — grade de 7 colunas × semanas do mês, célula preenchida nos dias com revisão (todos os idiomas juntos; alternador para ver por idioma). Eixo X: dias da semana; eixo Y: semanas. Rodapé: "revisão em {n} de {m} dias".
5. **Sequência atual** — número grande de dias consecutivos com flashcards + recorde.
6. **Cronômetro de criação do lote** (`RN-405`) — botão iniciar/parar, tempo corrente, campo de palavras criadas e, ao parar, o resultado: `{n} palavras em {m} min — {x} min/palavra · velocidade B`. Abaixo, sparkline das últimas 10 criações (eixo X: criações em ordem; eixo Y: min/palavra, com duas linhas de referência em 1,0 e 2,0).
7. **% de acerto do deck** (`RN-404`) — campo por idioma + gráfico de linha dos últimos 12 pontos. Eixo X: data do registro (espaçamento categórico, não temporal, porque os registros são esporádicos); eixo Y: 0–100%.
8. **Checagem de interferência** (`RN-406`) — textarea "cole a lista do dia", contador de itens, botão "Checar lote". O resultado aparece abaixo como lista de avisos, cada um com os itens envolvidos destacados. Rodapé fixo: *"Esta lista não é salva. Ela não vira cartão."* (`RN-409`)
9. **Acumulado e camada por idioma** — três anéis compactos com `{acumulado}/{limiar}` e o nome da camada.

### 6.2 Estados

- **Vazio (nenhum registro):** cada bloco com seu próprio vazio; o calendário mostra o mês inteiro apagado e a frase *"Nenhuma revisão registrada em {mês}."*
- **Cronômetro rodando:** o número corrente é o elemento mais forte da tela; sair da tela mantém o cronômetro (persistido).
- **Checagem sem itens suficientes:** botão desabilitado com *"Cole pelo menos 3 palavras."*
- **Checagem sem avisos:** faixa verde *"Lote limpo. Pode criar."*

### 6.3 Atalhos

`F` marca revisão (abre seletor); `C` foca o campo de palavras novas; `T` inicia/para o cronômetro de criação; `L` foca a caixa de colar lista.

### 6.4 Responsivo

< 768px: blocos empilham na ordem 2 → 3 → 5 → 6 → 4 → 9 → 7 → 8 (check e registro primeiro, análise depois).

---

## 7. Revisão

**Objetivo:** tudo em dívida num lugar só, ordenado por urgência (`RN-1103`).

### 7.1 Componentes

- **Lista única ordenada** por urgência, com cabeçalhos leves de agrupamento por tipo. Cada item: ícone do tipo, título, idioma, dias de atraso ("atrasado há 3 dias"), ação primária inline.
- Tipos e ações:

| Tipo | Ação inline |
|---|---|
| Ponto gramatical com erro | "2 frases feitas" (stepper) |
| Palavras não ativadas | "Ativei {n}" (stepper) |
| Frases pendentes de produção | "Registrar sessão" |
| Gravação não feita | "Marcar como gravada" (+ campo de link opcional) |
| Áudio do grupo pendente | "Mandei o áudio" |
| Autoavaliação de bloco pendente | "Autoavaliar" (abre formulário) |

- **Marcar ponto gramatical como "errei"** (`RN-410`): botão em cada ponto listado na aba "Pontos gramaticais" desta mesma tela, que cria a tarefa automática.
- **Linha fixa no rodapé:** *"Cartões devidos ficam no Flashcards Deluxe."* — nunca há fila de cartões aqui.

### 7.2 Estados

- **Vazio:** *"Nada em dívida. Raro e bom."* com o número de itens resolvidos nos últimos 7 dias.
- **Muitos itens (> 20):** paginação por rolagem infinita, com contador fixo no topo.

### 7.3 Atalhos

`J` `K` navegam; `Enter` executa a ação primária do item; `1..9` seleciona o enésimo item visível.

### 7.4 Responsivo

< 768px: ações inline viram um botão único que abre folha inferior.

---

## 8. Planilha de Distribuição

**Objetivo:** definir para onde o tempo deve ir e comparar com para onde ele foi.

### 8.1 Componentes

1. **Bloco vigente** — nome, período, idioma-foco, e "faltam {n} dias".
2. **Distribuição por idioma** — tabela editável: idioma, alvo %, realizado % no período, delta em pp com cor (`RN-902`). Rodapé com a soma e o botão "Normalizar para 100%" (`RN-904`).
3. **Distribuição por pilar** — mesma tabela, quatro linhas (25/25/20/30 default).
4. **Gráfico alvo × realizado** — **barras divergentes horizontais**: eixo Y = idiomas e pilares (dois grupos separados); eixo X = delta em pontos percentuais, zero no centro, negativo à esquerda. Cor por magnitude do desvio.
5. **Foco do mês** (`RN-903`) — seletor de idioma + pilar + campo livre; mostra a sugestão automática e um botão "usar sugestão".
6. **Blocos do plano** — tabela dos quatro blocos com datas, foco e os três percentuais, todos editáveis; linha do bloco vigente destacada.
7. **Seletor de período** para o "realizado": este mês (default), bloco vigente, últimos 30 dias, ano.

### 8.2 Estados

- **Vazio de realizado:** as colunas de realizado mostram "—" e o delta some.
- **Soma ≠ 100%:** faixa amarela e o botão de normalizar em destaque; salvar continua permitido com diferença ≤ 1 pp.
- **Edição de bloco com datas sobrepostas:** erro inline *"Este período se sobrepõe a {bloco}."* — único bloqueio de gravação da tela.

### 8.3 Atalhos

`Tab` percorre células; `↑` `↓` alteram o percentual focado em 5 pontos; `Ctrl+S` salva; `N` normaliza.

### 8.4 Responsivo

< 768px: tabelas viram lista de cartões com alvo e realizado lado a lado; o gráfico divergente ganha rolagem horizontal.

---

## 9. Materiais de Estudo

**Objetivo:** saber, por idioma, onde ela parou no material principal.

### 9.1 Componentes

- **Três cartões grandes** (um por idioma) para o material principal: título, tipo, anel ou barra de progresso, "lição 14 de 40", % concluído, "última sessão: 3 dias atrás", botão "+1 lição" e botão "Registrar sessão com este material".
- **Lista de materiais secundários** por idioma, em tabela: título, tipo, progresso, última sessão, ações.
- **Botão "Novo material"** com formulário: idioma, tipo, título, unidade, total, posição atual, URL, principal (checkbox).
- Regra visível: *"Um material principal por idioma."* Marcar outro como principal mostra a confirmação *"{atual} deixa de ser o principal do {idioma}. Confirmar?"*

### 9.2 Estados

- **Sem material principal:** o cartão do idioma mostra *"Nenhum material principal em {idioma}."* + botão "Definir material principal".
- **Material sem total:** esconde o percentual, mostra só "lição 14" e a data da última sessão.
- **Material parado há mais de 21 dias:** faixa laranja no cartão *"Parado há {n} dias."*

### 9.3 Atalhos

`+` avança uma unidade no material focado; `N` novo material; `/` busca.

### 9.4 Responsivo

< 768px: três cartões empilhados; tabela vira lista.

---

## 10. Recursos

**Objetivo:** biblioteca de links achável em dois segundos.

### 10.1 Componentes

- **Busca** no topo (`/` foca), filtrando por título, nota e URL em tempo real.
- **Filtros por chips:** idioma (3 + "todos"), pilar (4), tipo (10 tipos do enum), favorito.
- **Grade de cartões** de 3 colunas: ícone do tipo, título, domínio da URL em cinza, chips de idioma e pilar, estrela de favorito, nota em duas linhas com reticências.
- Clicar abre em nova aba e grava `ultimo_acesso_em`.
- **Botão "Novo recurso"** com formulário curto (título, URL, tipo, idiomas, pilares, nota).

### 10.2 Estados

- **Vazio:** *"Nenhum recurso salvo ainda."* + botão + sugestão de importar uma lista (colar várias URLs, uma por linha).
- **Busca sem resultado:** *"Nada para '{termo}'."* + botão "Limpar filtros".

### 10.3 Atalhos

`/` busca; `Enter` abre o primeiro resultado; `N` novo; `F` favorita o cartão focado.

### 10.4 Responsivo

< 1024px: 2 colunas. < 768px: 1 coluna, filtros em gaveta.

---

## 11. Conquistas

**Objetivo:** reconhecimento derivado do método, com peso especial em produção e recuperação.

### 11.1 Componentes

- **Resumo no topo:** conquistadas / total, e a contagem por categoria em cinco pastilhas coloridas.
- **Filtros:** categoria, idioma, estado (todas / conquistadas / bloqueadas), "perto de conquistar" (progresso ≥ 70%).
- **Grade de 3 colunas.** Cada card: fundo pastel na cor da categoria, ícone circular centralizado no topo, nome em negrito, critério em cinza, e — quando conquistada — a data e a ação "Compartilhar" com ícone. Bloqueadas: cinza dessaturado, **critério sempre visível**, barrinha de progresso `progresso_atual / progresso_alvo`.
- **Compartilhar** gera uma imagem PNG 1080×1080 do card com o número e o nome, baixada localmente. `[DECISÃO: compartilhar = gerar imagem e baixar, sem integração com rede social.]` Justificativa: o app é offline-first e sem backend; o compartilhamento real acontece no aplicativo de destino.
- Repetíveis mostram "×{vezes}" no canto.

### 11.2 Estados

- **Vazio:** impossível — o catálogo é semeado. Com nenhuma conquistada, o topo mostra *"0 de {n}. A primeira é fácil: registre 7 dias seguidos."*
- **Recém-conquistada:** ao ganhar, aparece um toast persistente com o card animado, e o card fica com borda destacada por 48h.

### 11.3 Atalhos

`F` alterna o filtro "perto de conquistar"; `J` `K` navegam; `Enter` abre o detalhe.

### 11.4 Responsivo

< 1024px: 2 colunas. < 768px: 1 coluna.

---

## 12. Importação do Toggl

**Objetivo:** trazer o histórico e manter o passado coerente com o presente. Acessível por Configurações → Importação e por rota própria.

### 12.1 Fluxo em três passos

**Passo 1 — Arquivo.** Área de arrastar e soltar CSV; validação de colunas obrigatórias (`RN-1001`); resumo: linhas, intervalo de datas, projetos e tags encontrados.

**Passo 2 — Pré-visualização** (`RN-1005`). Quatro contadores no topo: novas, duplicadas, conflitos, precisam revisão. Tabela virtualizada com uma linha por registro: data, hora, duração, texto original (projeto/descrição/tags) e as quatro saídas (idioma, atividade, pilar, tempo) em selects editáveis. Filtro por status. Ação em massa: "aplicar esta classificação a todas as linhas com a mesma descrição". Painel lateral de conflitos com as três opções por linha (`RN-1004`).

**Passo 3 — Confirmar.** Resumo do impacto: horas por idioma e por categoria que serão adicionadas, e quais indicadores serão recalculados. Botão "Importar {n} sessões".

### 12.2 Editor de regras de mapeamento

Tabela ordenável por arrastar: ordem, campo, operador, valor, saídas, ativa. Botão "testar regra" mostra quantas linhas do arquivo carregado ela pegaria. Botão "restaurar mapeamento padrão" (`RN-1003`).

### 12.3 Histórico de lotes

Lista dos lotes importados com data, arquivo, contagens e botão "Desfazer" (`RN-1006`), desabilitado quando outro lote cobriu o mesmo intervalo depois.

### 12.4 Estados

- **Vazio:** *"Nenhuma importação ainda."* + instruções de como exportar o relatório detalhado no Toggl (3 passos em texto).
- **Arquivo inválido:** erro no passo 1 nomeando a coluna faltante, sem avançar.
- **Processando:** barra de progresso com contagem de linhas; a análise roda em Web Worker para não travar a interface.
- **Importação parcial com falha:** transação revertida por inteiro; nenhum lote pela metade.

### 12.5 Atalhos

`↑` `↓` navegam linhas na pré-visualização; `1..9` aplicam a enésima atividade à linha focada; `Ctrl+Enter` confirma a importação.

### 12.6 Responsivo

< 1024px: a tabela de pré-visualização ganha rolagem horizontal com as colunas de data e duração fixas. < 768px: fluxo em passos empilhados, uma linha por cartão.

---

## 13. Configurações

**Objetivo:** todo parâmetro do método editável, sem esconder nada em código.

### 13.1 Seções (navegação lateral interna)

1. **Idiomas** — tabela dos idiomas ativos: nome, bandeira, cor, nível inicial/atual/meta, data-alvo, palavras base, meta de palavras/dia, ativo. Botão "Adicionar idioma".
2. **Metas** — as 14 metas semeadas, editáveis: alvo, base, periodicidade, prazo, cor, ativa.
3. **Divisão-alvo de habilidades** — os quatro percentuais de pilar com normalização (`RN-904`), espelhando a Planilha de Distribuição.
4. **Marchas** — as três definições: nome, descrição e a lista de tarefas com dias da semana, escopo e critério (`MarchaDef.tarefas`). As três tarefas da marcha 1 são marcadas como não removíveis (`RN-206`).
5. **Camadas e limiares** — os cinco limiares de palavras e os nomes das camadas; as quatro faixas da régua de frequência.
6. **Alertas** — todos os gatilhos de `RN-1101`, com o valor default ao lado de cada campo e um botão "restaurar defaults".
7. **Mapeamento do Toggl** — o editor descrito em 12.2.
8. **Backup e exportação** — botão "Exportar tudo (JSON)", "Exportar sessões (CSV)", "Importar backup", estado do backup automático, data do último backup e pasta escolhida. Aviso ao importar: *"Isso substitui todos os dados atuais."* com confirmação por digitação da palavra "substituir".
9. **Aparência** — tema claro / escuro / sistema.
10. **Diagnóstico** — tempo mediano de registro, % de dias com o app aberto, contagem de registros por origem, tamanho do banco, versão do schema.

### 13.2 Estados

- **Alteração não salva:** barra fixa no rodapé com "Descartar" e "Salvar" — as seções salvam por seção, não campo a campo.
- **Valor fora de faixa:** erro inline com o intervalo permitido.
- **Importação de backup:** modal bloqueante com progresso; ao terminar, recarrega o app.

### 13.3 Atalhos

`Ctrl+S` salva a seção; `Esc` descarta.

### 13.4 Responsivo

< 768px: a navegação lateral interna vira uma lista de links; cada seção abre em tela cheia com "voltar".

---

## 14. Matriz de cobertura das regras nas telas

| Regra | Telas |
|---|---|
| RN-101…106 (classificação) | Registro |
| RN-201…206 (marchas) | Hoje, Configurações, Dashboard (F) |
| RN-301…307 (seis regras) | Hoje, Registro (RN-305, RN-306) |
| RN-401…410 (vocabulário) | Flashcards, Hoje, Revisão |
| RN-501…507 (camadas e metas) | Metas, Dashboard (I), Flashcards |
| RN-601…604 (retomada) | Hoje, Metas, Configurações |
| RN-701…713 (indicadores) | Dashboard, Planilha de Distribuição |
| RN-801…804 (tarefas) | Tarefas, Hoje, Revisão |
| RN-901…904 (distribuição) | Planilha de Distribuição, Metas |
| RN-1001…1006 (Toggl) | Importação, Configurações |
| RN-1101…1103 (alertas e filas) | Configurações, sidebar, Hoje, Revisão |
