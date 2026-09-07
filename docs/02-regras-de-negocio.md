# 02 — Regras de negócio

Todas as regras seguem o formato **gatilho → condição → ação → mensagem**. Todo ID é estável e citado nos outros documentos.

Notação usada no pseudocódigo:

- `S` = conjunto de Sessões; `s.duracao_min`, `s.idioma`, `s.pilar`, `s.categoria`, `s.atividade`, `s.tempo`, `s.minutos_fala`, `s.data`.
- `P` = período analisado, `[P.inicio, P.fim]` inclusive, em datas locais.
- `S(P)` = sessões com `data ∈ P`. `S(P, i)` = as do idioma `i`.
- `hoje` = data local (America/Sao_Paulo). Semana = ISO, segunda a domingo.
- `soma(X, campo)` = soma do campo sobre o conjunto X. `dias(X)` = nº de datas distintas em X.

---

## Grupo 0 — Anti-requisitos (regras proibidas)

### RN-001 — Passivo nunca é somado a ativo
Nenhum indicador, gráfico, meta ou conquista pode exibir um número que some `minutos_imersao` a `minutos_ativo` sob um rótulo único de "estudo". Onde o total geral for exibido, ele é sempre rotulado "tempo total" e vem imediatamente acompanhado da composição em três partes (`RN-701`).

### RN-002 — Proibido acoplar produção a sessão de imersão
**Nunca** gerar tarefa, alerta, modal, pergunta, badge ou lembrete de produção (falar, escrever, gravar, resumir) como consequência de salvar uma sessão de `categoria = imersao`. Salvar imersão faz uma coisa só: salvar e fechar.
A cobrança de produção existe apenas em três lugares, todos **semanais e agregados**: minutos de fala por semana (`RN-706`), áudio no grupo da semana (`RN-304`) e conversação agendada (`RN-303`).

### RN-003 — Proibido gerenciar flashcards
O app não persiste cartão, frente, verso, áudio, intervalo de revisão, fila de devidos ou histórico de acerto por cartão. As únicas entidades de vocabulário são contagens e checks diários (`RegistroVocabulario`, `RevisaoFlashcards`). Qualquer tela que ofereça "criar cartão", "revisar agora" ou "cartões devidos" está fora da especificação.

### RN-004 — Proibido bloquear registro
Nenhuma validação impede salvar uma sessão. Conflitos com o método (`RN-305`) geram aviso confirmável, nunca erro bloqueante. Dado não registrado é pior que dado imperfeito.

---

## Grupo 1 — Classificação de sessão

### RN-101 — Taxonomia de atividade
Toda sessão tem exatamente uma `atividade`. Cada atividade determina `categoria`, `pilar` default, `tempo` default e se conta como produção.

| atividade | categoria | pilar default | tempo default | produção |
|---|---|---|---|---|
| `flashcards` | ativo | vocabulário | mãos livres | não |
| `gramatica` | ativo | gramática | cadeira | não |
| `pronuncia` | ativo | pronúncia | cadeira | não |
| `fala_sozinha` | ativo | fala | mãos ocupadas | **sim** |
| `conversacao` | ativo | fala | cadeira | **sim** |
| `aula` | ativo | fala | cadeira | **sim** |
| `audio_grupo` | ativo | fala | mãos livres | **sim** |
| `gravacao_video` | ativo | fala | cadeira | **sim** |
| `escrita` | ativo | gramática | cadeira | **sim** |
| `leitura` | imersão | — | mãos livres | não |
| `serie_filme` | imersão | — | mãos livres | não |
| `podcast` | imersão | — | mãos ocupadas | não |
| `audiobook` | imersão | — | mãos ocupadas | não |
| `youtube` | imersão | — | mãos livres | não |
| `browser_mode` | imersão | — | mãos livres | não |
| `conteudo_instagram` | ativo | fala | cadeira | **sim** |
| `outro` | ativo | *obrigatório escolher* | cadeira | não |

`[DECISÃO: acrescentei ao formulário as atividades browser_mode, audio_grupo, gravacao_video e conteudo_instagram.]` Justificativa: as regras 4 e 6, o protocolo de retomada e a métrica "vídeos de produção gravados" exigem que esses eventos sejam registráveis; sem eles a regra não teria como ser computada.

`[DECISÃO: escrita tem pilar gramática e flag de produção.]` Justificativa: os quatro pilares não incluem escrita, mas a linha de base mede "produção = fala + escrita"; separar o flag do pilar preserva os dois números.

### RN-102 — Categoria de imersão é imutável
**Gatilho:** salvar/editar sessão.
**Condição:** `atividade ∈ {serie_filme, podcast, audiobook, youtube, browser_mode}`.
**Ação:** `categoria = imersao` e `pilar = null`, campos travados na interface.
**Mensagem:** *"Escuta e consumo não são pilar. Isso entra como imersão."* (texto fixo abaixo do campo, cinza).

`leitura` é a única atividade de imersão cuja categoria pode ser trocada para ativo — nesse caso o pilar vira obrigatório.

### RN-103 — Derivação de categoria
```
categoria(s) = imersao   se s.atividade ∈ ATIVIDADES_IMERSAO e não sobrescrita
             = ativo     caso contrário
pilar(s)     = null      se categoria = imersao
             = default da tabela RN-101, editável, se categoria = ativo
```
Sessão com `categoria = ativo` **precisa** de pilar. Sessão com `categoria = imersao` **não pode** ter pilar.

### RN-104 — Tempo do dia obrigatório
Toda sessão tem exatamente um `tempo ∈ {cadeira, maos_livres, maos_ocupadas}`, pré-preenchido pela tabela `RN-101` e sempre editável. Não existe "não informado".

### RN-105 — Minutos de fala
```
se s.atividade ∈ {fala_sozinha, conversacao, aula, audio_grupo, gravacao_video, conteudo_instagram}
   e s.minutos_fala é vazio:
      s.minutos_fala = s.duracao_min
senão:
      s.minutos_fala = valor informado (default 0)
```
Qualquer sessão pode ter `minutos_fala > 0` — inclusive uma de gramática em que ela produziu frases em voz alta. `minutos_fala ≤ duracao_min` sempre; se informado maior, corrige para `duracao_min` e avisa.

### RN-106 — Duração mínima e cronômetro
Duração em minutos inteiros, mínimo 1, máximo 480. O cronômetro arredonda para o minuto mais próximo, com piso de 1.

---

## Grupo 2 — Marchas

### RN-201 — Marcha ativa única
Existe exatamente uma marcha ativa por vez (1, 2 ou 3). Trocar de marcha fecha o registro anterior (`data_fim = ontem`) e abre um novo (`data_inicio = hoje`). O histórico nunca é apagado — é ele que explica quedas e picos no dashboard (`RN-711`).

