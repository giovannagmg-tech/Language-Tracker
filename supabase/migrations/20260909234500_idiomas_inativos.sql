-- Italiano e alemão como idiomas **inativos**.
--
-- Ela tem histórico no Toggl nesses dois e quer vê-lo, sem que eles entrem nas
-- metas, no piso ou nas tarefas do dia. `ativo = false` já é exatamente isso:
-- as consultas do dia filtram por `ativo`, mas as sessões continuam gravadas e
-- aparecem no histórico.
--
-- Só para a conta principal: uma amiga que receber o app começa com os três.

create or replace function public.adicionar_idiomas_inativos(alvo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where email = alvo;
  if uid is null then
    raise notice 'Conta % ainda não existe; nada a fazer.', alvo;
    return;
  end if;

  insert into idiomas (user_id, slug, nome, bandeira, cor, ordem, ativo)
  values
    (uid, 'italiano', 'Italiano', '🇮🇹', '#3E8E5A', 4, false),
    (uid, 'alemao',   'Alemão',   '🇩🇪', '#6B6B6B', 5, false)
  on conflict (user_id, slug) do nothing;

  -- Regras de mapeamento do Toggl para os projetos desses dois idiomas.
  -- Ordem 15-16: antes das regras de atividade (20+), como as dos outros.
  insert into regras_mapeamento_toggl
    (user_id, ordem, campo, operador, valor, saida_idioma, saida_atividade)
  select uid, 15, 'project', 'contem', 'Italiano', i.id, null
  from idiomas i where i.user_id = uid and i.slug = 'italiano'
  and not exists (
    select 1 from regras_mapeamento_toggl r
    where r.user_id = uid and r.campo = 'project' and r.valor = 'Italiano'
  );

  insert into regras_mapeamento_toggl
    (user_id, ordem, campo, operador, valor, saida_idioma, saida_atividade)
  select uid, 16, 'project', 'contem', 'Alemão', i.id, null
  from idiomas i where i.user_id = uid and i.slug = 'alemao'
  and not exists (
    select 1 from regras_mapeamento_toggl r
    where r.user_id = uid and r.campo = 'project' and r.valor = 'Alemão'
  );
end $$;

select public.adicionar_idiomas_inativos('giovannagmg@gmail.com');
