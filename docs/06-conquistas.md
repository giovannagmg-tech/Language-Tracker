# 06 — Catálogo de conquistas

51 definições, que geram **67 conquistas** contando a expansão por idioma (três idiomas ativos). Todas derivadas do método — nenhuma genérica de "app de hábito".

## 1. Regras gerais do sistema

### 1.1 Quando o avaliador roda
`motor-conquistas` roda após: salvar/editar/excluir sessão, check de flashcards, conclusão de tarefa, autoavaliação, troca de marcha, avanço de fase de retomada, virada do dia e importação de lote. Sempre sobre o catálogo inteiro — 67 avaliações de funções puras é trabalho desprezível.

### 1.2 Escopo
- `global`: uma instância.
- `por_idioma`: uma instância por idioma ativo, avaliada com os dados daquele idioma.

### 1.3 Repetíveis
Uma conquista repetível pode ser ganha mais de uma vez, respeitando sua **janela**: mensal (uma vez por mês civil), semanal (uma vez por semana ISO), anual, ou por evento (retomada). `ConquistaEstado.vezes` conta; o card mostra `×n` e a data da última.

### 1.4 Progresso das bloqueadas
Todo avaliador devolve `{ conquistada: boolean, atual: number, alvo: number }`. O card bloqueado mostra a barrinha `atual/alvo` **e o critério em texto**, sempre — nunca esconder o critério.

### 1.5 Retomada suspende, não zera
Enquanto `RetomadaProtocolo.ativa`, as conquistas de **consistência** não são avaliadas (nem ganhas nem perdidas) — só as de recuperação, camada e método. Uma conquista já ganha nunca é retirada.

### 1.6 Peso editorial
As categorias **produção** e **recuperação** são as que o gargalo real exige. Na tela, ambas aparecem antes das de consistência quando há empate de ordenação, e as de recuperação usam o mesmo tamanho de card e a mesma ênfase visual das de sequência (`RN` do doc 01, princípio 6).

---

## 2. Consistência — cor laranja

| Código | Nome | Critério (texto no card) | `criterio_chave` | Parâmetros | Escopo | Repetível |
|---|---|---|---|---|---|---|
| CON-01 | Sete | 7 dias seguidos com registro | `streak_registro` | `{dias:7}` | global | não |
| CON-02 | Quinze | 14 dias seguidos com registro | `streak_registro` | `{dias:14}` | global | não |
| CON-03 | Um mês inteiro | 30 dias seguidos com registro | `streak_registro` | `{dias:30}` | global | não |
| CON-04 | Sessenta | 60 dias seguidos com registro | `streak_registro` | `{dias:60}` | global | não |
| CON-05 | Cem | 100 dias seguidos com registro | `streak_registro` | `{dias:100}` | global | não |
| CON-06 | Mês sem buraco | Um mês civil com maior lacuna ≤ 2 dias | `mes_lacuna_maxima` | `{max:2}` | global | sim (mensal) |
| CON-07 | Trimestre inteiro | 90 dias sem nunca ter dois dias em branco seguidos | `sem_dois_em_branco` | `{dias:90}` | global | não |
| CON-08 | Piso de sete | 7 dias seguidos cumprindo flashcards + 1 min de fala | `streak_piso` | `{dias:7}` | global | não |
| CON-09 | Piso de trinta | 30 dias seguidos cumprindo o piso | `streak_piso` | `{dias:30}` | global | não |
| CON-10 | Vinte no mês | 20 dias com registro num mês civil | `dias_registro_mes` | `{dias:20}` | global | sim (mensal) |
| CON-11 | A sexta virou dia | 4 sextas-feiras seguidas com registro | `dia_semana_seguido` | `{dia:5, vezes:4}` | global | sim (por sequência) |

