-- Conta nova precisa nascer com a cor certa. A migração inicial não pode ser
-- editada depois de aplicada (CLAUDE.md, regra 5), então a função é
-- substituída inteira aqui — idêntica à original, com uma cor trocada:
-- espanhol de #E4A11B (contraste 2,23 no claro) para #C08A12 (3,05), que é o
-- valor que o docs/07 sempre especificou.

create or replace function public.bootstrap_usuario(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from config where user_id = uid) then
    return;
  end if;

  insert into config (user_id) values (uid);

  insert into idiomas (user_id, slug, nome, bandeira, cor, ordem)
  values
    (uid, 'ingles',   'Inglês',   '🇺🇸', '#2F6FED', 1),
    (uid, 'espanhol', 'Espanhol', '🇪🇸', '#C08A12', 2),
    (uid, 'frances',  'Francês',  '🇫🇷', '#D14D5A', 3);

  insert into camadas (user_id, numero, nome, limiar) values
    (uid, 1, 'Viajante',  1500),
    (uid, 2, 'Conexão',   3000),
    (uid, 3, 'Negócios',  5000),
    (uid, 4, 'Acadêmico', 10000),
    (uid, 5, 'Maestria',  20000);

  insert into marchas_def (user_id, numero, nome, descricao, tarefas) values
    (uid, 1, 'Sobrevivência', '~15 min/dia', '[
      {"chave":"flashcards","titulo":"Revisar flashcards","dias_semana":[1,2,3,4,5,6,7],"escopo":"dia","criterio":{"tipo":"check_flashcards"},"opcional":false},
      {"chave":"fala_1min","titulo":"1 minuto de fala","dias_semana":[1,2,3,4,5,6,7],"escopo":"dia","criterio":{"tipo":"minutos_fala","min":1},"opcional":false},
      {"chave":"imersao_maos_ocupadas","titulo":"Imersão de mãos ocupadas","dias_semana":[1,2,3,4,5,6,7],"escopo":"dia","criterio":{"tipo":"minutos_categoria_tempo","categoria":"imersao","tempo":"maos_ocupadas","min":1},"opcional":false}
    ]'::jsonb),
    (uid, 2, 'Cruzeiro', '~5 h/semana', '[
      {"chave":"bloco_manha","titulo":"Bloco de 40 min pela manhã","dias_semana":[1,2,3,4],"escopo":"dia","criterio":{"tipo":"minutos_categoria_tempo","categoria":"ativo","tempo":"cadeira","min":40},"opcional":false},
      {"chave":"clube","titulo":"Clube de conversação","dias_semana":[],"escopo":"semana","criterio":{"tipo":"sessao_atividade","atividade":"conversacao","min":1},"opcional":false},
      {"chave":"audio_grupo","titulo":"1 áudio no grupo","dias_semana":[],"escopo":"semana","criterio":{"tipo":"sessao_atividade","atividade":"audio_grupo","min":1},"opcional":false},
      {"chave":"sexta_pronuncia","titulo":"Sexta de pronúncia (25 min)","dias_semana":[5],"escopo":"dia","criterio":{"tipo":"minutos_pilar","pilar":"pronuncia","min":25},"opcional":false}
    ]'::jsonb),
    (uid, 3, 'Turbo', '8–10 h/semana', '[
      {"chave":"aula_extra","titulo":"Aula particular ou conversação extra","dias_semana":[],"escopo":"semana","criterio":{"tipo":"sessao_atividade","atividade":"aula","min":1},"opcional":false},
      {"chave":"sabado_escrita","titulo":"Bloco de sábado: revisão + escrita","dias_semana":[6],"escopo":"dia","criterio":{"tipo":"sessao_atividade","atividade":"escrita","min":1},"opcional":false},
      {"chave":"instagram","titulo":"Conteúdo no Instagram","dias_semana":[],"escopo":"semana","criterio":{"tipo":"sessao_atividade","atividade":"conteudo_instagram","min":1},"opcional":true}
    ]'::jsonb);

  insert into marcha_historico (user_id, numero, data_inicio)
  values (uid, 1, (now() at time zone 'America/Sao_Paulo')::date);

  -- divisão-alvo global dos pilares (docs/02, RN-703)
  insert into distribuicao_alvo (user_id, bloco_id, dimensao, chave, percentual) values
    (uid, null, 'pilar', 'vocabulario', 25),
    (uid, null, 'pilar', 'gramatica',   25),
    (uid, null, 'pilar', 'pronuncia',   20),
    (uid, null, 'pilar', 'fala',        30);

  -- os cinco indicadores do painel mensal (RN-507)
  insert into metas (user_id, tipo, titulo, indicador, valor_base, valor_alvo, direcao, periodicidade, cor) values
    (uid, 'painel_mensal', 'Dias com registro',        'dias_registro',      0, 20, 'maior_melhor', 'mes',    'mensal'),
    (uid, 'painel_mensal', 'Tempo em estudo ativo',    'pct_ativo',          0, 0.35, 'maior_melhor', 'mes',  'mensal'),
    (uid, 'painel_mensal', 'Minutos de fala por semana','min_fala_semana',   0, 60, 'maior_melhor', 'semana', 'mensal'),
    (uid, 'painel_mensal', 'Dias com flashcards',      'dias_flash_semana',  0, 5,  'maior_melhor', 'semana', 'mensal'),
    (uid, 'painel_mensal', 'Maior lacuna do mês',      'maior_lacuna',      30, 2,  'menor_melhor', 'mes',    'mensal');

  -- metas por idioma
  insert into metas (user_id, tipo, idioma_id, titulo, indicador, valor_alvo, periodicidade, cor)
  select uid, 'palavras', i.id, 'Palavras novas por dia — ' || i.nome, 'palavras_dia', i.meta_palavras_dia, 'dia', 'longo_prazo'
  from idiomas i where i.user_id = uid;

  insert into metas (user_id, tipo, idioma_id, titulo, indicador, valor_alvo, periodicidade, cor)
  select uid, 'nivel', i.id, 'Nível — ' || i.nome, 'nivel', 1, 'bloco', 'longo_prazo'
  from idiomas i where i.user_id = uid;

  insert into metas (user_id, tipo, titulo, indicador, valor_alvo, periodicidade, cor) values
    (uid, 'conversacao', 'Conversações por semana',   'conversas_semana', 1,  'semana', 'semanal'),
    (uid, 'conversacao', 'Minutos de fala por semana','min_fala_semana',  60, 'semana', 'semanal'),
    (uid, 'conversacao', 'Áudio no grupo',            'audio_semana',     1,  'semana', 'semanal');

  perform public.sincronizar_conquistas(uid);
end;
$$;
