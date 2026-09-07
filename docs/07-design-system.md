# 07 — Design system

Base: o protótipo já existente. Claro, arredondado, generoso em respiro, sem gradiente. **O número é o elemento gráfico mais forte de cada card** — tudo aqui existe para o dígito ficar legível.

---

## 1. Tokens

Todos declarados em `:root` como CSS custom properties. O tema escuro redefine **apenas** as cores, nunca tipografia, espaço, raio ou sombra.

### 1.1 Neutros e superfícies

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--cor-fundo` | `#FAFAF8` | `#121410` | fundo da área de conteúdo |
| `--cor-superficie` | `#FFFFFF` | `#1B1E18` | card |
| `--cor-superficie-2` | `#F4F4F1` | `#23261F` | card aninhado, linha zebrada, campo |
| `--cor-borda` | `#E7E7E1` | `#2E322A` | borda de card, 1px |
| `--cor-borda-forte` | `#D5D5CD` | `#3D4238` | divisor, borda de input |
| `--cor-texto` | `#171A15` | `#ECEEE8` | título e número |
| `--cor-texto-2` | `#6C7268` | `#A2A89C` | subtítulo, contexto |
| `--cor-texto-3` | `#9AA095` | `#767C70` | rótulo, placeholder, desabilitado |

### 1.2 Sidebar e marca

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--cor-sidebar` | `#1A1D18` | `#0D0F0B` | fundo da sidebar (escura nos dois temas) |
| `--cor-sidebar-texto` | `#C9CEC3` | `#C9CEC3` | item inativo |
| `--cor-sidebar-hover` | `#262A22` | `#1A1D18` | hover |
| `--cor-sidebar-item-ativo` | `#D8F26B` | `#D8F26B` | pílula do item ativo |
| `--cor-sidebar-texto-ativo` | `#171A15` | `#171A15` | texto sobre a pílula |
| `--lime-500` | `#C7E93F` | `#C7E93F` | logo quadrado |
| `--lime-300` | `#D8F26B` | `#D8F26B` | pílula, foco |
| `--lime-100` | `#EEF9C4` | `rgba(199,233,63,.16)` | realce sutil |

A sidebar é escura nos dois temas — é a âncora visual do app.

### 1.3 Cores por tipo de meta

Uma cor por tipo, sem exceção (regra em 4.1).

| Token | Claro | Escuro | Tipo de meta |
|---|---|---|---|
| `--meta-longo` | `#F07A2B` | `#F5934F` | longo prazo (palavras, nível, camadas) |
| `--meta-longo-fraco` | `#FDEEDF` | `rgba(240,122,43,.18)` | trilho do anel |
| `--meta-mensal` | `#E8558E` | `#F076A6` | mensal (painel dos 5 indicadores) |
| `--meta-mensal-fraco` | `#FCE7F0` | `rgba(232,85,142,.18)` | trilho |
| `--meta-semanal` | `#3B72D9` | `#6C9BF0` | semanal (conversação, fala, flashcards) |
| `--meta-semanal-fraco` | `#E4EEFC` | `rgba(59,114,217,.18)` | trilho |

### 1.4 Cores por categoria de conquista

| Categoria | Token de fundo | Claro | Token de destaque | Claro |
|---|---|---|---|---|
| Consistência | `--conq-consistencia-bg` | `#FDEEDF` | `--conq-consistencia` | `#E07B2B` |
| Método | `--conq-metodo-bg` | `#E4EEFC` | `--conq-metodo` | `#3B72D9` |
| Produção | `--conq-producao-bg` | `#E1F3E7` | `--conq-producao` | `#1F9D57` |
| Camadas | `--conq-camada-bg` | `#ECE6FB` | `--conq-camada` | `#7857D6` |
| Recuperação | `--conq-recuperacao-bg` | `#DCEDE4` | `--conq-recuperacao` | `#147A55` |

No escuro, todo `-bg` vira o `-destaque` a 16% de opacidade sobre `--cor-superficie`, e o destaque clareia ~15%.

Bloqueada: `--cor-superficie-2` de fundo, `--cor-texto-3` no texto, ícone dessaturado a 0% de saturação e 55% de opacidade. **O critério continua legível** (contraste mínimo 4.5:1).

### 1.5 Cores por pilar

