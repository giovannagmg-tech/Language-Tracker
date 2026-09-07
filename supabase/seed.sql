-- Catálogo global de conquistas — docs/06-conquistas.md
-- Não depende de usuário: o estado por pessoa nasce em bootstrap_usuario().
-- Idempotente: pode rodar quantas vezes quiser.

insert into conquistas (codigo, nome, categoria, criterio_texto, criterio_chave, parametros, escopo, repetivel, janela_repeticao, ordem) values
-- Consistência
('CON-01','Sete','consistencia','7 dias seguidos com registro','streak_registro','{"dias":7}','global',false,null,101),
('CON-02','Quinze','consistencia','14 dias seguidos com registro','streak_registro','{"dias":14}','global',false,null,102),
('CON-03','Um mês inteiro','consistencia','30 dias seguidos com registro','streak_registro','{"dias":30}','global',false,null,103),
('CON-04','Sessenta','consistencia','60 dias seguidos com registro','streak_registro','{"dias":60}','global',false,null,104),
('CON-05','Cem','consistencia','100 dias seguidos com registro','streak_registro','{"dias":100}','global',false,null,105),
('CON-06','Mês sem buraco','consistencia','Um mês civil com maior lacuna de até 2 dias','mes_lacuna_maxima','{"max":2}','global',true,'mensal',106),
('CON-07','Trimestre inteiro','consistencia','90 dias sem nunca ter dois dias em branco seguidos','sem_dois_em_branco','{"dias":90}','global',false,null,107),
('CON-08','Piso de sete','consistencia','7 dias seguidos cumprindo flashcards + 1 min de fala','streak_piso','{"dias":7}','global',false,null,108),
('CON-09','Piso de trinta','consistencia','30 dias seguidos cumprindo o piso','streak_piso','{"dias":30}','global',false,null,109),
('CON-10','Vinte no mês','consistencia','20 dias com registro num mês civil','dias_registro_mes','{"dias":20}','global',true,'mensal',110),
('CON-11','A sexta virou dia','consistencia','4 sextas-feiras seguidas com registro','dia_semana_seguido','{"dia":5,"vezes":4}','global',true,'sequencia',111),
-- Camadas
('CAM-01','Viajante','camada','1.500 palavras acumuladas','camada_atingida','{"camada":1}','por_idioma',false,null,201),
('CAM-02','Conexão','camada','3.000 palavras acumuladas','camada_atingida','{"camada":2}','por_idioma',false,null,202),
('CAM-03','Negócios','camada','5.000 palavras acumuladas','camada_atingida','{"camada":3}','por_idioma',false,null,203),
('CAM-04','Acadêmico','camada','10.000 palavras acumuladas','camada_atingida','{"camada":4}','por_idioma',false,null,204),
('CAM-05','Maestria','camada','20.000 palavras acumuladas','camada_atingida','{"camada":5}','por_idioma',false,null,205),
('CAM-06','Três passaportes','camada','Todos os idiomas na camada 1 ou acima','todos_idiomas_camada','{"camada":1}','global',false,null,206),
('CAM-07','Mil no ano','camada','1.000 palavras novas num ano civil','palavras_no_ano','{"palavras":1000}','por_idioma',true,'anual',207),
-- Produção
('PRO-01','Abriu a boca','producao','Primeira conversação do mês','conversas_no_mes','{"n":1}','global',true,'mensal',301),
('PRO-02','Uma hora falando','producao','60 minutos de fala numa semana','fala_na_semana','{"min":60}','global',true,'semanal',302),
('PRO-03','Noventa','producao','90 minutos de fala numa semana','fala_na_semana','{"min":90}','global',true,'semanal',303),
('PRO-04','Dez áudios','producao','10 áudios no grupo, acumulados','audios_acumulados','{"n":10}','global',false,null,304),
('PRO-05','Trinta áudios','producao','30 áudios no grupo, acumulados','audios_acumulados','{"n":30}','global',false,null,305),
('PRO-06','Primeiro vídeo','producao','Uma gravação de produção feita','videos_acumulados','{"n":1}','global',false,null,306),
('PRO-07','Mês ativo','producao','35% do tempo do mês em estudo ativo','pct_ativo_mes','{"pct":0.35}','global',true,'mensal',307),
('PRO-08','Metade e metade','producao','50% do tempo do mês em estudo ativo','pct_ativo_mes','{"pct":0.5}','global',true,'mensal',308),
('PRO-09','Doze produções','producao','12 sessões de produção num mês','sessoes_producao_mes','{"n":12}','global',true,'mensal',309),
('PRO-10','Quatro semanas de sessenta','producao','4 semanas seguidas com 60+ min de fala','semanas_fala_seguidas','{"min":60,"semanas":4}','global',true,'sequencia',310),
('PRO-11','Aula marcada, aula feita','producao','Primeira sessão paga concluída','aulas_acumuladas','{"n":1}','global',false,null,311),
('PRO-12','Trilíngue na mesma semana','producao','Falar em todos os idiomas na mesma semana','fala_todos_idiomas_semana','{"min_por_idioma":1}','global',true,'semanal',312),
('PRO-13','Sábado de escrita','producao','4 sábados com sessão de escrita','sabados_escrita','{"n":4}','global',true,'sequencia',313),
-- Método
('MET-01','Semana de flashcards','metodo','7 dias seguidos com flashcards','streak_flashcards','{"dias":7}','global',false,null,401),
('MET-02','Mês de flashcards','metodo','20 dias com flashcards num mês','dias_flashcards_mes','{"dias":20}','global',true,'mensal',402),
('MET-03','Velocidade B','metodo','Um lote de 10+ palavras a 1 min/palavra ou menos','velocidade_lote','{"min_por_palavra":1.0,"palavras_min":10}','por_idioma',false,null,403),
('MET-04','Mês limpo','metodo','Um mês civil sem gramática e pronúncia no mesmo dia','mes_sem_violar_regra5','{}','global',true,'mensal',404),
('MET-05','Quatro sextas de pronúncia','metodo','4 sextas seguidas com 25+ min de pronúncia','sextas_pronuncia','{"min":25,"vezes":4}','global',true,'sequencia',405),
('MET-06','Lote conferido','metodo','10 checagens de interferência rodadas','checagens_acumuladas','{"n":10}','global',false,null,406),
('MET-07','Lote limpo cinco vezes','metodo','5 lotes seguidos sem nenhum aviso de interferência','lotes_limpos_seguidos','{"n":5}','global',true,'sequencia',407),
('MET-08','Fila zerada','metodo','7 dias seguidos sem palavra pendente de ativação','sem_pendentes_ativacao','{"dias":7}','global',true,'sequencia',408),
('MET-09','Tempo que não existia','metodo','20 dias no mês com estudo de mãos ocupadas','dias_tempo_mes','{"tempo":"maos_ocupadas","dias":20}','global',true,'mensal',409),
('MET-10','Os três tempos','metodo','Cadeira, mãos livres e mãos ocupadas no mesmo dia','tres_tempos_no_dia','{}','global',true,'semanal',410),
('MET-11','Distribuição no alvo','metodo','Um mês com os quatro pilares dentro de 5 pontos do alvo','pilares_no_alvo_mes','{"tolerancia":0.05}','global',true,'mensal',411),
('MET-12','Erro que virou frase','metodo','10 tarefas de correção concluídas no prazo','correcoes_no_prazo','{"n":10}','global',false,null,412),
('MET-13','Material andando','metodo','10 unidades avançadas no material principal num mês','avanco_material_mes','{"n":10}','por_idioma',true,'mensal',413),
('MET-14','Fechou o bloco','metodo','Autoavaliação de todos os idiomas no fim de um bloco','autoavaliacao_bloco_completa','{}','global',true,'bloco',414),
('MET-15','Turbo por um mês','metodo','Marcha 3 ativa por 30 dias seguidos','marcha_seguida','{"marcha":3,"dias":30}','global',true,'sequencia',415),
-- Recuperação
('REC-01','Voltou inteira','recuperacao','Concluir as cinco fases do protocolo de retomada','retomada_concluida','{}','global',true,'retomada',501),
('REC-02','Volta rápida','recuperacao','Concluir a retomada em 12 dias ou menos','retomada_rapida','{"dias":12}','global',true,'retomada',502),
('REC-03','Nunca mais 22','recuperacao','Seis meses sem nenhuma lacuna maior que 7 dias','sem_lacuna_grande','{"dias_janela":180,"lacuna_max":7}','global',false,null,503),
('REC-04','Duas voltas','recuperacao','Concluir duas retomadas','retomadas_acumuladas','{"n":2}','global',false,null,504),
('REC-05','O minuto que salvou','recuperacao','10 dias salvos pelo botão de 1 minuto da regra 1','dias_salvos_regra1','{"n":10}','global',false,null,505)
on conflict (codigo) do update set
  nome = excluded.nome,
  categoria = excluded.categoria,
  criterio_texto = excluded.criterio_texto,
  criterio_chave = excluded.criterio_chave,
  parametros = excluded.parametros,
  escopo = excluded.escopo,
  repetivel = excluded.repetivel,
  janela_repeticao = excluded.janela_repeticao,
  ordem = excluded.ordem;

-- Se já existem contas, garante que elas recebam as conquistas novas do catálogo.
select public.sincronizar_conquistas(id) from auth.users;