### RN-202 — Catálogo de tarefas por marcha
As tarefas que a marcha exige, com o dia da semana em que valem. `D` = dias da semana (1=seg … 7=dom).

**Marcha 1 — Sobrevivência (~15 min/dia)**

| Tarefa | Dias | Critério de conclusão |
|---|---|---|
| Revisar flashcards | 1–7 | check `RevisaoFlashcards.revisou = true` em qualquer idioma |
| 1 minuto de fala | 1–7 | `minutos_fala` do dia ≥ 1 |
| Imersão de mãos ocupadas | 1–7 | ≥ 1 sessão com `categoria = imersao` e `tempo = maos_ocupadas` |

**Marcha 2 — Cruzeiro (~5 h/semana)** = tudo da marcha 1, mais:

| Tarefa | Dias | Critério de conclusão |
|---|---|---|
| Bloco de 40 min pela manhã | 1, 2, 3, 4 | ≥ 40 min em sessões `ativo` com `tempo = cadeira` no dia |
| Clube de conversação | semanal | 1 sessão `conversacao` concluída na semana |
| 1 áudio no grupo | semanal | 1 sessão/tarefa `audio_grupo` concluída na semana |
| Sexta de pronúncia (25 min) | 5 | ≥ 25 min em sessões `pilar = pronuncia` na sexta |

**Marcha 3 — Turbo (8–10 h/semana)** = tudo da marcha 2, mais:

| Tarefa | Dias | Critério de conclusão |
|---|---|---|
| Aula particular ou conversação extra | semanal | 1 sessão `aula` **ou** 2ª sessão `conversacao` na semana |
| Bloco de sábado: revisão + escrita | 6 | ≥ 1 sessão `escrita` **e** ≥ 1 item da tela Revisão resolvido no sábado |
| Conteúdo no Instagram (opcional) | semanal | 1 sessão `conteudo_instagram` — nunca marca a semana como falha |

### RN-203 — Geração da lista do dia
**Gatilho:** abrir a tela Hoje, ou virar o dia com o app aberto.
**Condição:** sempre.
**Ação:** `tarefas_hoje = filtrar(catalogo(marcha_ativa), dia_da_semana(hoje))`, marcando cada uma como cumprida ou não pelo seu critério. Itens semanais aparecem todos os dias enquanto pendentes, com o rótulo "esta semana".
**Mensagem:** título do bloco = `Marcha {n} — {nome}`.

### RN-204 — Sexta é pronúncia, não gramática
**Gatilho:** montar a lista de Hoje quando `dia_da_semana(hoje) = 5`.
**Condição:** marcha ≥ 2.
**Ação:** a tarefa de bloco matinal de sexta é substituída por "Sexta de pronúncia — 25 min"; nenhuma tarefa de gramática é oferecida na sexta.
**Mensagem:** *"Sexta é dia de pronúncia."*

### RN-205 — Troca de marcha em uma tecla
**Gatilho:** teclas `1`, `2`, `3` na tela Hoje, ou clique no seletor de marcha.
**Condição:** marcha escolhida ≠ marcha ativa.
**Ação:** aplica `RN-201` e recarrega as tarefas do dia sem confirmação intermediária.
**Mensagem:** toast *"Marcha 1 — Sobrevivência. O piso continua o mesmo."* (o texto após o travessão muda por marcha: 2 → "Quatro blocos e o clube."; 3 → "Turbo. Sábado tem bloco.").

### RN-206 — Marcha 1 é o chão, nunca some
Em qualquer marcha, as três tarefas da marcha 1 aparecem sempre e primeiro na tela Hoje. Nenhuma configuração pode removê-las.

---

## Grupo 3 — As seis regras invioláveis

Cada regra tem um estado de semáforo calculado a cada abertura da tela Hoje e a cada gravação de sessão.

### RN-301 — Regra 1: nunca dois dias seguidos em branco
```
em_branco(d) = |S(d)| = 0 e nenhum check de flashcards em d e nenhuma tarefa concluída em d
estado =
  vermelho  se em_branco(ontem) e em_branco(hoje)
  amarelo   se não em_branco(ontem) e em_branco(hoje) e hora_local ≥ 20:00
  cinza     se não em_branco(ontem) e em_branco(hoje) e hora_local < 20:00
  verde     se não em_branco(hoje)
```
**Ação no vermelho:** o cartão da regra sobe para o topo da tela Hoje e ganha o botão "Registrar 1 minuto agora", que grava uma sessão `fala_sozinha`, 1 min, `maos_ocupadas`, idioma-foco do bloco vigente.
**Mensagem (vermelho):** *"Ontem foi em branco. Hoje não pode ser. Um minuto resolve."*
**Mensagem (amarelo):** *"O dia está em branco. Um minuto de fala e ele deixa de estar."*

### RN-302 — Regra 2: o piso independe da marcha
```
piso_flashcards(d) = existe RevisaoFlashcards(data=d, revisou=true) para algum idioma
piso_fala(d)       = soma(S(d), minutos_fala) ≥ 1
piso_cumprido(d)   = piso_flashcards(d) e piso_fala(d)
estado = verde se ambos; amarelo se exatamente um; vermelho se nenhum e hora ≥ 20:00; cinza se nenhum e hora < 20:00
```
**Ação:** o piso ocupa um cartão próprio, visualmente separado do resto da tela Hoje, com dois botões de um clique: "Revisei" (abre seletor de idiomas, multi-seleção) e "Falei 1 min" (grava sessão de 1 min).
**Mensagem (vermelho):** *"O piso não foi cumprido hoje. Ele não depende da marcha."*

### RN-303 — Regra 3: clube é compromisso marcado
```
clube_agendado = existe Tarefa(tipo=clube_conversacao, data_prevista ∈ [hoje, hoje+13], estado ≠ concluida)
clube_semana   = existe Sessão(atividade=conversacao, data ∈ semana_atual)
estado =
  verde    se clube_semana
  amarelo  se não clube_semana e clube_agendado
  vermelho se não clube_semana e não clube_agendado e marcha_ativa ≥ 2
  cinza    se marcha_ativa = 1
```
**Ação no vermelho:** botão "Agendar clube" cria uma Tarefa `clube_conversacao` com data prevista sugerida = próxima quarta-feira.
**Mensagem:** *"Nenhum clube marcado nos próximos 14 dias. Intenção não conta — marque a data."*