| Pilar | Token | Claro | Escuro |
|---|---|---|---|
| Vocabulário | `--pilar-vocabulario` | `#3B72D9` | `#6C9BF0` |
| Gramática | `--pilar-gramatica` | `#7857D6` | `#9D84E8` |
| Pronúncia | `--pilar-pronuncia` | `#E07B2B` | `#F09A54` |
| Fala | `--pilar-fala` | `#1F9D57` | `#3FBE77` |
| Imersão (não-pilar) | `--imersao` | `#9AA095` | `#767C70` |

Imersão é **sempre cinza**. Nunca recebe cor de destaque, em gráfico nenhum. É a tradução visual de `RN-001`.

### 1.6 Cores por idioma

| Idioma | Token | Claro | Escuro |
|---|---|---|---|
| Inglês | `--idioma-ingles` | `#2F6FED` | `#6C9BF0` |
| Espanhol | `--idioma-espanhol` | `#E4A11B` | `#F2BC4E` |
| Francês | `--idioma-frances` | `#D14D5A` | `#E5757F` |

### 1.7 Semânticas e semáforo

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--sucesso` | `#1F9D57` | `#3FBE77` | meta batida, regra verde |
| `--atencao` | `#E0A32B` | `#F0BB55` | regra amarela, desvio médio |
| `--perigo` | `#D4483B` | `#E86F62` | regra vermelha, prazo vencido |
| `--neutro` | `#9AA095` | `#767C70` | regra cinza (não se aplica hoje) |
| `--sucesso-bg` / `--atencao-bg` / `--perigo-bg` | `#E1F3E7` / `#FBF0D9` / `#FBE5E2` | destaque a 16% | faixas |

### 1.8 Tipografia

Família: **Inter** (variável, empacotada localmente), fallback `system-ui, -apple-system, "Segoe UI", sans-serif`.
Todos os números usam `font-variant-numeric: tabular-nums` — colunas de dígitos precisam alinhar.

| Token | Tamanho / entrelinha | Peso | Uso |
|---|---|---|---|
| `--txt-display` | 44px / 1.05 | 700 | número central de anel grande, streak |
| `--txt-numero` | 32px / 1.1 | 700 | número principal de card |
| `--txt-numero-sm` | 22px / 1.15 | 700 | número em grade de rótulos |
| `--txt-h1` | 28px / 1.2 | 650 | título de página |
| `--txt-h2` | 18px / 1.3 | 600 | título de card |
| `--txt-h3` | 15px / 1.4 | 600 | subtítulo de seção |
| `--txt-corpo` | 14px / 1.5 | 400 | texto |
| `--txt-corpo-forte` | 14px / 1.5 | 600 | valor inline |
| `--txt-pequeno` | 13px / 1.45 | 400 | subtítulo de card, contexto |
| `--txt-rotulo` | 11px / 1.2 | 600 | RÓTULO EM MAIÚSCULAS, `letter-spacing: .06em`, cor `--cor-texto-3` |

Letter-spacing negativo em números grandes: `--txt-display` e `--txt-numero` usam `-0.02em`.

### 1.9 Espaçamento

Escala base 4: `--e-1: 4px` · `--e-2: 8px` · `--e-3: 12px` · `--e-4: 16px` · `--e-5: 20px` · `--e-6: 24px` · `--e-8: 32px` · `--e-10: 40px` · `--e-12: 48px` · `--e-16: 64px`.

Padrões: padding interno de card `--e-6`; gap da grade `--e-6`; distância entre seções `--e-8`; distância entre título de página e conteúdo `--e-6`; o piso diário na tela Hoje é separado do resto por `--e-8`.

### 1.10 Raios

`--r-1: 6px` (chip pequeno, badge) · `--r-2: 10px` (input, botão) · `--r-3: 16px` (**card**, padrão) · `--r-4: 20px` (card grande, modal) · `--r-pill: 999px` (pílula, chip, pastilha de regra).

### 1.11 Sombras

| Token | Claro | Escuro |
|---|---|---|
| `--s-1` | `0 1px 2px rgba(20,23,17,.05)` | `0 1px 2px rgba(0,0,0,.4)` |
| `--s-card` | `0 1px 2px rgba(20,23,17,.04), 0 2px 6px rgba(20,23,17,.05)` | `0 1px 3px rgba(0,0,0,.45)` |
| `--s-popover` | `0 8px 24px rgba(20,23,17,.12)` | `0 10px 28px rgba(0,0,0,.55)` |