```
streak_registro(p)      → atual = RN-705.streak_registro,  alvo = p.dias
streak_piso(p)          → atual = RN-705.streak_piso,      alvo = p.dias
mes_lacuna_maxima(p)    → para o mês civil corrente e completo:
                          conquistada = RN-704(mês) ≤ p.max e dias_com_registro(mês) > 0
                          atual = max(0, p.max_possivel - lacuna), alvo mostrado como "≤2"
sem_dois_em_branco(p)   → janela dos últimos p.dias dias: nenhum par (d, d+1) com
                          em_branco(d) e em_branco(d+1);
                          atual = dias desde a última ocorrência de dois em branco, alvo = p.dias
dias_registro_mes(p)    → atual = dias_com_registro(mês corrente), alvo = p.dias
dia_semana_seguido(p)   → conta ocorrências consecutivas do dia p.dia com registro,
                          para trás a partir da última ocorrência; alvo = p.vezes
```

---

## 3. Camadas — cor roxa

Cinco definições `por_idioma` (15 instâncias) mais duas globais.

| Código | Nome | Critério | `criterio_chave` | Parâmetros | Escopo | Repetível |
|---|---|---|---|---|---|---|
| CAM-01 | Viajante | 1.500 palavras acumuladas | `camada_atingida` | `{camada:1}` | por idioma | não |
| CAM-02 | Conexão | 3.000 palavras acumuladas | `camada_atingida` | `{camada:2}` | por idioma | não |
| CAM-03 | Negócios | 5.000 palavras acumuladas | `camada_atingida` | `{camada:3}` | por idioma | não |
| CAM-04 | Acadêmico | 10.000 palavras acumuladas | `camada_atingida` | `{camada:4}` | por idioma | não |
| CAM-05 | Maestria | 20.000 palavras acumuladas | `camada_atingida` | `{camada:5}` | por idioma | não |
| CAM-06 | Três passaportes | Os três idiomas na camada 1 ou acima | `todos_idiomas_camada` | `{camada:1}` | global | não |
| CAM-07 | Mil no ano | 1.000 palavras novas num ano civil | `palavras_no_ano` | `{palavras:1000}` | por idioma | sim (anual) |

```
camada_atingida(p, i)      → atual = acumulado(i) (RN-501), alvo = limiar(p.camada)
todos_idiomas_camada(p)    → atual = nº de idiomas ativos com camada ≥ p.camada, alvo = nº de idiomas ativos
palavras_no_ano(p, i)      → atual = Σ palavras_novas(i) no ano civil, alvo = p.palavras
```

**Instâncias esperadas no primeiro ano:** inglês já parte de 2.729 (CAM-01 e CAM-02 saem conquistadas na semente, com `conquistada_em = data da instalação` e uma marca "pré-existente" no card); francês parte de 0, e CAM-01 francês é a conquista-alvo do bloco B1.

`[DECISÃO: camadas já atingidas no cadastro nascem conquistadas, com marca visual de "pré-existente".]` Justificativa: mostrar "bloqueada" para 1.500 palavras de inglês quando ela tem 2.729 seria mentira; e desbloquear com fanfarra também.

---

## 4. Produção — cor verde

A categoria mais valiosa. 13 definições.