### RN-304 — Regra 4: um áudio no grupo por semana
```
audio_semana = existe Sessão(atividade=audio_grupo, data ∈ semana_atual)
             ou existe Tarefa(tipo=audio_grupo, concluida_em ∈ semana_atual)
estado =
  verde    se audio_semana
  amarelo  se não audio_semana e dia_da_semana(hoje) ∈ {4,5,6}
  vermelho se não audio_semana e dia_da_semana(hoje) = 7
  cinza    caso contrário
```
**Ação:** botão "Mandei o áudio" grava sessão `audio_grupo` com duração default 1 min.
**Mensagem (vermelho):** *"A semana acaba hoje sem áudio no grupo. Feio mesmo vale."*

### RN-305 — Regra 5: gramática e pronúncia nunca no mesmo dia
**Gatilho:** salvar sessão com `pilar ∈ {gramatica, pronuncia}`.
**Condição:** já existe no mesmo dia (qualquer idioma) sessão com o outro desses dois pilares.
**Ação:** exibe aviso confirmável com dois botões — "Salvar assim mesmo" e "Trocar o pilar". Se confirmado, a sessão é salva e marcada com `violou_regra_5 = true`. A regra **não bloqueia** (`RN-004`).
**Mensagem:** *"Você já estudou {pilar_existente} hoje. Gramática e pronúncia no mesmo dia se atrapalham. Salvar assim mesmo?"*

Estado do semáforo do dia: `vermelho` se existe sessão com `violou_regra_5 = true` hoje; `verde` caso contrário.
Na sexta-feira, a mensagem ganha uma linha: *"Além disso, hoje é sexta — dia de pronúncia."*

`[DECISÃO: a regra 5 avisa e deixa passar, registrando a violação.]` Justificativa: `RN-004` proíbe bloquear registro; e o indicador "mês sem violar a regra 5" (conquista `MET-04`) só existe se as violações forem gravadas em vez de impedidas.

### RN-306 — Regra 6: Instagram só na marcha 3
**Gatilho:** abrir o seletor de atividade no formulário de registro, ou a lista de tarefas do dia.
**Condição:** `marcha_ativa < 3`.
**Ação:** a atividade `conteudo_instagram` aparece desabilitada; a tarefa correspondente não é gerada.
**Mensagem (tooltip):** *"Conteúdo no Instagram é da marcha 3. Você está na marcha {n}."*

### RN-307 — Semáforo consolidado
A tela Hoje exibe as seis regras como seis pastilhas na ordem 1→6, cada uma com cor (`RN-301` a `RN-306`), nome curto e, quando amarela ou vermelha, o botão de ação da própria regra. Ordenação: vermelhas primeiro, depois amarelas, depois verdes, mantendo a ordem numérica dentro de cada grupo.

---

## Grupo 4 — Vocabulário e flashcards

### RN-401 — Fronteira do app
Repete `RN-003` em termos de dado: o app grava por dia e por idioma **apenas** `palavras_novas` (inteiro), `palavras_ativadas` (inteiro), `revisou` (booleano), `minutos_criacao` (inteiro, opcional) e `pct_acerto_deck` (0–100, opcional, esporádico). Nada além disso.

### RN-402 — Registro de palavras novas
**Gatilho:** salvar sessão `atividade = flashcards` com `palavras_novas > 0`, ou usar o campo direto da tela Flashcards.
**Ação:** cria/atualiza `RegistroVocabulario(idioma, data)` somando as palavras. Recalcula acumulado e camada (`RN-501`).
**Mensagem:** *"+{n} palavras. {acumulado} no total — faltam {faltam} para {próxima camada}."*

### RN-403 — Check diário de revisão
**Gatilho:** botão "Revisei" na tela Hoje ou Flashcards.
**Condição:** um check por (idioma, data); reclicar desmarca.
**Ação:** grava `RevisaoFlashcards(idioma, data, revisou=true)`. **Não** pergunta quantos cartões.
**Mensagem:** *"Revisão marcada. {k} dias seguidos."*
O indicador que importa é frequência, não volume — nenhuma tela pede contagem de cartões revisados.

### RN-404 — Percentual de acerto do deck
**Gatilho:** campo manual na tela Flashcards, preenchido quando ela quiser.
**Condição:** valor entre 0 e 100; no máximo um por (idioma, data).
**Ação:** grava ponto na série histórica; a tela mostra tendência (últimos 12 pontos) e a variação contra o ponto anterior.
**Mensagem:** *"{pct}% — {+/-n} pontos desde {data anterior}."* Sem valor anterior: *"Primeiro registro de acerto para {idioma}."*

### RN-405 — Velocidade de criação do lote
```
min_por_palavra = minutos_criacao / palavras_novas
faixa =
  "acima de A"      se min_por_palavra > 2.0
  "velocidade A"    se 1.5 < min_por_palavra ≤ 2.0
  "entre A e B"     se 1.0 < min_por_palavra ≤ 1.5
  "velocidade B"    se min_por_palavra ≤ 1.0
```
**Gatilho:** parar o cronômetro de criação com `palavras_novas > 0`.
**Ação:** exibe a faixa, o valor em min/palavra com uma casa decimal, e a comparação com a mediana das últimas 10 criações do mesmo idioma.
**Mensagem:** *"{n} palavras em {m} min — {x} min/palavra. {faixa}."*
Cronômetro sem palavras informadas: não calcula, pede o número.

### RN-406 — Checagem de interferência
**Gatilho:** botão "Checar lote" na caixa de colar lista, na tela Flashcards.
**Entrada:** texto livre; separadores aceitos: quebra de linha, vírgula, ponto e vírgula, tabulação. Cada item é normalizado (`trim`, minúsculas, remoção de acentos, remoção de artigos iniciais `to `, `the `, `el `, `la `, `le `, `un `, `une `, `der/die/das`).
**Condição:** ≥ 3 itens.
**Ação:** roda os cinco testes abaixo e devolve uma lista de avisos, cada um com os itens envolvidos. **Nada é persistido** (`RN-409`).

| Teste | Condição computável | Aviso |
|---|---|---|
| **Ordem alfabética** | proporção de pares consecutivos `(i, i+1)` com `norm[i] ≤ norm[i+1]` ≥ 0,7 e `n ≥ 5` | *"O lote está quase em ordem alfabética. Embaralhe antes de criar."* |
| **Grafia parecida** | par com distância de Levenshtein ≤ 2 **e** `1 - dist/max(len)` ≥ 0,7; ou prefixo comum ≥ 4 caracteres com ambas as palavras ≥ 5 caracteres | *"{a} e {b} se escrevem parecido. Separe em lotes diferentes."* |
| **Som parecido** | esqueleto fonético igual, ou distância ≤ 1 entre esqueletos (ver `RN-407`) | *"{a} e {b} soam parecido. Isso vira interferência."* |
| **Mesma palavra, vários sentidos** | duas entradas com a mesma forma-base (texto antes de `/`, `(`, `-` ou `,`), ou mesmo lema aproximado após remoção dos sufixos do idioma | *"{a} aparece {k} vezes com sentidos diferentes. Deixe um por lote."* |
| **Excesso de verbos** | `verbos / n > 0,40` e `n ≥ 5`, onde verbo = item que começa com `to ` (EN) ou termina em `ar/er/ir` (ES) ou `er/ir/re/oir` (FR) | *"{k} de {n} itens são verbos ({pct}%). Misture substantivos e adjetivos."* |