No escuro, a separação vem principalmente da borda; a sombra é discreta.

### 1.12 Movimento

`--t-rapido: 120ms ease-out` (hover, foco) · `--t-medio: 200ms cubic-bezier(.2,.8,.2,1)` (painel, modal) · `--t-lento: 400ms` (anel animando ao carregar, uma vez só).
`@media (prefers-reduced-motion: reduce)`: todas as durações vão a 0 e o anel desenha no valor final.

### 1.13 Foco e acessibilidade

- Anel de foco: `outline: 2px solid var(--lime-500); outline-offset: 2px`, mais um contorno interno `1px` em `--cor-texto` para garantir visibilidade sobre lime.
- Contraste mínimo: 4.5:1 para texto, 3:1 para elementos gráficos e bordas de estado. Isso vale inclusive para conquista bloqueada e para o texto sobre pastel.
- Alvo de toque mínimo 44×44px abaixo de 768px.
- Nenhuma informação transmitida só por cor: o semáforo tem número + nome, os gráficos têm rótulo, os estados de conquista têm ícone diferente.

---

## 2. Componentes

### 2.1 Sidebar

```
largura 210px (colapsada 64px)  ·  fundo --cor-sidebar  ·  altura total, fixa
padding --e-4
├── Marca:  quadrado 36×36, --lime-500, raio --r-2, letra "P" em --cor-texto, 700
│           nome "Poliglota" (--txt-h3, #FFF)  ·  subtítulo "estudos de idiomas" (--txt-pequeno, --cor-sidebar-texto)
├── Nav:    item = altura 38px, padding-inline --e-3, raio --r-pill, gap --e-3,
│           ícone 18px de contorno, rótulo --txt-corpo
│           inativo: texto --cor-sidebar-texto  ·  hover: fundo --cor-sidebar-hover
│           ATIVO: fundo --cor-sidebar-item-ativo, texto e ícone --cor-sidebar-texto-ativo, peso 600
│           badge: círculo 20px, fundo --perigo, texto #FFF 11px 700, à direita
└── Rodapé: seletor de marcha (3 pílulas M1/M2/M3, ativa em lime)
            streak: "12 dias" em --txt-corpo-forte + "piso 4" em --txt-pequeno
            faixa de retomada quando ativa: fundo --atencao a 20%, texto --lime-100
```

### 2.2 Cabeçalho de página

Ícone de contorno 24px à esquerda (cor `--cor-texto`), título em `--txt-h1`, e à direita as ações da tela. Subtítulo opcional em `--txt-pequeno` abaixo do título. Sem borda inferior — a separação é o respiro de `--e-6`.

### 2.3 Card

> Nesta documentação, **card** e **cartão** significam sempre este componente de interface. Cartão de estudo é **flashcard**, vive no Flashcards Deluxe e não existe dentro do app (`RN-003`).

```
fundo --cor-superficie  ·  borda 1px --cor-borda  ·  raio --r-3  ·  sombra --s-card
padding --e-6
├── Cabeçalho (opcional): [ícone em quadrado 32×32, raio --r-2, fundo pastel da cor do
│   contexto, ícone na cor forte] + [título --txt-h2] + [subtítulo --txt-pequeno --cor-texto-2]
│   + ação à direita: texto discreto "editar" em --txt-pequeno, --cor-texto-3, sublinhado no hover
├── Corpo
└── Rodapé (opcional): --txt-pequeno, --cor-texto-2, borda-topo 1px --cor-borda, padding-topo --e-4
```

Variantes: `card--destaque` (borda 2px na cor do contexto, usada no piso diário), `card--alerta` (fundo `--perigo-bg`, borda `--perigo`), `card--pastel` (conquista).

### 2.4 Medidor de anel (o componente-assinatura)

SVG próprio, não da biblioteca de gráficos.

```
diâmetro 160px (grande) / 116px (compacto)
espessura do traço 12px (grande) / 9px (compacto)
trilho: cor -fraco do tipo de meta  ·  progresso: cor forte do tipo de meta
início às 12h, sentido horário, extremidade arredondada
progresso > 100%: o anel completa e ganha um segundo arco interno de 4px

Centro:
  percentual  --txt-display, cor --cor-texto           →  "55%"
Abaixo do anel, centralizado:
  valor absoluto  --txt-numero-sm, --cor-texto         →  "2729 / 5000 palavras"
  linha de contexto  --txt-pequeno, --cor-texto-2      →  "camada 3 — Negócios · faltam 2271"
  percentual repetido  --txt-corpo-forte, --cor-texto  →  "55%"
```

