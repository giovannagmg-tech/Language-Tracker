export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      autoavaliacoes: {
        Row: {
          bloco_id: string
          criado_em: string
          data: string
          id: string
          idioma_id: string
          nivel_anterior: Database["public"]["Enums"]["nivel"]
          nivel_declarado: Database["public"]["Enums"]["nivel"]
          observacao: string | null
          pontos_fortes: string | null
          pontos_fracos: string | null
          user_id: string
        }
        Insert: {
          bloco_id: string
          criado_em?: string
          data: string
          id?: string
          idioma_id: string
          nivel_anterior: Database["public"]["Enums"]["nivel"]
          nivel_declarado: Database["public"]["Enums"]["nivel"]
          observacao?: string | null
          pontos_fortes?: string | null
          pontos_fracos?: string | null
          user_id: string
        }
        Update: {
          bloco_id?: string
          criado_em?: string
          data?: string
          id?: string
          idioma_id?: string
          nivel_anterior?: Database["public"]["Enums"]["nivel"]
          nivel_declarado?: Database["public"]["Enums"]["nivel"]
          observacao?: string | null
          pontos_fortes?: string | null
          pontos_fracos?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autoavaliacoes_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos_plano"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autoavaliacoes_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
        ]
      }
      blocos_plano: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_fim: string
          data_inicio: string
          foco_mes_idioma: string | null
          foco_mes_nota: string | null
          foco_mes_pilar: Database["public"]["Enums"]["pilar"] | null
          id: string
          idioma_foco: string | null
          nome: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_fim: string
          data_inicio: string
          foco_mes_idioma?: string | null
          foco_mes_nota?: string | null
          foco_mes_pilar?: Database["public"]["Enums"]["pilar"] | null
          id?: string
          idioma_foco?: string | null
          nome: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_fim?: string
          data_inicio?: string
          foco_mes_idioma?: string | null
          foco_mes_nota?: string | null
          foco_mes_pilar?: Database["public"]["Enums"]["pilar"] | null
          id?: string
          idioma_foco?: string | null
          nome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocos_plano_foco_mes_idioma_fkey"
            columns: ["foco_mes_idioma"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocos_plano_idioma_foco_fkey"
            columns: ["idioma_foco"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
        ]
      }
      camadas: {
        Row: {
          id: string
          limiar: number
          nome: string
          numero: number
          user_id: string
        }
        Insert: {
          id?: string
          limiar: number
          nome: string
          numero: number
          user_id: string
        }
        Update: {
          id?: string
          limiar?: number
          nome?: string
          numero?: number
          user_id?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          atualizado_em: string
          backup_automatico: boolean
          backup_ultimo_em: string | null
          criado_em: string
          dias_para_retomada: number
          faixas_frequencia: Json
          hora_aperto: number
          lacuna_alerta: number
          limiar_concentracao: number
          limiar_desvio_pilar: number
          lote_minimo_checagem: number
          meta_dias_flash_semana: number
          meta_min_fala_semana: number
          meta_pct_ativo: number
          tema: Database["public"]["Enums"]["tema_app"]
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          backup_automatico?: boolean
          backup_ultimo_em?: string | null
          criado_em?: string
          dias_para_retomada?: number
          faixas_frequencia?: Json
          hora_aperto?: number
          lacuna_alerta?: number
          limiar_concentracao?: number
          limiar_desvio_pilar?: number
          lote_minimo_checagem?: number
          meta_dias_flash_semana?: number
          meta_min_fala_semana?: number
          meta_pct_ativo?: number
          tema?: Database["public"]["Enums"]["tema_app"]
          user_id: string
        }
        Update: {
          atualizado_em?: string
          backup_automatico?: boolean
          backup_ultimo_em?: string | null
          criado_em?: string
          dias_para_retomada?: number
          faixas_frequencia?: Json
          hora_aperto?: number
          lacuna_alerta?: number
          limiar_concentracao?: number
          limiar_desvio_pilar?: number
          lote_minimo_checagem?: number
          meta_dias_flash_semana?: number
          meta_min_fala_semana?: number
          meta_pct_ativo?: number
          tema?: Database["public"]["Enums"]["tema_app"]
          user_id?: string
        }
        Relationships: []
      }
      conquista_estado: {
        Row: {
          conquista_codigo: string
          conquistada_em: string | null
          estado: Database["public"]["Enums"]["estado_conquista"]
          id: string
          idioma_id: string | null
          progresso_alvo: number
          progresso_atual: number
          ultima_avaliacao_em: string | null
          user_id: string
          vezes: number
        }
        Insert: {
          conquista_codigo: string
          conquistada_em?: string | null
          estado?: Database["public"]["Enums"]["estado_conquista"]
          id?: string
          idioma_id?: string | null
          progresso_alvo?: number
          progresso_atual?: number
          ultima_avaliacao_em?: string | null
          user_id: string
          vezes?: number
        }
        Update: {
          conquista_codigo?: string
          conquistada_em?: string | null
          estado?: Database["public"]["Enums"]["estado_conquista"]
          id?: string
          idioma_id?: string | null
          progresso_alvo?: number
          progresso_atual?: number
          ultima_avaliacao_em?: string | null
          user_id?: string
          vezes?: number
        }
        Relationships: [
          {
            foreignKeyName: "conquista_estado_conquista_codigo_fkey"
            columns: ["conquista_codigo"]
            isOneToOne: false
            referencedRelation: "conquistas"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "conquista_estado_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
        ]
      }
      conquistas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_conquista"]
          codigo: string
          criterio_chave: string
          criterio_texto: string
          escopo: Database["public"]["Enums"]["escopo_conquista"]
          janela_repeticao: string | null
          nome: string
          ordem: number
          parametros: Json
          repetivel: boolean
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_conquista"]
          codigo: string
          criterio_chave: string
          criterio_texto: string
          escopo?: Database["public"]["Enums"]["escopo_conquista"]
          janela_repeticao?: string | null
          nome: string
          ordem?: number
          parametros?: Json
          repetivel?: boolean
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_conquista"]
          codigo?: string
          criterio_chave?: string
          criterio_texto?: string
          escopo?: Database["public"]["Enums"]["escopo_conquista"]
          janela_repeticao?: string | null
          nome?: string
          ordem?: number
          parametros?: Json
          repetivel?: boolean
        }
        Relationships: []
      }
      distribuicao_alvo: {
        Row: {
          atualizado_em: string
          bloco_id: string | null
          chave: string
          dimensao: Database["public"]["Enums"]["dimensao_distribuicao"]
          id: string
          percentual: number
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          bloco_id?: string | null
          chave: string
          dimensao: Database["public"]["Enums"]["dimensao_distribuicao"]
          id?: string
          percentual: number
          user_id: string
        }
        Update: {
          atualizado_em?: string
          bloco_id?: string | null
          chave?: string
          dimensao?: Database["public"]["Enums"]["dimensao_distribuicao"]
          id?: string
          percentual?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribuicao_alvo_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos_plano"
            referencedColumns: ["id"]
          },
        ]
      }
      idiomas: {
        Row: {
          ativo: boolean
          atualizado_em: string
          bandeira: string
          cor: string
          criado_em: string
          data_meta_nivel: string | null
          id: string
          meta_palavras_dia: number
          nivel_atual: Database["public"]["Enums"]["nivel"]
          nivel_inicial: Database["public"]["Enums"]["nivel"]
          nivel_meta: Database["public"]["Enums"]["nivel"]
          nome: string
          ordem: number
          palavras_base: number
          slug: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          bandeira?: string
          cor?: string
          criado_em?: string
          data_meta_nivel?: string | null
          id?: string
          meta_palavras_dia?: number
          nivel_atual?: Database["public"]["Enums"]["nivel"]
          nivel_inicial?: Database["public"]["Enums"]["nivel"]
          nivel_meta?: Database["public"]["Enums"]["nivel"]
          nome: string
          ordem?: number
          palavras_base?: number
          slug: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          bandeira?: string
          cor?: string
          criado_em?: string
          data_meta_nivel?: string | null
          id?: string
          meta_palavras_dia?: number
          nivel_atual?: Database["public"]["Enums"]["nivel"]
          nivel_inicial?: Database["public"]["Enums"]["nivel"]
          nivel_meta?: Database["public"]["Enums"]["nivel"]
          nome?: string
          ordem?: number
          palavras_base?: number
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      log_abertura_app: {
        Row: {
          aberturas: number
          data: string
          user_id: string
        }
        Insert: {
          aberturas?: number
          data: string
          user_id: string
        }
        Update: {
          aberturas?: number
          data?: string
          user_id?: string
        }
        Relationships: []
      }
      lotes_importacao: {
        Row: {
          arquivo_nome: string
          conflitos: number
          desfeito_em: string | null
          id: string
          ignoradas: number
          importadas: number
          importado_em: string
          intervalo_fim: string | null
          intervalo_inicio: string | null
          linhas_total: number
          revisadas_manualmente: number
          user_id: string
        }
        Insert: {
          arquivo_nome: string
          conflitos?: number
          desfeito_em?: string | null
          id?: string
          ignoradas?: number
          importadas?: number
          importado_em?: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          linhas_total?: number
          revisadas_manualmente?: number
          user_id: string
        }
        Update: {
          arquivo_nome?: string
          conflitos?: number
          desfeito_em?: string | null
          id?: string
          ignoradas?: number
          importadas?: number
          importado_em?: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          linhas_total?: number
          revisadas_manualmente?: number
          user_id?: string
        }
        Relationships: []
      }
      marcha_historico: {
        Row: {
          criado_em: string
          data_fim: string | null
          data_inicio: string
          id: string
          motivo: string | null
          numero: number
          user_id: string
        }
        Insert: {
          criado_em?: string
          data_fim?: string | null
          data_inicio: string
          id?: string
          motivo?: string | null
          numero: number
          user_id: string
        }
        Update: {
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          motivo?: string | null
          numero?: number
          user_id?: string
        }
        Relationships: []
      }
      marchas_def: {
        Row: {
          descricao: string
          id: string
          nome: string
          numero: number
          tarefas: Json
          user_id: string
        }
        Insert: {
          descricao?: string
          id?: string
          nome: string
          numero: number
          tarefas?: Json
          user_id: string
        }
        Update: {
          descricao?: string
          id?: string
          nome?: string
          numero?: number
          tarefas?: Json
          user_id?: string
        }
        Relationships: []
      }
      materiais: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          idioma_id: string
          nota: string | null
          posicao_atual: number
          principal: boolean
          tipo: Database["public"]["Enums"]["tipo_material"]
          titulo: string
          total: number | null
          ultima_sessao_em: string | null
          unidade: string
          url: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          idioma_id: string
          nota?: string | null
          posicao_atual?: number
          principal?: boolean
          tipo?: Database["public"]["Enums"]["tipo_material"]
          titulo: string
          total?: number | null
          ultima_sessao_em?: string | null
          unidade?: string
          url?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          idioma_id?: string
          nota?: string | null
          posicao_atual?: number
          principal?: boolean
          tipo?: Database["public"]["Enums"]["tipo_material"]
          titulo?: string
          total?: number | null
          ultima_sessao_em?: string | null
          unidade?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
        ]
      }
      material_progresso: {
        Row: {
          criado_em: string
          data: string
          id: string
          material_id: string
          posicao: number
          user_id: string
        }
        Insert: {
          criado_em?: string
          data: string
          id?: string
          material_id: string
          posicao: number
          user_id: string
        }
        Update: {
          criado_em?: string
          data?: string
          id?: string
          material_id?: string
          posicao?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_progresso_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          ativa: boolean
          atualizado_em: string
          cor: Database["public"]["Enums"]["cor_meta"]
          criado_em: string
          data_alvo: string | null
          direcao: Database["public"]["Enums"]["direcao_meta"]
          id: string
          idioma_id: string | null
          indicador: string
          periodicidade: Database["public"]["Enums"]["periodicidade_meta"]
          tipo: Database["public"]["Enums"]["tipo_meta"]
          titulo: string
          user_id: string
          valor_alvo: number
          valor_base: number
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          cor?: Database["public"]["Enums"]["cor_meta"]
          criado_em?: string
          data_alvo?: string | null
          direcao?: Database["public"]["Enums"]["direcao_meta"]
          id?: string
          idioma_id?: string | null
          indicador: string
          periodicidade: Database["public"]["Enums"]["periodicidade_meta"]
          tipo: Database["public"]["Enums"]["tipo_meta"]
          titulo: string
          user_id: string
          valor_alvo: number
          valor_base?: number
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          cor?: Database["public"]["Enums"]["cor_meta"]
          criado_em?: string
          data_alvo?: string | null
          direcao?: Database["public"]["Enums"]["direcao_meta"]
          id?: string
          idioma_id?: string | null
          indicador?: string
          periodicidade?: Database["public"]["Enums"]["periodicidade_meta"]
          tipo?: Database["public"]["Enums"]["tipo_meta"]
          titulo?: string
          user_id?: string
          valor_alvo?: number
          valor_base?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_livres: {
        Row: {
          alvo: number
          ativa: boolean
          atualizado_em: string
          concluida_em: string | null
          criado_em: string
          feito: number
          id: string
          idioma_id: string | null
          nota: string | null
          prazo: string | null
          titulo: string
          unidade: string
          user_id: string
        }
        Insert: {
          alvo: number
          ativa?: boolean
          atualizado_em?: string
          concluida_em?: string | null
          criado_em?: string
          feito?: number
          id?: string
          idioma_id?: string | null
          nota?: string | null
          prazo?: string | null
          titulo: string
          unidade?: string
          user_id: string
        }
        Update: {
          alvo?: number
          ativa?: boolean
          atualizado_em?: string
          concluida_em?: string | null
          criado_em?: string
          feito?: number
          id?: string
          idioma_id?: string | null
          nota?: string | null
          prazo?: string | null
          titulo?: string
          unidade?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_livres_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_gramaticais: {
        Row: {
          atualizado_em: string
          criado_em: string
          estado: Database["public"]["Enums"]["estado_ponto"]
          estudado_em: string
          frases_exigidas: number
          frases_feitas: number
          id: string
          idioma_id: string
          marcado_errei_em: string | null
          material_id: string | null
          titulo: string
          ultima_revisao_em: string | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          estado?: Database["public"]["Enums"]["estado_ponto"]
          estudado_em: string
          frases_exigidas?: number
          frases_feitas?: number
          id?: string
          idioma_id: string
          marcado_errei_em?: string | null
          material_id?: string | null
          titulo: string
          ultima_revisao_em?: string | null
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          estado?: Database["public"]["Enums"]["estado_ponto"]
          estudado_em?: string
          frases_exigidas?: number
          frases_feitas?: number
          id?: string
          idioma_id?: string
          marcado_errei_em?: string | null
          material_id?: string | null
          titulo?: string
          ultima_revisao_em?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_gramaticais_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_material_fk"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos: {
        Row: {
          atualizado_em: string
          criado_em: string
          favorito: boolean
          id: string
          idiomas: string[]
          nota: string | null
          pilares: Database["public"]["Enums"]["pilar"][]
          tipo: Database["public"]["Enums"]["tipo_recurso"]
          titulo: string
          ultimo_acesso_em: string | null
          url: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          favorito?: boolean
          id?: string
          idiomas?: string[]
          nota?: string | null
          pilares?: Database["public"]["Enums"]["pilar"][]
          tipo?: Database["public"]["Enums"]["tipo_recurso"]
          titulo: string
          ultimo_acesso_em?: string | null
          url: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          favorito?: boolean
          id?: string
          idiomas?: string[]
          nota?: string | null
          pilares?: Database["public"]["Enums"]["pilar"][]
          tipo?: Database["public"]["Enums"]["tipo_recurso"]
          titulo?: string
          ultimo_acesso_em?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      registros_vocabulario: {
        Row: {
          atualizado_em: string
          checagem_rodada: boolean
          criado_em: string
          data: string
          faixa_velocidade: string | null
          id: string
          idioma_id: string
          min_por_palavra: number | null
          minutos_criacao: number | null
          palavras_ativadas: number
          palavras_novas: number
          qtd_avisos_interferencia: number
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          checagem_rodada?: boolean
          criado_em?: string
          data: string
          faixa_velocidade?: string | null
          id?: string
          idioma_id: string
          min_por_palavra?: number | null
          minutos_criacao?: number | null
          palavras_ativadas?: number
          palavras_novas?: number
          qtd_avisos_interferencia?: number
          user_id: string
        }
        Update: {
          atualizado_em?: string
          checagem_rodada?: boolean
          criado_em?: string
          data?: string
          faixa_velocidade?: string | null
          id?: string
          idioma_id?: string
          min_por_palavra?: number | null
          minutos_criacao?: number | null
          palavras_ativadas?: number
          palavras_novas?: number
          qtd_avisos_interferencia?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_vocabulario_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_mapeamento_toggl: {
        Row: {
          ativa: boolean
          campo: Database["public"]["Enums"]["campo_regra_toggl"]
          criado_em: string
          id: string
          operador: Database["public"]["Enums"]["operador_regra_toggl"]
          ordem: number
          saida_atividade: Database["public"]["Enums"]["atividade"] | null
          saida_idioma: string | null
          saida_pilar: Database["public"]["Enums"]["pilar"] | null
          saida_tempo: Database["public"]["Enums"]["tempo_do_dia"] | null
          user_id: string
          valor: string
        }
        Insert: {
          ativa?: boolean
          campo: Database["public"]["Enums"]["campo_regra_toggl"]
          criado_em?: string
          id?: string
          operador?: Database["public"]["Enums"]["operador_regra_toggl"]
          ordem?: number
          saida_atividade?: Database["public"]["Enums"]["atividade"] | null
          saida_idioma?: string | null
          saida_pilar?: Database["public"]["Enums"]["pilar"] | null
          saida_tempo?: Database["public"]["Enums"]["tempo_do_dia"] | null
          user_id: string
          valor: string
        }
        Update: {
          ativa?: boolean
          campo?: Database["public"]["Enums"]["campo_regra_toggl"]
          criado_em?: string
          id?: string
          operador?: Database["public"]["Enums"]["operador_regra_toggl"]
          ordem?: number
          saida_atividade?: Database["public"]["Enums"]["atividade"] | null
          saida_idioma?: string | null
          saida_pilar?: Database["public"]["Enums"]["pilar"] | null
          saida_tempo?: Database["public"]["Enums"]["tempo_do_dia"] | null
          user_id?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "regras_mapeamento_toggl_saida_idioma_fkey"
            columns: ["saida_idioma"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
        ]
      }
      retomada_fases: {
        Row: {
          cumprida: boolean
          data: string
          fase: number
          id: string
          retomada_id: string
          user_id: string
        }
        Insert: {
          cumprida?: boolean
          data: string
          fase: number
          id?: string
          retomada_id: string
          user_id: string
        }
        Update: {
          cumprida?: boolean
          data?: string
          fase?: number
          id?: string
          retomada_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retomada_fases_retomada_id_fkey"
            columns: ["retomada_id"]
            isOneToOne: false
            referencedRelation: "retomadas"
            referencedColumns: ["id"]
          },
        ]
      }
      retomadas: {
        Row: {
          abandonada: boolean
          ativa: boolean
          atualizado_em: string
          concluida_em: string | null
          criado_em: string
          dias_de_lacuna: number
          fase: number
          id: string
          inicio: string
          user_id: string
        }
        Insert: {
          abandonada?: boolean
          ativa?: boolean
          atualizado_em?: string
          concluida_em?: string | null
          criado_em?: string
          dias_de_lacuna: number
          fase?: number
          id?: string
          inicio: string
          user_id: string
        }
        Update: {
          abandonada?: boolean
          ativa?: boolean
          atualizado_em?: string
          concluida_em?: string | null
          criado_em?: string
          dias_de_lacuna?: number
          fase?: number
          id?: string
          inicio?: string
          user_id?: string
        }
        Relationships: []
      }
      revisoes_flashcards: {
        Row: {
          criado_em: string
          data: string
          id: string
          idioma_id: string
          pct_acerto_deck: number | null
          pct_acerto_gramatica: number | null
          revisou: boolean
          user_id: string
        }
        Insert: {
          criado_em?: string
          data: string
          id?: string
          idioma_id: string
          pct_acerto_deck?: number | null
          pct_acerto_gramatica?: number | null
          revisou?: boolean
          user_id: string
        }
        Update: {
          criado_em?: string
          data?: string
          id?: string
          idioma_id?: string
          pct_acerto_deck?: number | null
          pct_acerto_gramatica?: number | null
          revisou?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisoes_flashcards_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes: {
        Row: {
          atividade: Database["public"]["Enums"]["atividade"]
          atualizado_em: string
          categoria: Database["public"]["Enums"]["categoria_sessao"]
          chave_toggl: string | null
          criado_em: string
          data: string
          duracao_min: number
          frases_produzidas: number
          hora_inicio: string | null
          id: string
          idioma_id: string
          lote_importacao: string | null
          material_id: string | null
          minutos_fala: number
          nota: string | null
          origem: Database["public"]["Enums"]["origem_sessao"]
          palavras_novas: number
          pilar: Database["public"]["Enums"]["pilar"] | null
          pontos_gramaticais: number
          producao: boolean
          tempo: Database["public"]["Enums"]["tempo_do_dia"]
          user_id: string
          via: Database["public"]["Enums"]["via_registro"]
          violou_regra_5: boolean
        }
        Insert: {
          atividade: Database["public"]["Enums"]["atividade"]
          atualizado_em?: string
          categoria: Database["public"]["Enums"]["categoria_sessao"]
          chave_toggl?: string | null
          criado_em?: string
          data: string
          duracao_min: number
          frases_produzidas?: number
          hora_inicio?: string | null
          id?: string
          idioma_id: string
          lote_importacao?: string | null
          material_id?: string | null
          minutos_fala?: number
          nota?: string | null
          origem?: Database["public"]["Enums"]["origem_sessao"]
          palavras_novas?: number
          pilar?: Database["public"]["Enums"]["pilar"] | null
          pontos_gramaticais?: number
          producao?: boolean
          tempo: Database["public"]["Enums"]["tempo_do_dia"]
          user_id: string
          via?: Database["public"]["Enums"]["via_registro"]
          violou_regra_5?: boolean
        }
        Update: {
          atividade?: Database["public"]["Enums"]["atividade"]
          atualizado_em?: string
          categoria?: Database["public"]["Enums"]["categoria_sessao"]
          chave_toggl?: string | null
          criado_em?: string
          data?: string
          duracao_min?: number
          frases_produzidas?: number
          hora_inicio?: string | null
          id?: string
          idioma_id?: string
          lote_importacao?: string | null
          material_id?: string | null
          minutos_fala?: number
          nota?: string | null
          origem?: Database["public"]["Enums"]["origem_sessao"]
          palavras_novas?: number
          pilar?: Database["public"]["Enums"]["pilar"] | null
          pontos_gramaticais?: number
          producao?: boolean
          tempo?: Database["public"]["Enums"]["tempo_do_dia"]
          user_id?: string
          via?: Database["public"]["Enums"]["via_registro"]
          violou_regra_5?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_lote_fk"
            columns: ["lote_importacao"]
            isOneToOne: false
            referencedRelation: "lotes_importacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_material_fk"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          adiada_vezes: number
          atualizado_em: string
          automatica: boolean
          chave_idempotencia: string
          concluida_em: string | null
          criado_em: string
          data_prevista: string
          descricao: string | null
          dispensada_em: string | null
          do_dia: boolean
          duracao_prevista_min: number | null
          estado: Database["public"]["Enums"]["estado_tarefa"]
          hora_prevista: string | null
          id: string
          idioma_id: string | null
          janela: Database["public"]["Enums"]["janela_tarefa"]
          meta_id: string | null
          pilar: Database["public"]["Enums"]["pilar"] | null
          ponto_gramatical_id: string | null
          quantidade_exigida: number
          quantidade_feita: number
          recorrencia: Database["public"]["Enums"]["recorrencia_tarefa"]
          recorrencia_ate: string | null
          serie_id: string | null
          sessao_id: string | null
          tipo: Database["public"]["Enums"]["tipo_tarefa"]
          titulo: string
          user_id: string
        }
        Insert: {
          adiada_vezes?: number
          atualizado_em?: string
          automatica?: boolean
          chave_idempotencia: string
          concluida_em?: string | null
          criado_em?: string
          data_prevista: string
          descricao?: string | null
          dispensada_em?: string | null
          do_dia?: boolean
          duracao_prevista_min?: number | null
          estado?: Database["public"]["Enums"]["estado_tarefa"]
          hora_prevista?: string | null
          id?: string
          idioma_id?: string | null
          janela?: Database["public"]["Enums"]["janela_tarefa"]
          meta_id?: string | null
          pilar?: Database["public"]["Enums"]["pilar"] | null
          ponto_gramatical_id?: string | null
          quantidade_exigida?: number
          quantidade_feita?: number
          recorrencia?: Database["public"]["Enums"]["recorrencia_tarefa"]
          recorrencia_ate?: string | null
          serie_id?: string | null
          sessao_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_tarefa"]
          titulo: string
          user_id: string
        }
        Update: {
          adiada_vezes?: number
          atualizado_em?: string
          automatica?: boolean
          chave_idempotencia?: string
          concluida_em?: string | null
          criado_em?: string
          data_prevista?: string
          descricao?: string | null
          dispensada_em?: string | null
          do_dia?: boolean
          duracao_prevista_min?: number | null
          estado?: Database["public"]["Enums"]["estado_tarefa"]
          hora_prevista?: string | null
          id?: string
          idioma_id?: string | null
          janela?: Database["public"]["Enums"]["janela_tarefa"]
          meta_id?: string | null
          pilar?: Database["public"]["Enums"]["pilar"] | null
          ponto_gramatical_id?: string | null
          quantidade_exigida?: number
          quantidade_feita?: number
          recorrencia?: Database["public"]["Enums"]["recorrencia_tarefa"]
          recorrencia_ate?: string | null
          serie_id?: string | null
          sessao_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_tarefa"]
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_idioma_id_fkey"
            columns: ["idioma_id"]
            isOneToOne: false
            referencedRelation: "idiomas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_meta_fk"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_ponto_gramatical_id_fkey"
            columns: ["ponto_gramatical_id"]
            isOneToOne: false
            referencedRelation: "pontos_gramaticais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetria_registro: {
        Row: {
          duracao_ms: number
          id: string
          momento: string
          user_id: string
          via: Database["public"]["Enums"]["via_registro"]
        }
        Insert: {
          duracao_ms: number
          id?: string
          momento?: string
          user_id: string
          via: Database["public"]["Enums"]["via_registro"]
        }
        Update: {
          duracao_ms?: number
          id?: string
          momento?: string
          user_id?: string
          via?: Database["public"]["Enums"]["via_registro"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adicionar_idiomas_inativos: { Args: { alvo: string }; Returns: undefined }
      aplicar_dados_conta_principal: {
        Args: { p_email: string }
        Returns: string
      }
      bootstrap_usuario: { Args: { uid: string }; Returns: undefined }
      sincronizar_conquistas: { Args: { uid: string }; Returns: undefined }
    }
    Enums: {
      atividade:
        | "flashcards"
        | "gramatica"
        | "pronuncia"
        | "fala_sozinha"
        | "conversacao"
        | "aula"
        | "audio_grupo"
        | "gravacao_video"
        | "escrita"
        | "conteudo_instagram"
        | "leitura"
        | "serie_filme"
        | "podcast"
        | "audiobook"
        | "youtube"
        | "browser_mode"
        | "outro"
      campo_regra_toggl: "project" | "description" | "tags" | "client" | "task"
      categoria_conquista:
        | "consistencia"
        | "camada"
        | "producao"
        | "metodo"
        | "recuperacao"
      categoria_sessao: "ativo" | "imersao"
      cor_meta: "longo_prazo" | "mensal" | "semanal"
      dimensao_distribuicao: "idioma" | "pilar"
      direcao_meta: "maior_melhor" | "menor_melhor"
      escopo_conquista: "global" | "por_idioma"
      estado_conquista: "bloqueada" | "conquistada"
      estado_ponto: "ok" | "errei" | "em_correcao"
      estado_tarefa: "aberta" | "concluida" | "adiada" | "dispensada"
      janela_tarefa: "dia" | "semana" | "mes" | "bloco"
      nivel:
        | "A0"
        | "A1.1"
        | "A1.2"
        | "A2.1"
        | "A2.2"
        | "B1.1"
        | "B1.2"
        | "B2.1"
        | "B2.2"
        | "C1.1"
        | "C1.2"
        | "C2"
      operador_regra_toggl: "contem" | "igual" | "regex"
      origem_sessao: "manual" | "toggl" | "automatica"
      periodicidade_meta: "dia" | "semana" | "mes" | "bloco" | "prazo_fixo"
      pilar: "vocabulario" | "gramatica" | "pronuncia" | "fala"
      recorrencia_tarefa: "nenhuma" | "diaria" | "semanal" | "mensal"
      tema_app: "claro" | "escuro" | "sistema"
      tempo_do_dia: "cadeira" | "maos_livres" | "maos_ocupadas"
      tipo_material:
        | "app"
        | "livro"
        | "canal_youtube"
        | "podcast"
        | "curso"
        | "playlist"
        | "lista_palavras"
        | "deck"
        | "outro"
      tipo_meta: "palavras" | "nivel" | "conversacao" | "painel_mensal"
      tipo_recurso:
        | "dicionario"
        | "colocacoes"
        | "lista_frequencia"
        | "canal"
        | "podcast"
        | "app"
        | "ipa"
        | "comunidade"
        | "clube"
        | "outro"
      tipo_tarefa:
        | "frases_apos_erro"
        | "ativar_palavras"
        | "audio_grupo"
        | "clube_conversacao"
        | "autoavaliacao"
        | "gravar_video"
        | "aula_paga"
        | "retomada_fase"
        | "manual"
      via_registro: "formulario" | "cronometro" | "atalho" | "botao_regra"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      atividade: [
        "flashcards",
        "gramatica",
        "pronuncia",
        "fala_sozinha",
        "conversacao",
        "aula",
        "audio_grupo",
        "gravacao_video",
        "escrita",
        "conteudo_instagram",
        "leitura",
        "serie_filme",
        "podcast",
        "audiobook",
        "youtube",
        "browser_mode",
        "outro",
      ],
      campo_regra_toggl: ["project", "description", "tags", "client", "task"],
      categoria_conquista: [
        "consistencia",
        "camada",
        "producao",
        "metodo",
        "recuperacao",
      ],
      categoria_sessao: ["ativo", "imersao"],
      cor_meta: ["longo_prazo", "mensal", "semanal"],
      dimensao_distribuicao: ["idioma", "pilar"],
      direcao_meta: ["maior_melhor", "menor_melhor"],
      escopo_conquista: ["global", "por_idioma"],
      estado_conquista: ["bloqueada", "conquistada"],
      estado_ponto: ["ok", "errei", "em_correcao"],
      estado_tarefa: ["aberta", "concluida", "adiada", "dispensada"],
      janela_tarefa: ["dia", "semana", "mes", "bloco"],
      nivel: [
        "A0",
        "A1.1",
        "A1.2",
        "A2.1",
        "A2.2",
        "B1.1",
        "B1.2",
        "B2.1",
        "B2.2",
        "C1.1",
        "C1.2",
        "C2",
      ],
      operador_regra_toggl: ["contem", "igual", "regex"],
      origem_sessao: ["manual", "toggl", "automatica"],
      periodicidade_meta: ["dia", "semana", "mes", "bloco", "prazo_fixo"],
      pilar: ["vocabulario", "gramatica", "pronuncia", "fala"],
      recorrencia_tarefa: ["nenhuma", "diaria", "semanal", "mensal"],
      tema_app: ["claro", "escuro", "sistema"],
      tempo_do_dia: ["cadeira", "maos_livres", "maos_ocupadas"],
      tipo_material: [
        "app",
        "livro",
        "canal_youtube",
        "podcast",
        "curso",
        "playlist",
        "lista_palavras",
        "deck",
        "outro",
      ],
      tipo_meta: ["palavras", "nivel", "conversacao", "painel_mensal"],
      tipo_recurso: [
        "dicionario",
        "colocacoes",
        "lista_frequencia",
        "canal",
        "podcast",
        "app",
        "ipa",
        "comunidade",
        "clube",
        "outro",
      ],
      tipo_tarefa: [
        "frases_apos_erro",
        "ativar_palavras",
        "audio_grupo",
        "clube_conversacao",
        "autoavaliacao",
        "gravar_video",
        "aula_paga",
        "retomada_fase",
        "manual",
      ],
      via_registro: ["formulario", "cronometro", "atalho", "botao_regra"],
    },
  },
} as const