Se nenhum teste dispara: *"Lote limpo. Pode criar."*

### RN-407 — Esqueleto fonético (usado por RN-406)
Aplicado após a normalização, por idioma:
1. remover acentos e minúsculas;
2. colapsar letras repetidas (`ll` → `l`, `tt` → `t`);
3. substituições comuns: `ph→f`, `qu→k`, `q→k`, `c→k` antes de `a/o/u`, `c→s` antes de `e/i`, `z→s`, `x→ks`, `y→i`, `w→v`, `gn→n` (FR), `ch→x`, `h→∅` (ES/FR), `ough→o` (EN);
4. remover vogais finais mudas em FR (`e` final);
5. colapsar sequências de vogais em uma só vogal `V`.
Dois itens colidem se o esqueleto for igual ou tiver distância de Levenshtein ≤ 1.

Heurística assumidamente grosseira. `[DECISÃO: sem biblioteca fonética externa e sem chamada de rede.]` Justificativa: o app é offline-first; um falso positivo custa um segundo de leitura, e o objetivo é lembrar de embaralhar, não classificar fonemas.

### RN-408 — Ativação de palavra nova
```
pendentes_ativacao(i) = Σ (palavras_novas - palavras_ativadas) sobre RegistroVocabulario(idioma=i)
                        restrito aos últimos 30 dias, mínimo 0
```
**Gatilho:** virada do dia, quando `pendentes_ativacao(i) > 0`.
**Ação:** cria (ou atualiza) tarefa automática `ativar_palavras` por idioma: *"Ativar {k} palavras com 1 a 3 frases faladas"*. Concluir a tarefa pede o número de palavras ativadas e soma em `palavras_ativadas`.
**Mensagem:** *"{k} palavras ainda não saíram da fila 'nova'. Elas precisam de frase falada."*
Esta regra é disparada por **criação de palavras**, nunca por imersão (`RN-002`).

### RN-409 — A lista colada não é persistida
O texto colado na checagem de interferência vive apenas na memória da tela. Ao sair da tela, ele some. Não vira cartão, não vira deck, não é gravado no IndexedDB, não entra no backup. Persistir apenas o resultado agregado: `RegistroVocabulario.checagem_rodada = true` e `qtd_avisos`.

### RN-410 — Erro em ponto gramatical
**Gatilho:** marcar um `PontoGramatical` como "errei na revisão" na tela Revisão.
**Condição:** o ponto não tem tarefa de correção aberta.
**Ação:** cria tarefa automática `frases_apos_erro`, prazo = hoje+1, com `frases_exigidas = 2`.
**Mensagem:** *"Anotado. Duas frases novas em voz alta com {ponto} até amanhã."*
Conclusão: pede o número de frases produzidas; só conclui com `frases ≥ 2`, e soma em `Sessao.frases_produzidas` se houver sessão associada.

---

## Grupo 5 — Camadas, níveis e metas

### RN-501 — Camadas de fluência
| Camada | Nome | Limiar |
|---|---|---|
| 0 | Base | 0 |
| 1 | Viajante | 1.500 |
| 2 | Conexão | 3.000 |
| 3 | Negócios | 5.000 |
| 4 | Acadêmico | 10.000 |
| 5 | Maestria | 20.000 |

```
acumulado(i) = Idioma(i).palavras_base + Σ RegistroVocabulario(i).palavras_novas
camada(i)    = maior c tal que limiar(c) ≤ acumulado(i)
faltam(i)    = limiar(camada+1) - acumulado(i)          // 0 na camada 5
progresso(i) = (acumulado - limiar(camada)) / (limiar(camada+1) - limiar(camada))
```
`palavras_base` é o ponto de partida informado em Configurações (ex.: inglês = 2.729), para o acumulado não começar do zero.

### RN-502 — Régua de frequência
Exibida como faixa de contexto ao lado da camada, calculada sobre o mesmo `acumulado(i)`:

| Faixa | Rótulo |
|---|---|
| < 2.000 | "Ainda em A1/A2 — as 2.000 mais frequentes tiram você daqui" |
| 2.000–2.999 | "Saindo de A2" |
| 3.000–8.999 | "Território B1/B2" |
| ≥ 9.000 | "Faixa avançada" |

### RN-503 — Escala de níveis
Ordem canônica, usada para calcular progresso de nível:
`A0 < A1.1 < A1.2 < A2.1 < A2.2 < B1.1 < B1.2 < B2.1 < B2.2 < C1.1 < C1.2 < C2` (índices 0 a 11).
```
progresso_nivel(i) = (idx(atual) - idx(inicial)) / (idx(meta) - idx(inicial)), limitado a [0,1]
```
Estado inicial: inglês `inicial=B1.2, meta=B2.2` · espanhol `inicial=B1.2, meta=C1.1` · francês `inicial=A0, meta=B2.1`.

### RN-504 — Autoavaliação de nível
**Gatilho:** último domingo de cada bloco do plano (30/12/2026, 30/04/2027, 31/08/2027, 31/12/2027) — ou botão manual.
**Condição:** não existe `Autoavaliacao` para (idioma, bloco).
**Ação:** cria tarefa `autoavaliacao` para cada idioma ativo; a tela Metas mostra o formulário (nível escolhido na escala + campo de observação livre).
**Mensagem:** *"Fim do bloco {nome}. Onde está o seu {idioma} hoje?"*
Enquanto pendente, o item aparece na tela Revisão.

### RN-505 — Meta de palavras (estilo Caiz)
```
meta_dia(i)      = Meta(tipo=palavras, idioma=i).valor_diario
feito_hoje(i)    = RegistroVocabulario(i, hoje).palavras_novas
progresso_dia    = feito_hoje / meta_dia
projecao_camada  = faltam(i) / media_movel_7d(palavras_novas(i))   // em dias
```
**Mensagem no cartão:** *"{feito}/{meta} hoje · {acumulado}/{limiar} para {nome da camada} · nesse ritmo, {projecao} dias."*
Se `media_movel_7d = 0`: *"nesse ritmo, nunca"* — literalmente esse texto.