| Código | Nome | Critério | `criterio_chave` | Parâmetros | Escopo | Repetível |
|---|---|---|---|---|---|---|
| PRO-01 | Abriu a boca | Primeira conversação do mês | `conversas_no_mes` | `{n:1}` | global | sim (mensal) |
| PRO-02 | Uma hora falando | 60 minutos de fala numa semana | `fala_na_semana` | `{min:60}` | global | sim (semanal) |
| PRO-03 | Noventa | 90 minutos de fala numa semana | `fala_na_semana` | `{min:90}` | global | sim (semanal) |
| PRO-04 | Dez áudios | 10 áudios no grupo, acumulados | `audios_acumulados` | `{n:10}` | global | não |
| PRO-05 | Trinta áudios | 30 áudios no grupo, acumulados | `audios_acumulados` | `{n:30}` | global | não |
| PRO-06 | Primeiro vídeo | Uma gravação de produção feita | `videos_acumulados` | `{n:1}` | global | não |
| PRO-07 | Mês ativo | 35% do tempo do mês em estudo ativo | `pct_ativo_mes` | `{pct:0.35}` | global | sim (mensal) |
| PRO-08 | Metade e metade | 50% do tempo do mês em estudo ativo | `pct_ativo_mes` | `{pct:0.50}` | global | sim (mensal) |
| PRO-09 | Doze produções | 12 sessões de produção num mês | `sessoes_producao_mes` | `{n:12}` | global | sim (mensal) |
| PRO-10 | Quatro semanas de sessenta | 4 semanas seguidas com 60+ min de fala | `semanas_fala_seguidas` | `{min:60, semanas:4}` | global | sim (por sequência) |
| PRO-11 | Aula marcada, aula feita | Primeira sessão paga concluída | `aulas_acumuladas` | `{n:1}` | global | não |
| PRO-12 | Trilíngue na mesma semana | Falar nos três idiomas na mesma semana | `fala_todos_idiomas_semana` | `{min_por_idioma:1}` | global | sim (semanal) |
| PRO-13 | Sábado de escrita | 4 sábados com sessão de escrita | `sabados_escrita` | `{n:4}` | global | sim (por sequência) |

```
conversas_no_mes(p)            → atual = |Sessão(atividade ∈ {conversacao, aula}, mês)|, alvo = p.n
fala_na_semana(p)              → atual = RN-706.fala_semana(semana corrente), alvo = p.min
audios_acumulados(p)           → atual = |Sessão(atividade = audio_grupo)| total, alvo = p.n
videos_acumulados(p)           → atual = |Sessão(atividade = gravacao_video)|, alvo = p.n
aulas_acumuladas(p)            → atual = |Sessão(atividade = aula)|, alvo = p.n
pct_ativo_mes(p)               → mês civil completo: atual = RN-702(mês), alvo = p.pct
sessoes_producao_mes(p)        → atual = |Sessão(producao = true, mês)|, alvo = p.n
semanas_fala_seguidas(p)       → atual = nº de semanas ISO consecutivas, terminando na última
                                 semana fechada, com fala_semana ≥ p.min; alvo = p.semanas
fala_todos_idiomas_semana(p)   → atual = nº de idiomas ativos com Σ minutos_fala ≥ p.min_por_idioma
                                 na semana; alvo = nº de idiomas ativos
sabados_escrita(p)             → atual = nº de sábados consecutivos com Sessão(atividade=escrita);
                                 alvo = p.n
```

---

## 5. Método — cor azul

15 definições. São as que provam que o método está sendo seguido, não só o tempo sendo gasto.

