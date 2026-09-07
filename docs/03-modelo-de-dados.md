# 03 — Modelo de dados

Banco local (IndexedDB via Dexie). Usuária única: **não existe** tabela de usuário, nem `user_id` em lugar nenhum.

Convenções:

- `id`: string UUID v4, exceto onde indicado.
- `data`: string `YYYY-MM-DD` (data local, nunca timestamp). Facilita índice, agrupamento e comparação.
- `criado_em` / `atualizado_em`: ISO 8601 com fuso.
- Enums são strings, nunca inteiros — legibilidade no export JSON vale mais que bytes.
- Nenhuma exclusão em cascata automática: apagar um Idioma é bloqueado se houver Sessão vinculada.

---

## 1. Diagrama textual

```
                         ┌───────────────┐
                         │    Idioma     │ (3 registros: ingles, espanhol, frances)
                         └───────┬───────┘
        ┌───────────────┬────────┼──────────┬──────────────┬──────────────┐
        │               │        │          │              │              │
        ▼               ▼        ▼          ▼              ▼              ▼
   ┌─────────┐  ┌──────────────┐ ┌────────────────┐ ┌──────────┐  ┌──────────────┐
   │ Sessao  │  │RegistroVocab │ │RevisaoFlashcard│ │ Material │  │Autoavaliacao │
   └────┬────┘  └──────────────┘ └────────────────┘ └──────────┘  └──────┬───────┘
        │                                                                 │
        │ 0..1                                                            │ N..1
        ▼                                                                 ▼
   ┌──────────┐        ┌──────────────┐                            ┌────────────┐
   │  Tarefa  │───────▶│     Meta     │                            │ BlocoPlano │
   └────┬─────┘  0..1  └──────┬───────┘                            └─────┬──────┘
        │                     │                                          │
        │ 0..1                │ 0..1                                     │ 1..1
        ▼                     ▼                                          ▼
┌────────────────┐     ┌──────────────┐                       ┌───────────────────┐
│ PontoGramatical│     │  Conquista   │                       │ DistribuicaoAlvo  │
└────────────────┘     │  (catálogo)  │                       └───────────────────┘
                       └──────┬───────┘
                              │ 1..N
                              ▼
                       ┌──────────────┐
                       │ConquistaEstad│
                       └──────────────┘

Transversais, sem FK de idioma:
  MarchaDef ──1..N──▶ MarchaHistorico
  RetomadaProtocolo ──1..N──▶ RetomadaFaseLog
  RegraDeMapeamentoToggl        LoteImportacao ──1..N──▶ Sessao (lote_importacao)
  Recurso (N..N com Idioma e Pilar via arrays de tags)
  Config (singleton)            LogAberturaApp / TelemetriaRegistro
```

---

## 2. Enums

```ts
type IdiomaId   = 'ingles' | 'espanhol' | 'frances';           // extensível
type Pilar      = 'vocabulario' | 'gramatica' | 'pronuncia' | 'fala';
type Categoria  = 'ativo' | 'imersao';
type TempoDoDia = 'cadeira' | 'maos_livres' | 'maos_ocupadas';

type Atividade =
  | 'flashcards' | 'gramatica' | 'pronuncia' | 'fala_sozinha' | 'conversacao'
  | 'aula' | 'audio_grupo' | 'gravacao_video' | 'escrita' | 'conteudo_instagram'
  | 'leitura' | 'serie_filme' | 'podcast' | 'audiobook' | 'youtube'
  | 'browser_mode' | 'outro';

type Nivel =
  | 'A0' | 'A1.1' | 'A1.2' | 'A2.1' | 'A2.2'
  | 'B1.1' | 'B1.2' | 'B2.1' | 'B2.2' | 'C1.1' | 'C1.2' | 'C2';

type TipoTarefa =
  | 'frases_apos_erro' | 'ativar_palavras' | 'audio_grupo' | 'clube_conversacao'
  | 'autoavaliacao' | 'gravar_video' | 'aula_paga' | 'retomada_fase' | 'manual';

type EstadoTarefa = 'aberta' | 'concluida' | 'adiada' | 'dispensada';
type TipoMeta     = 'palavras' | 'nivel' | 'conversacao' | 'painel_mensal';
type OrigemSessao = 'manual' | 'toggl' | 'automatica';
type CategoriaConquista = 'consistencia' | 'camada' | 'producao' | 'metodo' | 'recuperacao';
```