### RN-506 — Meta de conversação
Três subindicadores por período, todos semanais por padrão:
```
conversas_semana = |Sessão(atividade ∈ {conversacao, aula}, semana)|
fala_semana      = soma(S(semana), minutos_fala)
audio_semana     = |Sessão(atividade=audio_grupo, semana)| ≥ 1
sessoes_pagas    = |Tarefa(tipo=aula_paga, estado=concluida, mês)|
```
Metas default: `conversas_semana ≥ 1` (marcha 2) ou `≥ 2` (marcha 3); `fala_semana ≥ 60`; `audio_semana = verdadeiro`.

### RN-507 — Painel mensal (os cinco indicadores)
Conjunto próprio de metas, com estado atual, alvo e cor de progresso:

| Indicador | Fórmula | Base | Alvo |
|---|---|---|---|
| Dias com registro | `dias(S(mês)) ∪ dias(checks(mês))` | 12 | 20 |
| % em estudo ativo | `RN-702` | 16% | 35% |
| Minutos de fala/semana | média de `RN-706` nas semanas do mês | 13 | 60 |
| Dias com flashcards/semana | média de `RN-707` | 0,9 | 5 |
| Maior lacuna do mês | `RN-704` | 14 | ≤ 2 |

Regra de cor: verde se atingiu o alvo; amarelo se ≥ 60% do caminho entre base e alvo; laranja abaixo disso. Para "maior lacuna", a lógica inverte (menor é melhor).

---

## Grupo 6 — Protocolo de retomada

### RN-601 — Entrada no modo retomada
**Gatilho:** abertura do app, ou virada do dia.
**Condição:** `dias_desde_ultimo_registro ≥ 7`, onde o último registro é a última data com sessão, check ou tarefa concluída, e não há retomada em andamento.
**Ação:** cria `RetomadaProtocolo(inicio=hoje, fase=1, ativa=true)`. Enquanto ativa: a tela Hoje substitui as tarefas da marcha pelas tarefas da fase; metas de palavras ficam suspensas e exibidas em cinza com o rótulo "pausada"; o streak não é cobrado; nenhuma conquista de sequência é avaliada.
**Mensagem:** *"{n} dias fora. Não vamos fingir que nada aconteceu — modo retomada, fase 1 de 5."*

### RN-602 — As cinco fases
| Fase | Tarefas exigidas no dia | Dias cumpridos para avançar |
|---|---|---|
| 1 | 1 sessão `browser_mode` (qualquer duração) + check de revisão de flashcards | 1 |
| 2 | check de revisão + 1 sessão `pilar ∈ {gramatica, pronuncia}` marcada como revisão de conteúdo já visto | 2 |
| 3 | `palavras_novas ≥ 5` no dia + check de revisão | 2 |
| 4 | 1 sessão de conteúdo **novo** de gramática + 1 de pronúncia (em dias diferentes, `RN-305`) | 2 |
| 5 | `palavras_novas ≥ meta_dia` | 2 |

```
avanca_fase = dias_cumpridos(fase) ≥ dias_exigidos(fase)
conclui     = fase 5 cumprida  →  RetomadaProtocolo.ativa = false, concluida_em = hoje
```
Ao concluir: dispara a conquista `REC-01` e restaura marcha, metas e streak.
**Mensagem por avanço:** *"Fase {n} fechada. Fase {n+1}: {resumo}."*
**Mensagem final:** *"Cinco fases. Você voltou inteira. Isso vale mais que streak."*

### RN-603 — Retomada não regride
**Condição:** dias em branco durante a retomada.
**Ação:** nenhuma. A fase permanece; os dias cumpridos já contados não são perdidos.
**Mensagem (após 3 dias em branco dentro da retomada):** *"A retomada continua onde parou. Fase {n}, faltam {k} dias."*

`[DECISÃO: sem regressão de fase e sem reinício.]` Justificativa: o histórico mostra dez lacunas de 5+ dias; punir a recaída dentro do próprio protocolo de recaída é o desenho mais provável de fazer o app ser abandonado.

### RN-604 — Saída manual
Botão "Sair do modo retomada" em Configurações e na própria tela Hoje. Encerra com `concluida_em = null` e `abandonada = true`. Não gera conquista. Não gera mensagem de culpa: *"Modo retomada encerrado. Metas normais de volta."*

---

## Grupo 7 — Matemática dos indicadores do dashboard

Todas as funções recebem um período `P` e, opcionalmente, um idioma.

### RN-701 — Composição ativo × passivo × flashcards
```
min_flashcards(P) = soma({s ∈ S(P) : s.atividade = flashcards}, duracao_min)
min_ativo(P)      = soma({s ∈ S(P) : s.categoria = ativo e s.atividade ≠ flashcards}, duracao_min)
min_imersao(P)    = soma({s ∈ S(P) : s.categoria = imersao}, duracao_min)
min_total(P)      = min_flashcards + min_ativo + min_imersao
```
As três parcelas somam exatamente o total. Exibidas sempre juntas, nesta ordem: ativo, flashcards, imersão.

### RN-702 — % de estudo ativo
```
pct_ativo(P) = min_ativo(P) / min_total(P)          // 0 se min_total = 0
```
A meta de 35% é desenhada como linha de referência sobre a barra, sempre visível, mesmo quando o valor real está muito abaixo.
**Diagnóstico associado:** ver `RN-712`.

### RN-703 — Divisão por pilar contra a divisão-alvo
```
base_pilares(P) = soma({s ∈ S(P) : s.categoria = ativo}, duracao_min)   // inclui flashcards
pct_pilar(p, P) = soma({s ∈ S(P) : s.pilar = p}, duracao_min) / base_pilares(P)
desvio(p, P)    = pct_pilar(p, P) - alvo(p)
```
Alvo default: **vocabulário 25% · gramática 25% · pronúncia 20% · fala 30%**.
`[DECISÃO: fala = 30%.]` Justificativa: o enunciado fixa gramática e vocabulário em 25% cada, pronúncia como a menor e fala como a maior; 20% para pronúncia fecha os 100% com 30% em fala.
Editável em Configurações e na Planilha de Distribuição; a soma é validada em 100% ± 0 (o formulário normaliza).