| Código | Nome | Critério | `criterio_chave` | Parâmetros | Escopo | Repetível |
|---|---|---|---|---|---|---|
| MET-01 | Semana de flashcards | 7 dias seguidos com flashcards | `streak_flashcards` | `{dias:7}` | global | não |
| MET-02 | Mês de flashcards | 20 dias com flashcards num mês | `dias_flashcards_mes` | `{dias:20}` | global | sim (mensal) |
| MET-03 | Velocidade B | Um lote de 10+ palavras a 1 min/palavra ou menos | `velocidade_lote` | `{min_por_palavra:1.0, palavras_min:10}` | por idioma | não |
| MET-04 | Mês limpo | Um mês civil sem gramática e pronúncia no mesmo dia | `mes_sem_violar_regra5` | `{}` | global | sim (mensal) |
| MET-05 | Quatro sextas de pronúncia | 4 sextas seguidas com 25+ min de pronúncia | `sextas_pronuncia` | `{min:25, vezes:4}` | global | sim (por sequência) |
| MET-06 | Lote conferido | 10 checagens de interferência rodadas | `checagens_acumuladas` | `{n:10}` | global | não |
| MET-07 | Lote limpo cinco vezes | 5 lotes seguidos sem nenhum aviso de interferência | `lotes_limpos_seguidos` | `{n:5}` | global | sim (por sequência) |
| MET-08 | Fila zerada | 7 dias seguidos sem palavra pendente de ativação | `sem_pendentes_ativacao` | `{dias:7}` | global | sim (por sequência) |
| MET-09 | Tempo que não existia | 20 dias no mês com estudo de mãos ocupadas | `dias_tempo_mes` | `{tempo:'maos_ocupadas', dias:20}` | global | sim (mensal) |
| MET-10 | Os três tempos | Cadeira, mãos livres e mãos ocupadas no mesmo dia | `tres_tempos_no_dia` | `{}` | global | sim (semanal) |
| MET-11 | Distribuição no alvo | Um mês com os quatro pilares dentro de ±5 pp do alvo | `pilares_no_alvo_mes` | `{tolerancia:0.05}` | global | sim (mensal) |
| MET-12 | Erro que virou frase | 10 tarefas de correção concluídas no prazo | `correcoes_no_prazo` | `{n:10}` | global | não |
| MET-13 | Material andando | 10 unidades avançadas no material principal num mês | `avanco_material_mes` | `{n:10}` | por idioma | sim (mensal) |
| MET-14 | Fechou o bloco | Autoavaliação dos três idiomas no fim de um bloco | `autoavaliacao_bloco_completa` | `{}` | global | sim (por bloco) |
| MET-15 | Turbo por um mês | Marcha 3 ativa por 30 dias seguidos | `marcha_seguida` | `{marcha:3, dias:30}` | global | sim (por sequência) |

```
streak_flashcards(p)            → atual = dias consecutivos com dia_com_flashcards (RN-707), alvo = p.dias
dias_flashcards_mes(p)          → atual = Σ dia_com_flashcards no mês, alvo = p.dias
velocidade_lote(p, i)           → conquistada se existe RegistroVocabulario(i) com
                                  palavras_novas ≥ p.palavras_min e min_por_palavra ≤ p.min_por_palavra;
                                  atual = melhor (menor) min_por_palavra já registrado, alvo = p.min_por_palavra
mes_sem_violar_regra5(p)        → mês civil completo com |Sessão(violou_regra_5 = true, mês)| = 0
                                  e dias_com_registro(mês) ≥ 10;
                                  atual = dias do mês sem violação, alvo = dias do mês
sextas_pronuncia(p)             → sextas consecutivas com Σ duracao(pilar=pronuncia) ≥ p.min; alvo = p.vezes
checagens_acumuladas(p)         → atual = |RegistroVocabulario(checagem_rodada = true)|, alvo = p.n
lotes_limpos_seguidos(p)        → sequência final de RegistroVocabulario com checagem_rodada = true
                                  e qtd_avisos_interferencia = 0; alvo = p.n
sem_pendentes_ativacao(p)       → dias consecutivos em que Σ pendentes_ativacao(i) = 0 (RN-408); alvo = p.dias
dias_tempo_mes(p)               → atual = |{d no mês : existe Sessão(d, tempo = p.tempo)}|, alvo = p.dias
tres_tempos_no_dia(p)           → existe d na semana com sessões nos três valores de tempo;
                                  atual = maior nº de tempos distintos num dia da semana, alvo = 3
pilares_no_alvo_mes(p)          → mês completo com max |desvio(pilar)| ≤ p.tolerancia (RN-703)
                                  e base_pilares(mês) ≥ 300 min;
                                  atual = nº de pilares dentro da tolerância, alvo = 4
correcoes_no_prazo(p)           → atual = |Tarefa(tipo=frases_apos_erro, estado=concluida,
                                  concluida_em ≤ data_prevista)|, alvo = p.n
avanco_material_mes(p, i)       → atual = posicao_atual(fim do mês) - posicao_atual(início do mês)
                                  do material principal de i; alvo = p.n
autoavaliacao_bloco_completa(p) → existe Autoavaliacao para todos os idiomas ativos no bloco encerrado;
                                  atual = nº de autoavaliações do bloco, alvo = nº de idiomas ativos
marcha_seguida(p)               → atual = dias corridos do registro vigente em MarchaHistorico com
                                  numero = p.marcha, alvo = p.dias
```