---

## 3. Entidades

### 3.1 Idioma

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | `IdiomaId` | ✔ | chave primária, string estável |
| `nome` | string | ✔ | "Inglês" |
| `bandeira` | string | ✔ | emoji, usado nos chips |
| `cor` | string | ✔ | hex; ver documento 07 |
| `ativo` | boolean | ✔ | idioma desativado some das telas mas mantém histórico |
| `nivel_atual` | `Nivel` | ✔ | atualizado por Autoavaliacao |
| `nivel_inicial` | `Nivel` | ✔ | congelado no cadastro; base do progresso `RN-503` |
| `nivel_meta` | `Nivel` | ✔ | |
| `data_meta_nivel` | date | — | data-alvo da meta de nível |
| `palavras_base` | int ≥ 0 | ✔ | vocabulário já existente antes do app (ex.: inglês 2729) |
| `meta_palavras_dia` | int ≥ 0 | ✔ | default 10 |
| `ordem` | int | ✔ | ordem de exibição |

Registros iniciais:

| id | nivel_inicial | nivel_meta | palavras_base | meta_palavras_dia |
|---|---|---|---|---|
| ingles | B1.2 | B2.2 | 2729 | 10 |
| espanhol | B1.2 | C1.1 | 2400 | 10 |
| frances | A0 | B2.1 | 0 | 15 |

`[DECISÃO: palavras_base do espanhol = 2400 e do francês = 0.]` Justificativa: só o inglês tem número conhecido (2729, do protótipo); B1.2 em espanhol implica faixa semelhante à do inglês e A0 implica zero. Ambos são editáveis em Configurações na primeira abertura.

**Índices:** `id` (pk), `ativo`, `ordem`.

---

### 3.2 Sessao

O registro central. Uma linha por bloco de estudo.

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | uuid | ✔ | |
| `idioma_id` | `IdiomaId` | ✔ | |
| `data` | date | ✔ | data local |
| `hora_inicio` | `HH:MM` \| null | — | null quando registrada em lote; alimenta `RN-710` |
| `duracao_min` | int 1..480 | ✔ | |
| `categoria` | `Categoria` | ✔ | derivada de `RN-103`, gravada explicitamente |
| `pilar` | `Pilar` \| null | ✔/— | obrigatório se `categoria = ativo`; **null** se imersão |
| `atividade` | `Atividade` | ✔ | |
| `tempo` | `TempoDoDia` | ✔ | |
| `producao` | boolean | ✔ | derivada de `RN-101`, gravada |
| `palavras_novas` | int ≥ 0 | ✔ | default 0 |
| `minutos_fala` | int ≥ 0 | ✔ | ≤ `duracao_min`; `RN-105` |
| `pontos_gramaticais` | int ≥ 0 | ✔ | quantos pontos foram estudados |
| `frases_produzidas` | int ≥ 0 | ✔ | |
| `nota` | string ≤ 500 | — | texto livre |
| `material_id` | uuid \| null | — | vincula ao material principal |
| `violou_regra_5` | boolean | ✔ | `RN-305`; default false |
| `origem` | `OrigemSessao` | ✔ | |
| `chave_toggl` | string \| null | — | sha1, `RN-1004` |
| `lote_importacao` | uuid \| null | — | |
| `criado_em` / `atualizado_em` | datetime | ✔ | |