### RN-704 — Maior lacuna
```
D = datas distintas com registro em P, ordenadas
lacunas = [ (D[k+1] - D[k]) - 1 para k em 0..|D|-2 ]
         + [ D[0] - P.inicio ]                       // borda inicial
         + [ min(hoje, P.fim) - D[último] ]          // borda final
maior_lacuna(P) = max(lacunas ∪ {0})
```
Quando `|D| = 0`, `maior_lacuna = min(hoje, P.fim) - P.inicio + 1`.
A visualização mostra também o intervalo da maior lacuna (data inicial e final) para o texto do diagnóstico.

### RN-705 — Sequências
```
streak_registro = maior k tal que os dias hoje, hoje-1, …, hoje-k+1 têm registro
                  (se hoje ainda não tem registro, conta a partir de ontem — o dia
                   corrente só quebra a sequência às 23:59)
streak_piso     = mesma definição usando piso_cumprido(d) (RN-302)
recorde_registro(ano) = maior sequência de dias consecutivos com registro no ano
faltam_recorde  = max(0, recorde_registro - streak_registro + 1)
```
`[DECISÃO: duas sequências, exibidas lado a lado.]` Justificativa: streak de registro é fácil (uma sessão de podcast conta) e streak do piso é o que o método realmente cobra; mostrar só o primeiro reproduz o problema de 76,8% de imersão.

### RN-706 — Minutos de fala por semana
```
fala_semana(w) = soma({s ∈ S(w)}, minutos_fala)      // toda sessão, qualquer pilar
media_fala_semanal(P) = Σ fala_semana(w) sobre semanas w ⊆ P / nº de semanas em P
```
Semanas parciais nas bordas do período contam proporcionalmente ao nº de dias dentro de `P` (`fala_semana × dias_dentro / 7`).

### RN-707 — Dias com flashcards por semana
```
dia_com_flashcards(d) = existe RevisaoFlashcards(data=d, revisou=true)
                        ou existe Sessão(data=d, atividade=flashcards)
dias_flash_semana(w)  = |{ d ∈ w : dia_com_flashcards(d) }|
media(P)              = Σ dias_flash_semana(w) / nº de semanas em P
```

### RN-708 — Dias com registro e concentração
```
dias_com_registro(P) = |{ d ∈ P : |S(d)| > 0 ou existe check em d }|
pct_dias(P)          = dias_com_registro / nº de dias em P
concentracao_top3(P) = soma das 3 maiores durações diárias / min_total(P)
concentracao_top10(P)= idem com 10 dias (usado no recorte anual)
```

### RN-709 — Distribuição pelos três tempos
```
pct_tempo(t, P) = soma({s ∈ S(P) : s.tempo = t}, duracao_min) / min_total(P)
```
Exibido para os três tempos, somando 100%.

### RN-710 — Distribuição por hora e por dia da semana
```
horas(P)[h]   = soma({s ∈ S(P) : hora_inicio(s) = h}, duracao_min), h ∈ 0..23
semana(P)[wd] = soma({s ∈ S(P) : dia_da_semana(s) = wd}, duracao_min), wd ∈ 1..7
pico_hora(P)  = argmax horas(P)
pico_dia(P)   = argmax semana(P) ; vale_dia(P) = argmin semana(P)
```
Sessões sem hora de início (importadas sem horário, ou registradas em lote) entram num balde `sem_hora`, exibido fora do gráfico como nota de rodapé.

### RN-711 — Marcha sobreposta ao gráfico de horas
Para cada intervalo `[data_inicio, data_fim]` do histórico de marchas que intersecta `P`, desenhar uma faixa de fundo no gráfico temporal, com opacidade crescente por marcha (1 = 8%, 2 = 14%, 3 = 20%) e rótulo no topo da faixa.

### RN-712 — Diagnóstico automático em texto
Avalia as condições abaixo na ordem, e exibe as **três primeiras** que dispararem. Se nenhuma disparar, exibe a mensagem de fechamento.

| # | Condição | Texto |
|---|---|---|
| 1 | `pct_imersao ≥ 0,60` | *"{pct_imersao}% do seu tempo foi consumo passivo. Estudo ativo ficou em {pct_ativo}% — a meta é 35%."* |
| 2 | `min_producao(P) / min_total(P) < 0,10` | *"Produção foi {pct}% do tempo, em {n} sessões. É o gargalo do método."* |
| 3 | `concentracao_top3 ≥ 0,40` | *"Seu período inteiro cabe em três dias: eles somam {pct}% das horas."* |
| 4 | `maior_lacuna ≥ 5` | *"Maior lacuna: {n} dias, de {d1} a {d2}."* |
| 5 | `media_fala_semanal < 30` | *"Você falou {n} min por semana, na média. A meta é 60."* |
| 6 | `media_dias_flash_semana < 3` | *"Flashcards em {n} dias por semana. A meta é 5."* |
| 7 | `max abs(desvio(p)) ≥ 0,15` | *"{Pilar} está em {real}% do estudo ativo contra {alvo}% de alvo."* |
| 8 | `pct_tempo(cadeira) ≥ 0,80` | *"Quase tudo aconteceu na cadeira. Mãos livres e ocupadas somaram {pct}% — é aí que mora o tempo que você acha que não tem."* |
| 9 | `dias_com_registro / dias(P) < 0,5` | *"Registro em {n} de {m} dias ({pct}%)."* |
| — | nenhuma acima | *"Período dentro do método: {pct_ativo}% ativo, {fala} min de fala por semana, maior lacuna de {n} dias."* |

Cada texto vem com um link para o recorte que o gerou (ex.: o item 4 abre o calendário do mês com a lacuna destacada).

### RN-713 — Comparação bloco a bloco (recorte anual)
Para cada bloco do plano que intersecta o ano:
```
pct_idioma_real(i, bloco) = soma(S(bloco, i), duracao_min) / soma(S(bloco), duracao_min)
desvio_bloco(i) = pct_idioma_real - pct_idioma_alvo(bloco, i)
```
Exibido como barras pareadas alvo × realizado, um par por idioma, um grupo por bloco, mais o delta de nível (`RN-503`) por idioma no fim do bloco.

---

## Grupo 8 — Tarefas automáticas

### RN-801 — Catálogo de tarefas geradas por regra
| Tipo | Gerada por | Prazo | Conclusão |
|---|---|---|---|
| `frases_apos_erro` | `RN-410` | hoje+1 | informar ≥ 2 frases |
| `ativar_palavras` | `RN-408` | hoje+2 | informar nº de palavras ativadas |
| `audio_grupo` | `RN-304`, toda segunda-feira | domingo da semana | sessão `audio_grupo` |
| `clube_conversacao` | `RN-303`, quando não há clube agendado | +14 dias | sessão `conversacao` |
| `autoavaliacao` | `RN-504` | último domingo do bloco | formulário de nível |
| `gravar_video` | marcha 3, primeira segunda do mês | fim do mês | sessão `gravacao_video` |
| `retomada_fase` | `RN-602` | dia a dia | critério da fase |