---

## 6. Recuperação — cor verde-escura, com a mesma ênfase das de sequência

Cinco definições. O histórico mostra dez lacunas de 5+ dias e uma de 22: **retomar é a habilidade crítica**, e o app trata assim.

| Código | Nome | Critério | `criterio_chave` | Parâmetros | Escopo | Repetível |
|---|---|---|---|---|---|---|
| REC-01 | Voltou inteira | Concluir as cinco fases do protocolo de retomada | `retomada_concluida` | `{}` | global | sim (por retomada) |
| REC-02 | Volta rápida | Concluir a retomada em 12 dias ou menos | `retomada_rapida` | `{dias:12}` | global | sim (por retomada) |
| REC-03 | Nunca mais 22 | Seis meses sem nenhuma lacuna maior que 7 dias | `sem_lacuna_grande` | `{dias_janela:180, lacuna_max:7}` | global | não |
| REC-04 | Duas voltas | Concluir duas retomadas — o padrão de sumir para sempre foi quebrado | `retomadas_acumuladas` | `{n:2}` | global | não |
| REC-05 | O minuto que salvou | 10 dias salvos pelo botão de 1 minuto da regra 1 | `dias_salvos_regra1` | `{n:10}` | global | não |

```
retomada_concluida(p)     → dispara quando RetomadaProtocolo.fase = 5 é cumprida e ativa vira false
                            com abandonada = false; atual = fase corrente, alvo = 5
retomada_rapida(p)        → (concluida_em - inicio) ≤ p.dias na mesma conclusão
sem_lacuna_grande(p)      → nos últimos p.dias_janela dias, RN-704 ≤ p.lacuna_max;
                            atual = dias desde a última lacuna > p.lacuna_max, alvo = p.dias_janela
retomadas_acumuladas(p)   → atual = |RetomadaProtocolo(concluida_em ≠ null, abandonada = false)|, alvo = p.n
dias_salvos_regra1(p)     → atual = |Sessão(origem = automatica, via = 'botao_regra',
                            duracao_min = 1)| em dias que estavam em branco; alvo = p.n
```

Texto do card de REC-01, exibido na conquista: *"Cinco fases. Você voltou inteira. Isso vale mais que streak."*

---

## 7. Resumo por categoria

| Categoria | Definições | Instâncias | Cor do card |
|---|---|---|---|
| Consistência | 11 | 11 | laranja pastel |
| Camadas | 7 | 19 (5×3 + 1 + 1×3) | roxo pastel |
| Produção | 13 | 13 | verde pastel |
| Método | 15 | 19 (2 por idioma × 3 + 13) | azul pastel |
| Recuperação | 5 | 5 | verde-escuro pastel |
| **Total** | **51** | **67** | |

> Contagem de instâncias assume três idiomas ativos. Adicionar um quarto idioma cria automaticamente as instâncias por idioma correspondentes, todas bloqueadas.

## 8. O que não virou conquista, de propósito

- **Horas totais acumuladas.** Premiaria diretamente o comportamento que é o problema: maratona de série legendada. Nenhuma conquista deste catálogo pode ser obtida apenas com imersão.
- **Sequência de imersão.** Mesmo motivo.
- **Número de cartões revisados.** O app não mede volume de cartões (`RN-403`), e o método diz que o indicador é frequência.
- **Comparação com outras pessoas.** Não há outras pessoas.