A repetição do percentual embaixo é intencional e vem do protótipo: o olho lê o anel, e o número embaixo confirma.
Direção invertida (`menor_melhor`, como "maior lacuna"): o anel enche conforme o valor **diminui** rumo ao alvo, e a linha de contexto diz "menor é melhor".

### 2.5 Grade de rótulos

Blocos de detalhe embaixo dos medidores.

```
display: grid  ·  colunas: repeat(auto-fit, minmax(96px, 1fr))  ·  gap --e-5
cada célula:
   RÓTULO      --txt-rotulo, --cor-texto-3, maiúsculas
   valor       --txt-numero-sm, --cor-texto
   nota (opc.) --txt-pequeno, --cor-texto-2
```
Sem borda, sem fundo, sem divisor. O alinhamento faz o trabalho.

### 2.6 Card de conquista

```
grade de 3 colunas, gap --e-6
card: fundo --conq-{categoria}-bg  ·  raio --r-3  ·  sem borda  ·  padding --e-6  ·  centralizado
├── ícone: círculo 48px, fundo --cor-superficie, ícone 24px na cor --conq-{categoria}
├── nome: --txt-h3, --cor-texto, peso 700, --e-3 abaixo do ícone
├── critério: --txt-pequeno, --cor-texto-2, até 2 linhas
├── (conquistada) data: --txt-rotulo, --cor-texto-3  ·  "×3" no canto superior direito
├── (bloqueada) barra de progresso 4px, raio --r-pill, trilho --cor-borda,
│   preenchimento --cor-texto-3, com "142/180" em --txt-rotulo
└── ação "Compartilhar": ícone + texto, --txt-pequeno, cor --conq-{categoria}
```
Bloqueada: todo o card em `--cor-superficie-2`, ícone dessaturado, texto em `--cor-texto-3`, **critério sempre visível**, sem ação de compartilhar.

### 2.7 Formulário de registro

```
Chips de escolha única (idioma, atividade, pilar, tempo):
   altura 34px, padding-inline --e-4, raio --r-pill, borda 1px --cor-borda-forte
   inativo: fundo --cor-superficie, texto --cor-texto-2
   ativo: fundo --cor-texto, texto --cor-fundo  (inversão, máximo contraste, zero ambiguidade)
   desabilitado (ex.: Instagram fora da marcha 3): fundo --cor-superficie-2,
      texto --cor-texto-3, cursor not-allowed, tooltip com o motivo
   grupo com legenda em --txt-rotulo acima

Stepper de duração:
   [-] [ 40 ] [+]  altura 40px, raio --r-2, número em --txt-numero-sm centralizado
   atalhos abaixo: 4 chips pequenos "15 · 25 · 40 · 60"

Cronômetro:
   número em --txt-display, tabular  ·  botão primário "Iniciar"/"Parar"

Pastilha de classificação (sempre visível, ao lado do salvar):
   ATIVO   → fundo --sucesso-bg, texto --sucesso
   IMERSÃO → fundo --cor-superficie-2, texto --imersao

Aviso da regra 5:
   faixa inline abaixo do campo Pilar, fundo --atencao-bg, borda-esquerda 3px --atencao,
   texto --txt-pequeno, dois botões de texto: "Salvar assim mesmo" | "Trocar o pilar"

Botão primário: fundo --cor-texto, texto --cor-fundo, altura 40px, raio --r-2
Botão secundário: fundo transparente, borda 1px --cor-borda-forte
Botão de perigo: texto --perigo, sem fundo; confirmação sempre em segundo passo
```

### 2.8 Pastilha de regra (semáforo)

```
altura 32px, raio --r-pill, padding-inline --e-3, fundo --cor-superficie-2
ponto 8px na cor do estado + "1 · dois dias" em --txt-pequeno
estados: --sucesso / --atencao / --perigo / --neutro
amarela e vermelha: ganham um botão de texto colado à direita, na cor do estado
```

### 2.9 Barra de progresso linear

