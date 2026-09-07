# 01 — PRD: Poliglota

> `[DECISÃO: o app se chama "Poliglota", subtítulo "estudos de idiomas", logo = quadrado lime com a letra "P".]`
> Justificativa: a sidebar do protótipo exige nome curto + subtítulo curto; "Poliglota" descreve o caso de uso real (três idiomas em paralelo) sem prometer método nem gamificação.

---

## 1. Visão

Um painel de controle pessoal que transforma o método de aprendizado de idiomas da usuária em números que ela não consegue enganar. O app não ensina idioma, não guarda flashcards e não substitui ferramenta nenhuma: ele **mede, classifica e cobra** — separando com brutalidade o que é estudo ativo do que é consumo passivo, e tornando visível o buraco de produção oral.

Frase-teste do produto: *se ela abrir o app depois de uma semana ruim, ela vê em 5 segundos exatamente qual das seis regras quebrou e qual é a única coisa que precisa fazer hoje.*

## 2. O problema, ancorado nos números

Diagnóstico Toggl, janeiro a setembro de 2026 (249 dias corridos):

| Indicador | Real | Leitura |
|---|---|---|
| Dias com registro | 97 / 249 (39%) | Estuda menos de 2 em cada 5 dias |
| Mediana por dia ativo | 42 min | Quando estuda, estuda o suficiente |
| Imersão (passivo) | 76,8% do tempo | **Três quartos do "estudo" é consumo** |
| Estudo ativo | 15,7% | |
| Flashcards | 7,5% | |
| Produção (fala + escrita) | 8,6% do tempo, **17 sessões no ano** | ~2 sessões por mês |
| Dias com flashcards | 32 / 249 (13%) | |
| Maior lacuna | 22 dias; dez lacunas de 5+ dias | Retomar é o ponto de falha |
| Concentração | Top 10 dias = 32% das horas; 7 deles Netflix/audiobook | O mês inteiro cabe em três dias |
| Pico | 8h da manhã · segunda forte · sexta fraca | |

Níveis atuais: **inglês B1.2** (meta B2.2) · **espanhol B1.2** (meta C1) · **francês A0** (meta B2).

**Diagnóstico de produto:** o inimigo não é falta de tempo. São duas coisas:

1. **Consumo passivo disfarçado de estudo.** 76,8% do tempo registrado não move os quatro pilares.
2. **Produção quase inexistente.** 17 sessões de fala/escrita em nove meses.

Um terceiro problema, estrutural: **as lacunas**. Dez interrupções de 5+ dias significam que o app precisa ser tão bom em *retomar* quanto em *manter*.

O que já existe e não resolve: o Toggl mede tempo mas não classifica por pilar, não distingue ativo de passivo, não cobra produção e não sabe o que é uma sexta-feira de pronúncia. O Flashcards Deluxe resolve a revisão mas não sabe se ela criou palavras hoje. Nenhum dos dois conhece o método.

## 3. Princípios de produto

1. **Densidade acima de simplicidade.** Usuária única, especialista no próprio método. Nada de wizard, tour ou tooltip explicando o óbvio. Uma tela pode ter 12 números se os 12 importam.
2. **Registro em menos de 10 segundos ou o registro não acontece.** Todo caminho de entrada de dado é otimizado para velocidade: defaults inteligentes, teclado, cronômetro, um clique para o piso diário.
3. **Passivo nunca vira ativo.** Imersão é contabilizada, exibida e respeitada — e **jamais** somada ao estudo ativo em nenhum número agregado.
4. **O app mede, não gerencia.** Flashcards vivem no Flashcards Deluxe. O deck de gramática vive fora do app. O Excel de criação continua existindo. O app não recria nenhuma dessas ferramentas.
5. **Cobrança é semanal e agregada, nunca acoplada à sessão.** Registrar imersão nunca dispara pedido de produção — boa parte da imersão acontece no trânsito, onde produzir é impossível.
6. **Retomar vale tanto quanto manter.** O modo retomada e suas conquistas têm o mesmo peso visual e o mesmo valor simbólico que uma sequência de 100 dias.
7. **Números são o elemento gráfico mais forte.** Ilustração é acessório; o dígito grande é o produto.
8. **Nenhum alerta que ela não possa resolver hoje.** Alerta sem ação correspondente é ruído; todo semáforo vermelho tem uma tarefa clicável ao lado.

## 4. Persona

**Única usuária.** 26 anos, brasileira, gerente de marketing.