**Invariantes**
1. `categoria = 'imersao'` ⇒ `pilar = null` e `producao = false`.
2. `categoria = 'ativo'` ⇒ `pilar ≠ null`.
3. `minutos_fala ≤ duracao_min`.
4. `atividade ∈ ATIVIDADES_IMERSAO` ⇒ `categoria = 'imersao'` (exceto `leitura`).
5. `atividade = 'conteudo_instagram'` só pode ser criada com marcha ativa = 3.

**Índices:** `id` (pk), `data`, `[idioma_id+data]`, `[data+categoria]`, `[data+pilar]`, `atividade`, `origem`, `lote_importacao`, `chave_toggl` (único quando não nulo).

---

### 3.3 RegistroVocabulario

Contagem do dia. **Não é cartão** (`RN-003`).

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | uuid | ✔ | |
| `idioma_id` | `IdiomaId` | ✔ | |
| `data` | date | ✔ | |
| `palavras_novas` | int ≥ 0 | ✔ | criadas no dia |
| `palavras_ativadas` | int ≥ 0 | ✔ | já usadas em frase falada; `RN-408` |
| `minutos_criacao` | int ≥ 0 \| null | — | cronômetro do lote |
| `min_por_palavra` | float \| null | — | derivado, gravado para histórico (`RN-405`) |
| `faixa_velocidade` | string \| null | — | `acima_de_a` \| `a` \| `entre` \| `b` |
| `checagem_rodada` | boolean | ✔ | rodou `RN-406`? |
| `qtd_avisos_interferencia` | int ≥ 0 | ✔ | só o número; a lista não é salva (`RN-409`) |
| `criado_em` / `atualizado_em` | datetime | ✔ | |

**Único:** `[idioma_id+data]`.
**Índices:** `data`, `[idioma_id+data]` (único), `idioma_id`.

---

### 3.4 RevisaoFlashcards

Check diário + ponto esporádico de acerto.

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | uuid | ✔ | |
| `idioma_id` | `IdiomaId` | ✔ | |
| `data` | date | ✔ | |
| `revisou` | boolean | ✔ | o indicador que importa é frequência |
| `pct_acerto_deck` | int 0..100 \| null | — | informado quando ela quiser (`RN-404`) |
| `pct_acerto_gramatica` | int 0..100 \| null | — | deck de gramática, também externo |
| `criado_em` | datetime | ✔ | |

**Único:** `[idioma_id+data]`.
**Índices:** `data`, `[idioma_id+data]` (único), `revisou`.

Não existe campo de quantidade de cartões revisados, por decisão de método.

---

### 3.5 PontoGramatical

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | uuid | ✔ | |
| `idioma_id` | `IdiomaId` | ✔ | |
| `titulo` | string ≤ 120 | ✔ | ex.: "subjuntivo presente" |
| `material_id` | uuid \| null | — | de onde veio |
| `estudado_em` | date | ✔ | primeira vez |
| `estado` | `'ok' \| 'errei' \| 'em_correcao'` | ✔ | |
| `marcado_errei_em` | date \| null | — | dispara `RN-410` |
| `frases_exigidas` | int | ✔ | default 2 |
| `frases_feitas` | int ≥ 0 | ✔ | |
| `ultima_revisao_em` | date \| null | — | |
| `criado_em` / `atualizado_em` | datetime | ✔ | |

**Índices:** `idioma_id`, `estado`, `[idioma_id+estado]`, `marcado_errei_em`.

---