Altura 8px, raio `--r-pill`, trilho `--cor-borda`, preenchimento na cor do contexto. Linha-alvo (quando houver) como traço vertical 2px em `--cor-texto` com rótulo em `--txt-rotulo` acima.

### 2.10 Tabela

Cabeçalho em `--txt-rotulo`, linha de 44px, divisor 1px `--cor-borda`, hover `--cor-superficie-2`, números alinhados à direita e tabulares. Abaixo de 768px, cada linha vira um mini-card com rótulo à esquerda e valor à direita.

### 2.11 Estado vazio

Card com texto em `--txt-corpo`, `--cor-texto-2`, centralizado, e **um** botão primário. Sem ilustração, sem emoji, sem ícone grande.

### 2.12 Toast

Canto inferior direito (inferior centro no celular), fundo `--cor-texto`, texto `--cor-fundo`, raio `--r-2`, `--s-popover`, com ação "Desfazer" em `--lime-300`. Duração 30 s para gravações (janela do desfazer), 4 s para o resto.

---

## 3. Layout

- Grade de 12 colunas, largura máxima 1280px, gap `--e-6`.
- Tamanhos padrão de card: 4 colunas (números e anéis), 6 colunas (gráficos médios), 8 e 12 colunas (séries temporais e diagnóstico).
- Altura de gráfico: 240px (médio), 320px (série temporal), 180px (sparkline e barra única).
- Toda tela começa com o cabeçalho de página; nenhuma tela abre direto num gráfico.

---

## 4. Regras de uso de cor

### 4.1 Por tipo de meta
Anel **laranja** = meta de longo prazo (palavras, camada, nível). **Rosa** = painel mensal. **Azul** = meta semanal (conversação, fala, flashcards). Um anel nunca muda de cor por estar bem ou mal — a cor identifica o tipo, o preenchimento conta o progresso. Meta batida ganha um ✓ em `--sucesso` ao lado do número, não uma troca de cor.

### 4.2 Por categoria de conquista
Fixas na tabela 1.4. A categoria nunca troca de cor entre telas.

### 4.3 Por pilar e por idioma
- Gráficos **de pilar** usam as cores de pilar; gráficos **por idioma** usam as cores de idioma.
- **Nunca no mesmo gráfico.** Se um gráfico precisa das duas dimensões, uma delas vira posição (grupo/eixo) e só a outra vira cor.
- Imersão é sempre `--imersao`, cinza, em qualquer contexto.

### 4.4 Alvo × realizado
Realizado = preenchido, cor cheia. Alvo = mesma cor a 25% de opacidade com contorno tracejado 1px. Linha de meta em gráficos de série = traço horizontal 1,5px em `--cor-texto` com rótulo em `--txt-rotulo`.

### 4.5 Semáforo
`--sucesso` / `--atencao` / `--perigo` / `--neutro` são exclusivos de estado de regra, prazo e alerta. **Nunca** usados para representar dado (uma barra de horas jamais é vermelha por ser alta).

### 4.6 Ordem categórica fixa
Na composição, a ordem é sempre **ativo → flashcards → imersão**; nos pilares, sempre **vocabulário → gramática → pronúncia → fala**; nos tempos, **cadeira → mãos livres → mãos ocupadas**; nos idiomas, a ordem de `Idioma.ordem`. Ordem estável é o que torna dois períodos comparáveis de relance.

---

## 5. Conteúdo e tom

- Segunda pessoa, direto, sem exclamação. *"O piso não foi cumprido hoje."*, não *"Ops, parece que faltou algo!"*.
- Número antes do adjetivo: *"76% do seu tempo foi consumo passivo"*.
- Nenhuma mensagem de culpa em modo retomada.
- Nenhum texto que ensine o método — ela o escreveu.
- Rótulos em maiúsculas só na grade de rótulos; em nenhum outro lugar.

---

## 6. Implementação do tema

```css
:root { /* todos os tokens claros */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-tema="claro"]) { /* somente cores redefinidas */ }
}

:root[data-tema="escuro"] { /* as mesmas cores do bloco acima */ }
```

Nenhuma cor tem sua única definição dentro de um bloco de tema. `body` recebe `background: var(--cor-fundo)` explicitamente. A preferência da usuária (`Config.tema`) escreve `data-tema` no elemento raiz; `sistema` remove o atributo.
