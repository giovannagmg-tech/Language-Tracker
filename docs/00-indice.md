# Poliglota — Documentação do produto

App web pessoal de gestão de estudos de idiomas. Usuária única. Inglês, espanhol e francês.

| # | Documento | O que resolve |
|---|---|---|
| 01 | [PRD](01-prd.md) | Visão, problema, princípios, escopo, critérios de sucesso |
| 02 | [Regras de negócio](02-regras-de-negocio.md) | O método traduzido em regras computáveis + matemática dos indicadores |
| 03 | [Modelo de dados](03-modelo-de-dados.md) | Entidades, campos, tipos, relações, índices |
| 04 | [Especificação de telas](04-especificacao-de-telas.md) | As 13 telas: componentes, estados, interações, atalhos, responsivo |
| 05 | [Arquitetura](05-arquitetura.md) | Stack, pastas, persistência, backup, por que sem backend |
| 06 | [Conquistas](06-conquistas.md) | Catálogo completo com critério computável |
| 07 | [Design system](07-design-system.md) | Tokens, componentes, regras de cor |
| 08 | [Roadmap](08-roadmap.md) | Fases entregáveis + pontos confirmados |
| 09 | [Linha de base 2026](09-linha-de-base-2026.md) | O export real do Toggl — critério de aceitação dos indicadores |

**Ordem de leitura para quem vai construir:** 01 → 02 → 03 → 05 → 04 → 07 → 06 → 08.

**Convenções da documentação**
- `[DECISÃO: ...]` marca uma escolha feita pelo autor da documentação por falta de informação explícita. Vem sempre com uma linha de justificativa. Nenhuma delas bloqueia a implementação.
- Toda regra tem ID (`RN-nnn`), gatilho, condição, ação e mensagem ao usuário.
- Datas de exemplo assumem **hoje = 2026-09-07** (bloco vigente do plano: set–dez 2026, foco francês).