- Estuda inglês, espanhol e francês **em paralelo**, com um idioma-foco rotativo por quadrimestre.
- Já tem método formado e ferramentas escolhidas. Não quer conselho, quer espelho.
- Rotina: pico às 8h da manhã; segunda é o dia mais forte; sexta o mais fraco; trânsito e tarefas domésticas são tempo real de estudo.
- Falha típica: some por 5 a 22 dias e volta com culpa, tentando compensar com maratona de série legendada.
- Dispositivos: desktop (uso principal — registro e análise) e celular (registro rápido e check do piso diário).

Não há segunda persona. Não há administrador, convidado, professor ou comunidade.

## 5. Escopo

### 5.1 Dentro do escopo (v1 completo)

Treze telas — os doze itens da sidebar mais a importação:

| Tela | Função em uma linha |
|---|---|
| Dashboard | Recortes semanal, mensal e anual dos indicadores |
| Hoje | O que a marcha ativa exige hoje + piso diário + semáforo das 6 regras |
| Registro de Estudo | Formulário/cronômetro de sessão em menos de 10 s |
| Tarefas | Automáticas (geradas por regra) e manuais |
| Flashcards | Acompanhamento de deck externo — sem CRUD de cartões |
| Metas | Palavras, nível, conversação e painel mensal |
| Revisão | Tudo em dívida, ordenado por urgência |
| Materiais de Estudo | Um material principal por idioma, com progresso |
| Recursos | Biblioteca de links com tags |
| Planilha de Distribuição | Divisão-alvo por pilar e por idioma, alvo × realizado |
| Conquistas | Catálogo derivado do método |
| Configurações | Idiomas, metas, marchas, camadas, alertas, mapeamento, backup |
| Importação do Toggl | Upload de CSV, mapeamento, deduplicação, recálculo |

Mais os motores transversais: marcha ativa, modo retomada, gerador de tarefas automáticas, checagem de interferência, cálculo de camadas e avaliador de conquistas.

### 5.2 Fora do escopo — explicitamente

Isto não é "depois a gente vê". É **não construir**:

- ❌ **Gerenciador de flashcards.** Sem CRUD de cartões, sem deck dentro do app, sem algoritmo de repetição espaçada, sem fila de revisão, sem TTS, sem sincronização com o Flashcards Deluxe. O app registra *contagens e checks*, não cartões.
- ❌ **Fila de cartões devidos.** Não aparece na tela Revisão nem em lugar nenhum. Ela mora no Flashcards Deluxe.
- ❌ **Qualquer regra que force produção logo após uma sessão de imersão.** Ver `RN-002`.
- ❌ Multiusuário, login, papéis, permissões, convites.
- ❌ Cobrança, planos, trial, onboarding de terceiros.
- ❌ Conteúdo de ensino: lições, exercícios, correção de frases, dicionário embutido, tradutor.
- ❌ Rede social, feed, ranking, comparação com outras pessoas.
- ❌ Integração ao vivo com a API do Toggl. `[DECISÃO: v1 é importação de CSV apenas.]` Justificativa: a importação manual mensal cobre o caso de uso (recalcular histórico) sem custo de credenciais, rate limit e sincronização incremental.
- ❌ Notificação push e e-mail. `[DECISÃO: alertas vivem dentro do app, no badge da sidebar e na tela Hoje.]` Justificativa: PWA sem backend não sustenta push confiável; o hábito-alvo é *abrir o app*, não receber empurrão.
- ❌ Gravação de áudio/vídeo dentro do app. Registra-se que a gravação foi feita, com link opcional.

## 6. Critérios de sucesso

Medidos pelo próprio app, comparando contra a linha de base jan–set 2026.

### 6.1 Primários — o app falhou se estes não moverem

| Indicador | Linha de base | Alvo 3 meses | Alvo 12 meses | Onde é medido |
|---|---|---|---|---|
| Dias com registro no mês | 12 | 20 | 24 | Dashboard mensal |
| % do tempo em estudo ativo | 16% | 35% | 40% | Dashboard, composição |
| Minutos de fala por semana | 13 | 60 | 90 | Dashboard semanal |
| Dias com flashcards por semana | 0,9 | 5 | 5 | Tela Flashcards |
| Maior lacuna do mês (dias) | 14 | 2 | 2 | Dashboard mensal |

### 6.2 Secundários

| Indicador | Linha de base | Alvo 12 meses |
|---|---|---|
| Sessões de produção (fala + escrita) por mês | ~1,9 | 12 |
| Áudios no grupo por mês | não medido | 4 |
| Concentração: % das horas do mês nos 3 maiores dias | ~32% (ano) | ≤ 20% |
| Palavras acumuladas — francês | 0 | 1.500 (camada 1, Viajante) |
| Nível autoavaliado — inglês | B1.2 | B2.1 |

### 6.3 De produto — o app está sendo usado?