### 3.6 Tarefa

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | uuid | ✔ | |
| `tipo` | `TipoTarefa` | ✔ | `manual` = criada por ela |
| `automatica` | boolean | ✔ | `tipo ≠ manual` |
| `titulo` | string ≤ 140 | ✔ | somente leitura se automática (`RN-803`) |
| `idioma_id` | `IdiomaId` \| null | — | null = global |
| `data_prevista` | date | ✔ | |
| `janela` | `'dia' \| 'semana' \| 'mes' \| 'bloco'` | ✔ | usado na idempotência (`RN-802`) |
| `chave_idempotencia` | string | ✔ | `tipo:idioma:janela:referencia` — único entre tarefas abertas |
| `quantidade_exigida` | int | ✔ | default 1 (ex.: 2 frases, 7 palavras) |
| `quantidade_feita` | int ≥ 0 | ✔ | |
| `estado` | `EstadoTarefa` | ✔ | |
| `recorrencia` | `'nenhuma' \| 'diaria' \| 'semanal' \| 'mensal'` | ✔ | só para manuais |
| `meta_id` | uuid \| null | — | vínculo com meta |
| `ponto_gramatical_id` | uuid \| null | — | para `frases_apos_erro` |
| `sessao_id` | uuid \| null | — | sessão que a concluiu |
| `adiada_vezes` | int | ✔ | máximo 1 para automáticas |
| `concluida_em` / `dispensada_em` | date \| null | — | |
| `criado_em` / `atualizado_em` | datetime | ✔ | |

**Índices:** `estado`, `data_prevista`, `[estado+data_prevista]`, `tipo`, `idioma_id`, `chave_idempotencia` (único entre `estado = 'aberta'`), `meta_id`.

---

### 3.7 Meta

| Campo | Tipo | Obrig. | Notas |
|---|---|---|---|
| `id` | uuid | ✔ | |
| `tipo` | `TipoMeta` | ✔ | |
| `idioma_id` | `IdiomaId` \| null | — | null = global (painel mensal) |
| `titulo` | string | ✔ | |
| `indicador` | string | ✔ | chave da função de cálculo: `palavras_dia`, `pct_ativo`, `min_fala_semana`, `dias_flash_semana`, `maior_lacuna`, `dias_registro`, `nivel`, `conversas_semana`, `audio_semana` |
| `valor_base` | number | ✔ | linha de base (para a barra de progresso do painel mensal) |
| `valor_alvo` | number | ✔ | |
| `direcao` | `'maior_melhor' \| 'menor_melhor'` | ✔ | `maior_lacuna` usa `menor_melhor` |
| `periodicidade` | `'dia' \| 'semana' \| 'mes' \| 'bloco' \| 'prazo_fixo'` | ✔ | |
| `data_alvo` | date \| null | — | para metas de nível |
| `cor` | `'longo_prazo' \| 'mensal' \| 'semanal'` | ✔ | mapeia laranja/rosa/azul (doc 07) |
| `ativa` | boolean | ✔ | |
| `criado_em` / `atualizado_em` | datetime | ✔ | |

Metas semeadas na instalação: 3 de palavras (uma por idioma), 3 de nível, 3 de conversação (conversas/semana, minutos de fala/semana, áudio/semana) e as 5 do painel mensal — 14 no total.

**Índices:** `tipo`, `idioma_id`, `ativa`, `indicador`.

---

### 3.8 BlocoPlano e DistribuicaoAlvo

**BlocoPlano**

| Campo | Tipo | Obrig. |
|---|---|---|
| `id` | uuid | ✔ |
| `nome` | string | ✔ |
| `data_inicio` / `data_fim` | date | ✔ |
| `idioma_foco` | `IdiomaId` | ✔ |
| `foco_mes_idioma` | `IdiomaId` \| null | — |
| `foco_mes_pilar` | `Pilar` \| null | — |
| `foco_mes_nota` | string ≤ 200 | — |

**DistribuicaoAlvo** — uma linha por (bloco, dimensão, chave).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `bloco_id` | uuid \| null | null = alvo global de pilares, válido fora de bloco |
| `dimensao` | `'idioma' \| 'pilar'` | |
| `chave` | `IdiomaId \| Pilar` | |
| `percentual` | int 0..100 | soma 100 por (bloco, dimensão) — `RN-904` |

Registros iniciais de pilar (global): vocabulario 25, gramatica 25, pronuncia 20, fala 30.
Registros iniciais de idioma: os quatro blocos de `RN-901`.