### RN-802 — Idempotência
Nenhuma regra cria duas tarefas abertas do mesmo `tipo` para o mesmo `idioma` e a mesma janela (dia para as diárias, semana ISO para as semanais, bloco para as de bloco). Antes de criar, procura por tarefa aberta equivalente e apenas atualiza `quantidade_exigida` e `atualizada_em`.

### RN-803 — Tarefas automáticas não são editáveis, são resolvíveis
Título, tipo e critério de uma tarefa automática são somente leitura. Ela pode ser concluída, adiada uma vez (prazo +1 dia ou +1 semana) ou dispensada com registro de `dispensada_em`. Tarefas dispensadas não voltam na mesma janela.

### RN-804 — Separação visual
A tela Tarefas tem duas seções fixas: **Geradas pelas regras** e **Minhas tarefas**. Uma tarefa automática nunca migra para a segunda seção.

---

## Grupo 9 — Distribuição e blocos do plano

### RN-901 — Blocos do plano
`[DECISÃO: os trios de percentuais estão na ordem (francês, espanhol, inglês).]` Justificativa: é a única leitura em que o idioma-foco de cada bloco recebe o maior percentual nos quatro blocos simultaneamente.

| Bloco | Período | Foco | FR | ES | EN |
|---|---|---|---|---|---|
| B1 | 07/09/2026 – 31/12/2026 | francês | 60% | 20% | 20% |
| B2 | 01/01/2027 – 30/04/2027 | espanhol | 25% | 60% | 15% |
| B3 | 01/05/2027 – 31/08/2027 | inglês | 25% | 15% | 60% |
| B4 | 01/09/2027 – 31/12/2027 | francês | 60% | 25% | 15% |

Blocos são editáveis (datas, foco e percentuais). O bloco vigente é o que contém `hoje`.

### RN-902 — Alvo × realizado na Planilha de Distribuição
```
realizado_idioma(i, P) = soma(S(P, i), duracao_min) / min_total(P)
realizado_pilar(p, P)  = RN-703
delta = realizado - alvo, exibido em pontos percentuais com sinal
```
Cores: verde se `|delta| ≤ 5 pp`; amarelo se `≤ 15 pp`; laranja acima disso.

### RN-903 — Foco do mês
Campo próprio da Planilha de Distribuição (`foco_mes`: idioma + pilar + uma frase livre). É o que a tela Metas exibe no cartão "Foco em Distribuição". Default ao virar o mês: idioma-foco do bloco vigente e o pilar com maior desvio negativo no mês anterior (`RN-703`).

### RN-904 — Normalização de percentuais
Ao editar qualquer percentual (pilar ou idioma), o formulário mostra a soma corrente e um botão "Normalizar para 100%", que distribui a diferença proporcionalmente entre os outros campos. Salvar com soma ≠ 100% é permitido apenas se a diferença for ≤ 1 pp (arredondamento).

---

## Grupo 10 — Importação do Toggl

### RN-1001 — Formato de CSV esperado
Relatório detalhado do Toggl Track, UTF-8, separador vírgula, primeira linha de cabeçalho. Colunas usadas:

| Coluna | Uso |
|---|---|
| `Project` | entrada principal do mapeamento (idioma) |
| `Description` | entrada do mapeamento (atividade) |
| `Tags` | entrada do mapeamento (atividade, tempo, pilar); múltiplas separadas por vírgula |
| `Start date` (`YYYY-MM-DD`) | `Sessao.data` |
| `Start time` (`HH:MM:SS`) | `Sessao.hora_inicio` |
| `Duration` (`HH:MM:SS`) | `Sessao.duracao_min` (arredondado, piso 1) |
| `Client`, `Task` | entradas opcionais do mapeamento |

Colunas ignoradas: `User`, `Email`, `Billable`, `End date`, `End time`, `Amount`. Colunas ausentes obrigatórias (`Start date`, `Duration`) invalidam o arquivo com mensagem apontando a coluna faltante.

### RN-1002 — Motor de mapeamento
Uma `RegraDeMapeamentoToggl` tem: `ordem`, `campo` (project | description | tags | client | task), `operador` (contem | igual | regex), `valor`, e as saídas `idioma`, `atividade`, `pilar`, `tempo`. Saídas vazias não sobrescrevem.
```
para cada linha:
   resultado = {}
   para cada regra em ordem crescente:
       se casa(linha[regra.campo], regra.operador, regra.valor):
           resultado = merge(resultado, saídas não vazias da regra)
   se resultado.atividade vazia → atividade = outro, marcar linha como "precisa revisão"
   se resultado.idioma vazio    → marcar linha como "precisa revisão"
   pilar/tempo vazios → preencher pelo default de RN-101
```
Regras posteriores sobrescrevem anteriores (última vence), o que permite regras gerais seguidas de exceções.

### RN-1003 — Mapeamento default
Instalado no primeiro uso; totalmente editável.

| # | Campo | Op | Valor | → idioma | → atividade |
|---|---|---|---|---|---|
| 1 | project | contém | `ingl` / `english` | ingles | — |
| 2 | project | contém | `espanh` / `spanish` | espanhol | — |
| 3 | project | contém | `franc` / `french` | frances | — |
| 4 | tags | contém | `en` \| `es` \| `fr` | idioma correspondente | — |
| 5 | description | contém | `flashcard`, `anki`, `deluxe` | — | flashcards |
| 6 | description | contém | `gramát`, `gramat`, `grammar` | — | gramatica |
| 7 | description | contém | `pronún`, `pronun`, `ipa`, `shadow` | — | pronuncia |
| 8 | description | contém | `fala`, `speaking`, `voz alta`, `monólogo` | — | fala_sozinha |
| 9 | description | contém | `conversa`, `clube`, `italki`, `tandem` | — | conversacao |
| 10 | description | contém | `aula`, `professor`, `class` | — | aula |
| 11 | description | contém | `escrit`, `writing`, `redação`, `diário` | — | escrita |
| 12 | description | contém | `netflix`, `série`, `serie`, `filme`, `disney` | — | serie_filme |
| 13 | description | contém | `podcast` | — | podcast |
| 14 | description | contém | `audiobook`, `audiolivro` | — | audiobook |
| 15 | description | contém | `youtube`, `yt ` | — | youtube |
| 16 | description | contém | `leitura`, `livro`, `reading` | — | leitura |
| 17 | tags | contém | `cadeira`, `foco`, `deep` | — | (tempo = cadeira) |
| 18 | tags | contém | `fila`, `livre`, `commute leve` | — | (tempo = maos_livres) |
| 19 | tags | contém | `louça`, `banho`, `trânsito`, `caminhada` | — | (tempo = maos_ocupadas) |