| Indicador | Alvo | Como medir |
|---|---|---|
| Tempo mediano para registrar uma sessão | ≤ 10 s | Telemetria local: intervalo entre abrir e salvar o formulário, mediana dos últimos 30 registros, exibida em Configurações → Diagnóstico |
| % de dias com o app aberto | ≥ 80% | Log local de abertura (data, sem hora) |
| % de sessões manuais vs. importadas | ≥ 70% manuais até mar-2027 | Campo `origem` de Sessão |
| Retomadas concluídas / iniciadas | ≥ 70% | Entidade RetomadaProtocolo |

`[DECISÃO: a telemetria é 100% local, gravada no mesmo IndexedDB, sem envio para lugar nenhum.]` Justificativa: usuária única, app local-first; medir o próprio produto não justifica um backend.

## 7. Restrições e premissas

- **Fuso:** America/Sao_Paulo. O dia vai de 00:00 a 23:59 local. `[DECISÃO: sem corte de madrugada — uma sessão às 00:30 conta para o dia novo.]` Justificativa: o pico dela é 8h da manhã; virada de madrugada é caso raro, e comportamento previsível vale mais que a exceção.
- **Semana:** ISO, segunda a domingo. Todos os indicadores semanais usam esse recorte.
- **Offline:** o app funciona 100% sem rede (registro no trânsito, no metrô).
- **Volume:** ordem de 3.000 sessões/ano e 1.000 checks/ano. Cabe folgadamente em IndexedDB; não há problema de escala a resolver.
- **Idiomas ativos na v1:** inglês, espanhol e francês — mas o modelo aceita um quarto sem migração.

## 8. Glossário

| Termo | Definição operacional |
|---|---|
| **Pilar** | Uma de quatro categorias de estudo ativo: vocabulário, gramática, pronúncia, fala |
| **Imersão** | Consumo passivo (série, podcast, audiobook, YouTube, leitura de lazer). **Não é pilar.** |
| **Estudo ativo** | Tempo em sessões de pilar que não sejam a atividade `flashcards` |
| **Piso diário** | Flashcards revisados + pelo menos 1 minuto de fala. Independe da marcha. |
| **Marcha** | Nível de intensidade ativo (1 Sobrevivência, 2 Cruzeiro, 3 Turbo). Define as tarefas do dia. |
| **Tempo do dia** | Cadeira (bloco focado), mãos livres (fila, café), mãos ocupadas (louça, trânsito) |
| **Camada de fluência** | Faixa de vocabulário acumulado: 1.500 / 3.000 / 5.000 / 10.000 / 20.000 |
| **Lote do dia** | Conjunto de palavras novas criadas numa sessão de criação de flashcards |
| **Velocidade A / B** | 2 min por palavra / 1 min por palavra na criação do lote |
| **Bloco do plano** | Quadrimestre com idioma-foco e distribuição própria entre idiomas |
| **Modo retomada** | Estado do app após 7+ dias sem registro; substitui metas por 5 fases |
| **Dia em branco** | Dia sem nenhum registro de nenhum tipo |
| **Ativação de palavra** | Falar 1 a 3 frases em voz alta com a palavra nova, tirando-a da fila "nova" |
| **Card / cartão** | **Sempre** o componente visual de interface (doc 07, 2.3). Nunca um flashcard. |
| **Flashcard** | Cartão de estudo. Vive no Flashcards Deluxe, **fora do app**. O app nunca cria, edita, exibe nem revisa um. |

## 9. Decisões consolidadas

Cada uma aparece em contexto no documento correspondente.

| # | Decisão | Onde |
|---|---|---|
| D1 | Nome "Poliglota" | 01 |
| D2 | Só importação CSV do Toggl na v1, sem API | 01, 02, 04 |
| D3 | Sem push/e-mail; alertas dentro do app | 01, 04 |
| D4 | Telemetria local, nunca enviada | 01, 05 |
| D5 | Dia = 00:00–23:59 local, sem corte de madrugada | 01, 02 |
| D6 | Semana ISO seg–dom | 01, 02 |
| D7 | Divisão-alvo dos pilares: 25 vocab / 25 gram / 20 pron / 30 fala | 02 |
| D8 | Ordem dos percentuais do plano = (francês, espanhol, inglês) | 02 |
| D9 | Duas sequências distintas: streak de registro e streak do piso | 02 |
| D10 | Modo retomada não regride de fase; só pausa | 02 |
| D11 | Regra 5 é aviso confirmável, não bloqueio | 02 |
| D12 | Regra 6 desabilita o campo Instagram fora da marcha 3 | 02 |
| D13 | Stack: Vite + React + TS + Dexie/IndexedDB, sem backend | 05 |
| D14 | Backup automático diário em JSON + exportação manual | 05 |
| D15 | Palavras coladas na checagem de interferência não são persistidas | 02, 03 |