**Índices:** `[bloco_id+dimensao]`, `data_inicio`, `data_fim`.

---

### 3.9 MarchaDef e MarchaHistorico

**MarchaDef** (3 registros, editáveis)

| Campo | Tipo | Notas |
|---|---|---|
| `numero` | 1 \| 2 \| 3 | pk |
| `nome` | string | Sobrevivência / Cruzeiro / Turbo |
| `descricao` | string | "~15 min/dia" |
| `tarefas` | `TarefaDeMarcha[]` | ver abaixo |

```ts
type TarefaDeMarcha = {
  chave: string;            // 'flashcards', 'fala_1min', 'imersao_maos_ocupadas', ...
  titulo: string;
  dias_semana: number[];    // 1..7 ; [] = semanal
  escopo: 'dia' | 'semana';
  criterio: {               // avaliado contra os dados do dia/semana
    tipo: 'check_flashcards' | 'minutos_fala' | 'sessao_atividade'
        | 'minutos_categoria_tempo' | 'minutos_pilar' | 'item_revisao';
    parametros: Record<string, string | number>;
  };
  opcional: boolean;        // conteúdo do Instagram = true
  requer_marcha_minima: 1 | 2 | 3;
};
```

**MarchaHistorico**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `numero` | 1\|2\|3 | |
| `data_inicio` | date | |
| `data_fim` | date \| null | null = vigente |
| `motivo` | string ≤ 200 \| null | opcional |

**Invariante:** existe no máximo um registro com `data_fim = null`; os intervalos não se sobrepõem e não deixam buracos desde a primeira ativação.
**Índices:** `data_inicio`, `data_fim`.

---

### 3.10 Conquista (catálogo) e ConquistaEstado

**Conquista** — dado semente, versionado com o app.

| Campo | Tipo | Notas |
|---|---|---|
| `codigo` | string | pk, ex.: `CON-03`, `PRO-07` |
| `nome` | string | |
| `categoria` | `CategoriaConquista` | define a cor do card |
| `criterio_texto` | string | mostrado inclusive quando bloqueada |
| `criterio_chave` | string | nome da função avaliadora |
| `parametros` | JSON | `{ dias: 30 }` |
| `escopo` | `'global' \| 'por_idioma'` | |
| `repetivel` | boolean | |
| `ordem` | int | |

**ConquistaEstado** — uma linha por (conquista, idioma\|global).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `conquista_codigo` | string | |
| `idioma_id` | `IdiomaId` \| null | null quando escopo global |
| `estado` | `'bloqueada' \| 'conquistada'` | |
| `progresso_atual` / `progresso_alvo` | number | alimenta a barrinha do card bloqueado |
| `conquistada_em` | date \| null | |
| `vezes` | int | ≥ 1 para repetíveis |
| `ultima_avaliacao_em` | datetime | |

**Índices:** `[conquista_codigo+idioma_id]` (único), `estado`, `conquistada_em`.

---

### 3.11 Material

Um material **principal** por idioma; os demais são secundários.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `idioma_id` | `IdiomaId` | |
| `tipo` | `'livro' \| 'curso' \| 'playlist' \| 'lista_palavras' \| 'deck' \| 'outro'` | |
| `titulo` | string | |
| `principal` | boolean | **no máximo um `true` por idioma** |
| `unidade` | `'licao' \| 'capitulo' \| 'aula' \| 'pagina' \| 'video'` | rótulo da unidade |
| `posicao_atual` | int ≥ 0 | lição/capítulo atual |
| `total` | int > 0 \| null | null = sem total conhecido, esconde o % |
| `pct_concluido` | float | derivado: `posicao_atual / total`; gravado para histórico |
| `ultima_sessao_em` | date \| null | atualizado por Sessao com `material_id` |
| `url` | string \| null | |
| `nota` | string ≤ 500 | |
| `ativo` | boolean | |