### RN-1004 — Deduplicação
```
chave_toggl(linha) = sha1(start_date + start_time + duration + description)
duplicata_exata    = existe Sessao com origem=toggl e chave_toggl igual
conflito_provavel  = existe Sessao com origem=manual, mesmo idioma, mesma data,
                     mesma atividade e |duracao_manual - duracao_toggl| ≤ 5 min
```
- **Duplicata exata:** ignorada silenciosamente, contabilizada em "já importadas".
- **Conflito provável:** entra na lista de conflitos com três opções — *manter a manual* (default), *substituir pela do Toggl*, *importar as duas*.
- Nenhuma linha é importada sem passar pela tela de pré-visualização.

### RN-1005 — Pré-visualização obrigatória e recálculo
A importação acontece em três passos: **arquivo → pré-visualização → confirmar**. Na pré-visualização: contagem por status (novas, duplicadas, conflitos, precisam revisão), tabela editável linha a linha e resumo do impacto (horas por idioma, por categoria).
Ao confirmar: grava as sessões com `origem = toggl` e `lote_importacao = id`, e roda o recálculo de todos os indicadores derivados, camadas e conquistas do intervalo afetado.
**Mensagem:** *"{n} sessões importadas, {m} ignoradas, {k} conflitos resolvidos. Indicadores de {d1} a {d2} recalculados."*

### RN-1006 — Desfazer importação
Todo lote pode ser desfeito integralmente até ser sobreposto por outro lote no mesmo intervalo. Desfazer remove as sessões com aquele `lote_importacao` e roda o recálculo.

---

## Grupo 11 — Alertas configuráveis

### RN-1101 — Gatilhos editáveis
Em Configurações, cada limiar abaixo é editável; os valores são os defaults.

| Gatilho | Default | Efeito |
|---|---|---|
| Hora em que o dia "aperta" | 20:00 | vira amarelo/vermelho em `RN-301`, `RN-302` |
| Dias sem registro para modo retomada | 7 | `RN-601` |
| Meta de % ativo | 35% | linha de referência e `RN-712` |
| Meta de minutos de fala/semana | 60 | `RN-706` |
| Meta de dias de flashcards/semana | 5 | `RN-707` |
| Lacuna que gera alerta | 3 dias | badge na sidebar |
| Limiar de desvio de pilar | 15 pp | `RN-712` item 7 |
| Limiar de concentração | 40% | `RN-712` item 3 |
| Tamanho de lote para checagem obrigatória | 10 palavras | sugere rodar `RN-406` |

### RN-1102 — Badge da sidebar
```
badge(tela) = nº de itens acionáveis pendentes
Hoje     = nº de tarefas do dia não cumpridas + nº de regras em vermelho
Tarefas  = nº de tarefas abertas vencidas ou de hoje
Revisão  = nº de itens em dívida (RN-1103)
```
Zero pendências: sem badge (não exibir "0").

### RN-1103 — Fila da tela Revisão
```
itens = pontos_gramaticais(errei=true, sem tarefa concluída)
      + palavras pendentes de ativação por idioma (RN-408)
      + tarefas frases_apos_erro abertas
      + gravações de vídeo pendentes (marcha 3)
      + áudio do grupo pendente na semana corrente
      + autoavaliações de bloco pendentes
urgencia = 1000·(dias_de_atraso) + peso_tipo
peso_tipo: frases_apos_erro=100, audio_grupo=90, ativar_palavras=80,
           autoavaliacao=70, gravar_video=60, ponto_gramatical=50
```
Ordenação decrescente por `urgencia`. **A fila de cartões devidos não aparece aqui** (`RN-003`) — a tela exibe uma linha permanente em cinza: *"Cartões devidos ficam no Flashcards Deluxe."*

---

## Grupo 12 — Verificação de cobertura

Passada final exigida pelo briefing. Cada item do método precisa aparecer em pelo menos uma regra computável.

### Os quatro pilares
| Pilar | Regras |
|---|---|
| Vocabulário | RN-101, RN-402, RN-501, RN-505, RN-703 |
| Gramática | RN-101, RN-305, RN-410, RN-703 |
| Pronúncia | RN-101, RN-204, RN-305, RN-703 |
| Fala | RN-101, RN-105, RN-302, RN-506, RN-706 |
| Imersão (não-pilar) | RN-102, RN-103, RN-701, RN-712 item 1 |

### As seis regras invioláveis
| Regra | ID |
|---|---|
| 1 — nunca dois dias em branco | RN-301 |
| 2 — piso independe da marcha | RN-302, RN-206 |
| 3 — clube é compromisso marcado | RN-303 |
| 4 — um áudio por semana | RN-304, RN-801 |
| 5 — gramática e pronúncia nunca juntas; sexta é pronúncia | RN-305, RN-204 |
| 6 — Instagram só na marcha 3 | RN-306 |

### As três marchas
| Marcha | ID |
|---|---|
| 1 Sobrevivência | RN-202, RN-206 |
| 2 Cruzeiro | RN-202, RN-204, RN-303 |
| 3 Turbo | RN-202, RN-306, RN-801 (`gravar_video`) |
| Troca e histórico | RN-201, RN-205, RN-711 |

### Os três tempos
| Tempo | ID |
|---|---|
| Cadeira | RN-101, RN-104, RN-709, RN-712 item 8 |
| Mãos livres | RN-101, RN-104, RN-709 |
| Mãos ocupadas | RN-101, RN-104, RN-202 (marcha 1), RN-709 |

### As cinco camadas
Todas em `RN-501`, com progresso em `RN-505`, exibição em `RN-502` e conquistas `CAM-01` a `CAM-15` (documento 06).

### Anti-requisitos verificados
- ✅ Nenhuma regra dispara produção a partir de imersão. Buscar por "imersão" nas regras: `RN-102`, `RN-103`, `RN-202` (marcha 1, tarefa de imersão que não pede nada em troca), `RN-602` (fase 1, browser mode), `RN-701`, `RN-709`, `RN-712`. Nenhuma delas cria tarefa, alerta ou cobrança. `RN-002` é explícita.
- ✅ Nenhuma tela gerencia cartões. `RN-003`, `RN-401`, `RN-409` e `RN-1103` fecham o assunto pelos quatro lados: sem entidade de cartão, sem persistência de lista, sem fila de devidos, sem CRUD.
- ✅ Cobrança de produção é semanal e agregada: `RN-303`, `RN-304`, `RN-506`, `RN-706`.
