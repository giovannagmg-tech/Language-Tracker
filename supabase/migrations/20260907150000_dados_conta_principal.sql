-- Dados iniciais da conta principal.
--
-- Por que migração e não seed: o CLI grava o hash de cada arquivo de seed e
-- nunca mais o executa. Como esta rotina depende da conta já existir (ela é
-- criada no primeiro login), o seed rodava cedo demais, não fazia nada e ficava
-- marcado como aplicado para sempre. Migração roda quando eu mando.
--
-- A lógica fica numa função para poder ser chamada de novo a qualquer momento:
--   select public.aplicar_dados_conta_principal('giovannagmg@gmail.com');
-- É idempotente e não toca em nenhuma outra conta.

create or replace function public.aplicar_dados_conta_principal(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  b1 uuid; b2 uuid; b3 uuid; b4 uuid;
  id_en uuid; id_es uuid; id_fr uuid;
  inicio_b1 date := '2026-09-07';
begin
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then
    return format('Conta %s ainda não existe. Faça o login e chame de novo.', p_email);
  end if;

  perform public.bootstrap_usuario(uid);

  select id into id_en from idiomas where user_id = uid and slug = 'ingles';
  select id into id_es from idiomas where user_id = uid and slug = 'espanhol';
  select id into id_fr from idiomas where user_id = uid and slug = 'frances';

  -- Camadas atuais: inglês e espanhol em Conexão. Sem contagem exata informada,
  -- o acumulado começa no piso da camada. Francês do zero, coerente com o A0.
  -- Tudo editável em Configurações, sem migração.
  update idiomas set nivel_inicial = 'B1.2', nivel_atual = 'B1.2', nivel_meta = 'B2.2',
    palavras_base = 3000, meta_palavras_dia = 5, data_meta_nivel = '2027-08-31'
    where id = id_en;
  update idiomas set nivel_inicial = 'B1.2', nivel_atual = 'B1.2', nivel_meta = 'C1.1',
    palavras_base = 3000, meta_palavras_dia = 5, data_meta_nivel = '2027-04-30'
    where id = id_es;
  update idiomas set nivel_inicial = 'A0', nivel_atual = 'A0', nivel_meta = 'B2.1',
    palavras_base = 0, meta_palavras_dia = 10, data_meta_nivel = '2027-12-31'
    where id = id_fr;

  update metas m set valor_alvo = i.meta_palavras_dia
    from idiomas i
    where m.idioma_id = i.id and m.user_id = uid and m.indicador = 'palavras_dia';

  -- Linha de base do diagnóstico Toggl jan–set/2026 (docs/09).
  update metas set valor_base = 12   where user_id = uid and tipo = 'painel_mensal' and indicador = 'dias_registro';
  update metas set valor_base = 0.16 where user_id = uid and tipo = 'painel_mensal' and indicador = 'pct_ativo';
  update metas set valor_base = 13   where user_id = uid and tipo = 'painel_mensal' and indicador = 'min_fala_semana';
  update metas set valor_base = 0.9  where user_id = uid and tipo = 'painel_mensal' and indicador = 'dias_flash_semana';
  update metas set valor_base = 14   where user_id = uid and tipo = 'painel_mensal' and indicador = 'maior_lacuna';

  -- Blocos do plano. Percentuais na ordem (francês, espanhol, inglês).
  insert into blocos_plano (user_id, nome, data_inicio, data_fim, idioma_foco) values
    (uid, 'B1 — francês',  inicio_b1,    '2026-12-31', id_fr),
    (uid, 'B2 — espanhol', '2027-01-01', '2027-04-30', id_es),
    (uid, 'B3 — inglês',   '2027-05-01', '2027-08-31', id_en),
    (uid, 'B4 — francês',  '2027-09-01', '2027-12-31', id_fr)
  on conflict (user_id, nome) do update set
    data_inicio = excluded.data_inicio,
    data_fim = excluded.data_fim,
    idioma_foco = excluded.idioma_foco;

  select id into b1 from blocos_plano where user_id = uid and nome = 'B1 — francês';
  select id into b2 from blocos_plano where user_id = uid and nome = 'B2 — espanhol';
  select id into b3 from blocos_plano where user_id = uid and nome = 'B3 — inglês';
  select id into b4 from blocos_plano where user_id = uid and nome = 'B4 — francês';

  insert into distribuicao_alvo (user_id, bloco_id, dimensao, chave, percentual) values
    (uid, b1, 'idioma', id_fr::text, 60), (uid, b1, 'idioma', id_es::text, 20), (uid, b1, 'idioma', id_en::text, 20),
    (uid, b2, 'idioma', id_fr::text, 25), (uid, b2, 'idioma', id_es::text, 60), (uid, b2, 'idioma', id_en::text, 15),
    (uid, b3, 'idioma', id_fr::text, 25), (uid, b3, 'idioma', id_es::text, 15), (uid, b3, 'idioma', id_en::text, 60),
    (uid, b4, 'idioma', id_fr::text, 60), (uid, b4, 'idioma', id_es::text, 25), (uid, b4, 'idioma', id_en::text, 15)
  on conflict (user_id, coalesce(bloco_id, '00000000-0000-0000-0000-000000000000'::uuid), dimensao, chave)
  do update set percentual = excluded.percentual;

  -- Mapeamento do Toggl (RN-1003), casando com os projetos reais do export.
  delete from regras_mapeamento_toggl where user_id = uid;
  insert into regras_mapeamento_toggl (user_id, ordem, campo, operador, valor, saida_idioma, saida_atividade) values
    (uid, 10, 'project', 'contem', 'Inglês',       id_en, null),
    (uid, 11, 'project', 'contem', 'Ingles',       id_en, null),
    (uid, 12, 'project', 'contem', 'Espanhol',     id_es, null),
    (uid, 13, 'project', 'contem', 'Francês',      id_fr, null),
    (uid, 14, 'project', 'contem', 'Frances',      id_fr, null),
    (uid, 20, 'project', 'contem', 'Imersão',      null,  'serie_filme'),
    (uid, 21, 'project', 'contem', 'Flashcards',   null,  'flashcards'),
    (uid, 22, 'project', 'contem', 'Estudo ativo', null,  'gramatica'),
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

  return format('Dados aplicados na conta %s.', uid);
end;
$$;

-- Só a própria dona chama isso, e só pela migração ou pelo SQL Editor.
revoke execute on function public.aplicar_dados_conta_principal(text) from anon, authenticated;

select public.aplicar_dados_conta_principal('giovannagmg@gmail.com');