**Invariante:** `count(Material where idioma_id = X and principal = true) ≤ 1`. Marcar outro como principal desmarca o anterior na mesma transação.
**Índices:** `idioma_id`, `[idioma_id+principal]`, `ativo`.

---

### 3.12 Recurso

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `titulo` | string | |
| `url` | string | |
| `tipo` | `'dicionario' \| 'colocacoes' \| 'lista_frequencia' \| 'canal' \| 'podcast' \| 'app' \| 'ipa' \| 'comunidade' \| 'clube' \| 'outro'` | |
| `idiomas` | `IdiomaId[]` | vazio = serve a todos |
| `pilares` | `Pilar[]` | vazio = geral |
| `favorito` | boolean | |
| `nota` | string ≤ 300 | |
| `ultimo_acesso_em` | date \| null | atualizado ao clicar |

**Índices:** `tipo`, `favorito`, `*idiomas` (multiEntry), `*pilares` (multiEntry).
Busca textual: varredura em memória sobre `titulo` + `nota` + `url` (dezenas de registros, não precisa de índice invertido).

---

### 3.13 Autoavaliacao

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `idioma_id` | `IdiomaId` | |
| `bloco_id` | uuid | `RN-504` |
| `data` | date | |
| `nivel_declarado` | `Nivel` | |
| `nivel_anterior` | `Nivel` | copiado no momento do registro |
| `observacao` | string ≤ 1000 | |
| `pontos_fortes` / `pontos_fracos` | string ≤ 500 | |

**Único:** `[idioma_id+bloco_id]`.
Ao salvar, atualiza `Idioma.nivel_atual`.

---

### 3.14 RegraDeMapeamentoToggl

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `ordem` | int | menor roda primeiro; a última que casa vence (`RN-1002`) |
| `campo` | `'project' \| 'description' \| 'tags' \| 'client' \| 'task'` | |
| `operador` | `'contem' \| 'igual' \| 'regex'` | `contem` é case- e acento-insensível |
| `valor` | string | |
| `saida_idioma` | `IdiomaId` \| null | |
| `saida_atividade` | `Atividade` \| null | |
| `saida_pilar` | `Pilar` \| null | |
| `saida_tempo` | `TempoDoDia` \| null | |
| `ativa` | boolean | |

**Índices:** `ordem`, `ativa`.

### 3.15 LoteImportacao

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `arquivo_nome` | string | |
| `importado_em` | datetime | |
| `intervalo_inicio` / `intervalo_fim` | date | menor e maior data do lote |
| `linhas_total` / `importadas` / `ignoradas` / `conflitos` / `revisadas_manualmente` | int | |
| `desfeito_em` | datetime \| null | `RN-1006` |

---

### 3.16 RetomadaProtocolo e RetomadaFaseLog

**RetomadaProtocolo**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `inicio` | date | |
| `dias_de_lacuna` | int | o que a disparou |
| `fase` | 1..5 | |
| `ativa` | boolean | |
| `concluida_em` | date \| null | |
| `abandonada` | boolean | `RN-604` |

**RetomadaFaseLog**

| Campo | Tipo |
|---|---|
| `id` | uuid |
| `protocolo_id` | uuid |
| `fase` | 1..5 |
| `data` | date |
| `cumprida` | boolean |

**Índices:** `ativa`, `[protocolo_id+fase]`.

---

### 3.17 Config (singleton, `id = 'config'`)

| Campo | Tipo | Default |
|---|---|---|
| `tema` | `'claro' \| 'escuro' \| 'sistema'` | `sistema` |
| `hora_aperto` | `HH:MM` | `20:00` |
| `dias_para_retomada` | int | 7 |
| `meta_pct_ativo` | float | 0.35 |
| `meta_min_fala_semana` | int | 60 |
| `meta_dias_flash_semana` | int | 5 |
| `lacuna_alerta` | int | 3 |
| `limiar_desvio_pilar` | float | 0.15 |
| `limiar_concentracao` | float | 0.40 |
| `lote_minimo_checagem` | int | 10 |
| `primeiro_dia_semana` | int | 1 (segunda) |
| `backup_automatico` | boolean | true |
| `backup_ultimo_em` | datetime \| null | |
| `versao_schema` | int | 1 |

