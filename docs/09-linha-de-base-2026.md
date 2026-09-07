# 09 — Linha de base 2026 (fixture de teste)

Export do Toggl, janeiro a setembro de 2026. Estes números são **critério de aceitação**: se o dashboard não os reproduzir, o dashboard está mentindo.

## 1. Totais por projeto

| Projeto | Duração | Segundos |
|---|---|---|
| Imersão Espanhol | 32:20:45 | 116.445 |
| Imersão Inglês | 32:18:39 | 116.319 |
| Estudo ativo Inglês | 10:29:38 | 37.778 |
| Flashcards Inglês | 3:33:40 | 12.820 |
| Estudo ativo Francês | 2:11:58 | 7.918 |
| Flashcards Espanhol | 2:00:34 | 7.234 |
| Imersão Francês | 1:40:23 | 6.023 |
| Estudo ativo Espanhol | 0:54:18 | 3.258 |
| Flashcards Francês | 0:53:19 | 3.199 |
| **TOTAL** | **86:23:14** | **310.994** |

## 2. Composição (RN-701, RN-702)

| Categoria | Duração | % |
|---|---|---|
| Imersão | 66:19:47 | **76,8%** |
| Estudo ativo | 13:35:54 | **15,7%** |
| Flashcards | 6:27:33 | **7,5%** |

Confere com o diagnóstico do doc 01. A meta de 35% de estudo ativo é mais do que o dobro do realizado.

## 3. Por idioma

| Idioma | Duração | % do total | Imersão | Ativo | Flashcards |
|---|---|---|---|---|---|
| Inglês | 46:21:57 | 53,7% | 32:18:39 | 10:29:38 | 3:33:40 |
| Espanhol | 35:15:37 | 40,8% | 32:20:45 | 0:54:18 | 2:00:34 |
| Francês | 4:45:40 | 5,5% | 1:40:23 | 2:11:58 | 0:53:19 |

Leitura: o francês é o único idioma em que o estudo ativo supera a imersão — e é justamente o de menor volume. O espanhol é o caso extremo do problema: 32h de imersão contra 54 minutos de estudo ativo, uma proporção de 36 para 1.

## 4. Demais indicadores conhecidos

| Indicador | Valor |
|---|---|
| Dias com registro | 97 de 249 (39%) |
| Mediana por dia ativo | 42 min |
| Produção (fala + escrita) | 8,6% do tempo, 17 sessões |
| Dias com flashcards | 32 (13%) |
| Maior lacuna | 22 dias |
| Lacunas de 5+ dias | 10 |
| Top 10 dias | 32% de todas as horas, 7 deles imersão |
| Pico de horário | 8h |
| Dia mais forte / mais fraco | segunda / sexta |

## 5. Como usar como teste

`tests/fixtures/linha-de-base-2026.ts` monta um conjunto de sessões que reproduz as durações da seção 1. Os testes de `lib/domain/metrics.ts` verificam, com tolerância de ±0,1 ponto percentual:

1. `composicao()` devolve 76,8 / 15,7 / 7,5.
2. `horasPorIdioma()` devolve 46:21:57 / 35:15:37 / 4:45:40, e o total fecha em 86:23:14.
3. `maiorLacuna()` devolve 22.
4. `diasComRegistro()` devolve 97.
5. `concentracao(10)` devolve ~32%.
6. `diagnostico()` abre com a frase de consumo passivo (`RN-712`, item 1).

O critério de pronto da Fase 6 (importação do Toggl) é importar o CSV real e obter exatamente estes totais.
