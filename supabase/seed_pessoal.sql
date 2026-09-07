-- Dados pessoais iniciais da conta principal.
-- Roda DEPOIS do primeiro login (o bootstrap já criou a conta vazia).
-- Idempotente. Não afeta nenhuma outra conta — é isso que permite mandar o app
-- para outra pessoa e ela receber a versão sem dados.

do $$
declare
  uid uuid;
  b1 uuid; b2 uuid; b3 uuid; b4 uuid;
  id_en uuid; id_es uuid; id_fr uuid;
  inicio_b1 date := '2026-09-07';
begin
  select id into uid from auth.users where email = 'giovannagmg@gmail.com';
  if uid is null then
    raise notice 'Conta principal ainda não existe. Faça o primeiro login e rode de novo.';
    return;
  end if;

  perform public.bootstrap_usuario(uid);

  select id into id_en from idiomas where user_id = uid and slug = 'ingles';
  select id into id_es from idiomas where user_id = uid and slug = 'espanhol';
  select id into id_fr from idiomas where user_id = uid and slug = 'frances';

  -- Níveis, vocabulário acumulado e meta diária.
  -- Camadas ATUAIS (confirmadas em 07/09/2026): inglês e espanhol em Conexão,
  -- francês em Viajante. Sem contagem exata informada, o acumulado começa no
  -- piso de cada camada — é o menor número compatível com o que ela declarou.
  -- Ajustável em Configurações sem migração.
  update idiomas set nivel_inicial='B1.2', nivel_atual='B1.2', nivel_meta='B2.2',
    palavras_base=3000, meta_palavras_dia=5, data_meta_nivel='2027-08-31'
    where id = id_en;
  update idiomas set nivel_inicial='B1.2', nivel_atual='B1.2', nivel_meta='C1.1',
    palavras_base=3000, meta_palavras_dia=5, data_meta_nivel='2027-04-30'
    where id = id_es;
  update idiomas set nivel_inicial='A0', nivel_atual='A0', nivel_meta='B2.1',
    palavras_base=1500, meta_palavras_dia=10, data_meta_nivel='2027-12-31'
    where id = id_fr;

  update metas m set valor_alvo = i.meta_palavras_dia
    from idiomas i where m.idioma_id = i.id and m.user_id = uid and m.indicador = 'palavras_dia';

  -- Linha de base do diagnóstico Toggl jan–set/2026 (docs/01, seção 2).
  update metas set valor_base = 12   where user_id = uid and indicador = 'dias_registro'      and tipo = 'painel_mensal';
  update metas set valor_base = 0.16 where user_id = uid and indicador = 'pct_ativo'          and tipo = 'painel_mensal';
  update metas set valor_base = 13   where user_id = uid and indicador = 'min_fala_semana'    and tipo = 'painel_mensal';
  update metas set valor_base = 0.9  where user_id = uid and indicador = 'dias_flash_semana'  and tipo = 'painel_mensal';
  update metas set valor_base = 14   where user_id = uid and indicador = 'maior_lacuna'       and tipo = 'painel_mensal';

  -- Blocos do plano. Percentuais na ordem (francês, espanhol, inglês).
  insert into blocos_plano (user_id, nome, data_inicio, data_fim, idioma_foco)
  values (uid, 'B1 — francês', inicio_b1, '2026-12-31', id_fr)
  on conflict do nothing;
  select id into b1 from blocos_plano where user_id = uid and nome = 'B1 — francês';

  insert into blocos_plano (user_id, nome, data_inicio, data_fim, idioma_foco)
  values (uid, 'B2 — espanhol', '2027-01-01', '2027-04-30', id_es)
  on conflict do nothing;
  select id into b2 from blocos_plano where user_id = uid and nome = 'B2 — espanhol';

  insert into blocos_plano (user_id, nome, data_inicio, data_fim, idioma_foco)
  values (uid, 'B3 — inglês', '2027-05-01', '2027-08-31', id_en)
  on conflict do nothing;
  select id into b3 from blocos_plano where user_id = uid and nome = 'B3 — inglês';

  insert into blocos_plano (user_id, nome, data_inicio, data_fim, idioma_foco)
  values (uid, 'B4 — francês', '2027-09-01', '2027-12-31', id_fr)
  on conflict do nothing;
  select id into b4 from blocos_plano where user_id = uid and nome = 'B4 — francês';

  insert into distribuicao_alvo (user_id, bloco_id, dimensao, chave, percentual) values
    (uid, b1, 'idioma', id_fr::text, 60), (uid, b1, 'idioma', id_es::text, 20), (uid, b1, 'idioma', id_en::text, 20),
    (uid, b2, 'idioma', id_fr::text, 25), (uid, b2, 'idioma', id_es::text, 60), (uid, b2, 'idioma', id_en::text, 15),
    (uid, b3, 'idioma', id_fr::text, 25), (uid, b3, 'idioma', id_es::text, 15), (uid, b3, 'idioma', id_en::text, 60),
    (uid, b4, 'idioma', id_fr::text, 60), (uid, b4, 'idioma', id_es::text, 25), (uid, b4, 'idioma', id_en::text, 15)
  on conflict (user_id, coalesce(bloco_id, '00000000-0000-0000-0000-000000000000'::uuid), dimensao, chave)
  do update set percentual = excluded.percentual;

  -- Mapeamento default do Toggl (RN-1003), casando com os projetos reais do export.
  delete from regras_mapeamento_toggl where user_id = uid;
  insert into regras_mapeamento_toggl (user_id, ordem, campo, operador, valor, saida_idioma, saida_atividade) values
    (uid, 10, 'project', 'contem', 'Inglês',    id_en, null),
    (uid, 11, 'project', 'contem', 'Ingles',    id_en, null),
    (uid, 12, 'project', 'contem', 'Espanhol',  id_es, null),
    (uid, 13, 'project', 'contem', 'Francês',   id_fr, null),
    (uid, 14, 'project', 'contem', 'Frances',   id_fr, null),
    (uid, 20, 'project', 'contem', 'Imersão',   null, 'serie_filme'),
    (uid, 21, 'project', 'contem', 'Flashcards',null, 'flashcards'),
    (uid, 22, 'project', 'contem', 'Estudo ativo', null, 'gramatica'),
    (uid, 30, 'description', 'contem', 'flashcard', null, 'flashcards'),
    (uid, 31, 'description', 'contem', 'gramát',    null, 'gramatica'),
    (uid, 32, 'description', 'contem', 'pronún',    null, 'pronuncia'),
    (uid, 33, 'description', 'contem', 'fala',      null, 'fala_sozinha'),
    (uid, 34, 'description', 'contem', 'conversa',  null, 'conversacao'),
    (uid, 35, 'description', 'contem', 'aula',      null, 'aula'),
    (uid, 36, 'description', 'contem', 'escrit',    null, 'escrita'),
    (uid, 37, 'description', 'contem', 'netflix',   null, 'serie_filme'),
    (uid, 38, 'description', 'contem', 'série',     null, 'serie_filme'),
    (uid, 39, 'description', 'contem', 'podcast',   null, 'podcast'),
    (uid, 40, 'description', 'contem', 'audiobook', null, 'audiobook'),
    (uid, 41, 'description', 'contem', 'youtube',   null, 'youtube'),
    (uid, 42, 'description', 'contem', 'leitura',   null, 'leitura');

  raise notice 'Dados pessoais aplicados na conta %', uid;
end $$;