### 3.18 Telemetria local (`LogAberturaApp`, `TelemetriaRegistro`)

| Entidade | Campos |
|---|---|
| `LogAberturaApp` | `data` (pk), `aberturas` int |
| `TelemetriaRegistro` | `id`, `datetime`, `duracao_ms` (abrir → salvar), `via` (`formulario` \| `cronometro` \| `atalho` \| `botao_regra`) |

Nunca sai do dispositivo (`RN` do doc 01, D4). Entra no backup.

---

## 4. Índices consolidados (Dexie)

```
idiomas:            id, ativo, ordem
sessoes:            id, data, [idioma_id+data], [data+categoria], [data+pilar],
                    atividade, origem, lote_importacao, &chave_toggl
registro_vocab:     id, &[idioma_id+data], data, idioma_id
revisao_flashcards: id, &[idioma_id+data], data, revisou
pontos_gramaticais: id, idioma_id, estado, [idioma_id+estado], marcado_errei_em
tarefas:            id, estado, data_prevista, [estado+data_prevista], tipo,
                    idioma_id, chave_idempotencia, meta_id
metas:              id, tipo, idioma_id, ativa, indicador
blocos_plano:       id, data_inicio, data_fim
distribuicao_alvo:  id, [bloco_id+dimensao], dimensao
marchas_def:        numero
marcha_historico:   id, data_inicio, data_fim
conquistas:         codigo, categoria, ordem
conquista_estado:   id, &[conquista_codigo+idioma_id], estado, conquistada_em
materiais:          id, idioma_id, [idioma_id+principal], ativo
recursos:           id, tipo, favorito, *idiomas, *pilares
autoavaliacoes:     id, &[idioma_id+bloco_id], data
regras_toggl:       id, ordem, ativa
lotes_importacao:   id, importado_em
retomadas:          id, ativa, inicio
retomada_fases:     id, [protocolo_id+fase], data
config:             id
log_abertura:       data
telemetria:         id, datetime
```

## 5. Consultas críticas e como o índice as serve

| Consulta | Onde | Índice |
|---|---|---|
| Sessões de hoje | Hoje, piso diário | `data` |
| Sessões do mês por categoria | Dashboard, `RN-701` | `[data+categoria]` |
| Sessões do mês por pilar | `RN-703` | `[data+pilar]` |
| Datas distintas com registro no ano | `RN-704`, `RN-705` | `data` (varredura de chaves, sem carregar registros) |
| Palavras acumuladas por idioma | `RN-501` | `idioma_id` + soma incremental em cache |
| Check de flashcards do dia | `RN-302` | `[idioma_id+data]` |
| Tarefas abertas de hoje | Hoje, Tarefas | `[estado+data_prevista]` |
| Conflitos na importação | `RN-1004` | `[idioma_id+data]` + filtro em memória |

`[DECISÃO: manter um cache derivado (tabela `agregados_diarios`) apenas se a leitura do dashboard anual passar de 300 ms em medição real.]` Justificativa: 3.000 sessões/ano é volume trivial para varredura em memória; cache derivado introduz o risco clássico de dado desatualizado sem ganho garantido. A decisão é adiada para o momento em que houver medição, não antes.

## 6. Migrações

`Config.versao_schema` controla o upgrade. Regras:

1. Toda migração é aditiva quando possível (novo campo com default).
2. Antes de qualquer migração destrutiva, o app grava um backup JSON automático e mostra o caminho do arquivo.
3. O export JSON carrega `versao_schema`; a importação recusa arquivo de versão maior que a do app, com mensagem clara.
