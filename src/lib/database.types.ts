/**
 * Tipos do Banco de Dados - EDUC.AI
 * Tipos TypeScript gerados a partir do schema do Supabase
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nome: string
          google_id: string | null
          avatar_url: string | null
          tipo_usuario: 'professor' | 'coordenador' | 'admin' | 'visitante'
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nome: string
          google_id?: string | null
          avatar_url?: string | null
          tipo_usuario?: 'professor' | 'coordenador' | 'admin' | 'visitante'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          google_id?: string | null
          avatar_url?: string | null
          tipo_usuario?: 'professor' | 'coordenador' | 'admin' | 'visitante'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      professores: {
        Row: {
          id: string
          instituicao: string
          disciplinas: Json
          formacao: string | null
          nivel_ensino: string[]
          anos_experiencia: number
          especializacoes: string[]
          preferencias_ensino: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          instituicao?: string
          disciplinas?: Json
          formacao?: string | null
          nivel_ensino?: string[]
          anos_experiencia?: number
          especializacoes?: string[]
          preferencias_ensino?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instituicao?: string
          disciplinas?: Json
          formacao?: string | null
          nivel_ensino?: string[]
          anos_experiencia?: number
          especializacoes?: string[]
          preferencias_ensino?: Json
          created_at?: string
          updated_at?: string
        }
      }
      coordenadores: {
        Row: {
          id: string
          instituicao: string
          setor: string | null
          area_atuacao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          instituicao: string
          setor?: string | null
          area_atuacao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instituicao?: string
          setor?: string | null
          area_atuacao?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      administradores: {
        Row: {
          id: string
          nivel_acesso: 'admin' | 'super_admin'
          permissoes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nivel_acesso?: 'admin' | 'super_admin'
          permissoes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nivel_acesso?: 'admin' | 'super_admin'
          permissoes?: Json
          created_at?: string
          updated_at?: string
        }
      }
      turmas: {
        Row: {
          id: string
          professor_id: string
          nome: string
          serie: string
          disciplina: string
          ano_letivo: string
          total_alunos: number
          google_classroom_id: string | null
          cor: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professor_id: string
          nome: string
          serie: string
          disciplina: string
          ano_letivo: string
          total_alunos?: number
          google_classroom_id?: string | null
          cor?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professor_id?: string
          nome?: string
          serie?: string
          disciplina?: string
          ano_letivo?: string
          total_alunos?: number
          google_classroom_id?: string | null
          cor?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      alunos: {
        Row: {
          id: string
          turma_id: string
          nome: string
          matricula: string
          email: string | null
          telefone: string | null
          responsavel: string | null
          status: 'ativo' | 'inativo'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          turma_id: string
          nome: string
          matricula: string
          email?: string | null
          telefone?: string | null
          responsavel?: string | null
          status?: 'ativo' | 'inativo'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          turma_id?: string
          nome?: string
          matricula?: string
          email?: string | null
          telefone?: string | null
          responsavel?: string | null
          status?: 'ativo' | 'inativo'
          created_at?: string
          updated_at?: string
        }
      }
      planos_aula: {
        Row: {
          id: string
          professor_id: string
          turma_id: string | null
          titulo: string
          disciplina: string
          serie: string
          duracao: string
          objetivo: string
          conteudo: string
          metodologia: string
          recursos: string[]
          avaliacao: string
          competencias_bncc: string[]
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professor_id: string
          turma_id?: string | null
          titulo: string
          disciplina: string
          serie: string
          duracao: string
          objetivo: string
          conteudo: string
          metodologia: string
          recursos?: string[]
          avaliacao: string
          competencias_bncc?: string[]
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professor_id?: string
          turma_id?: string | null
          titulo?: string
          disciplina?: string
          serie?: string
          duracao?: string
          objetivo?: string
          conteudo?: string
          metodologia?: string
          recursos?: string[]
          avaliacao?: string
          competencias_bncc?: string[]
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      atividades: {
        Row: {
          id: string
          professor_id: string
          turma_id: string | null
          titulo: string
          tipo: 'prova' | 'trabalho' | 'exercicio' | 'pesquisa' | 'seminario'
          disciplina: string
          data_entrega: string | null
          status: 'rascunho' | 'publicada' | 'encerrada'
          conteudo: Json
          google_forms_id: string | null
          google_classroom_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professor_id: string
          turma_id?: string | null
          titulo: string
          tipo: 'prova' | 'trabalho' | 'exercicio' | 'pesquisa' | 'seminario'
          disciplina: string
          data_entrega?: string | null
          status?: 'rascunho' | 'publicada' | 'encerrada'
          conteudo: Json
          google_forms_id?: string | null
          google_classroom_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professor_id?: string
          turma_id?: string | null
          titulo?: string
          tipo?: 'prova' | 'trabalho' | 'exercicio' | 'pesquisa' | 'seminario'
          disciplina?: string
          data_entrega?: string | null
          status?: 'rascunho' | 'publicada' | 'encerrada'
          conteudo?: Json
          google_forms_id?: string | null
          google_classroom_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      correcoes: {
        Row: {
          id: string
          atividade_id: string
          aluno_id: string
          professor_id: string
          arquivo_url: string | null
          nota: number | null
          feedback: string | null
          status: 'pendente' | 'corrigida' | 'revisao'
          corrigida_em: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          atividade_id: string
          aluno_id: string
          professor_id: string
          arquivo_url?: string | null
          nota?: number | null
          feedback?: string | null
          status?: 'pendente' | 'corrigida' | 'revisao'
          corrigida_em?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          atividade_id?: string
          aluno_id?: string
          professor_id?: string
          arquivo_url?: string | null
          nota?: number | null
          feedback?: string | null
          status?: 'pendente' | 'corrigida' | 'revisao'
          corrigida_em?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      materiais: {
        Row: {
          id: string
          professor_id: string
          turma_id: string | null
          titulo: string
          descricao: string | null
          tipo: 'pdf' | 'video' | 'link' | 'imagem' | 'documento'
          arquivo_url: string | null
          link_externo: string | null
          categoria: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professor_id: string
          turma_id?: string | null
          titulo: string
          descricao?: string | null
          tipo: 'pdf' | 'video' | 'link' | 'imagem' | 'documento'
          arquivo_url?: string | null
          link_externo?: string | null
          categoria?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professor_id?: string
          turma_id?: string | null
          titulo?: string
          descricao?: string | null
          tipo?: 'pdf' | 'video' | 'link' | 'imagem' | 'documento'
          arquivo_url?: string | null
          link_externo?: string | null
          categoria?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      mensagens: {
        Row: {
          id: string
          professor_id: string
          turma_id: string | null
          aluno_id: string | null
          assunto: string
          conteudo: string
          tipo: 'individual' | 'turma' | 'geral'
          lida: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professor_id: string
          turma_id?: string | null
          aluno_id?: string | null
          assunto: string
          conteudo: string
          tipo: 'individual' | 'turma' | 'geral'
          lida?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professor_id?: string
          turma_id?: string | null
          aluno_id?: string | null
          assunto?: string
          conteudo?: string
          tipo?: 'individual' | 'turma' | 'geral'
          lida?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      logs_sistema: {
        Row: {
          id: string
          usuario_id: string | null
          tipo: 'info' | 'warning' | 'error' | 'auth' | 'api'
          mensagem: string
          detalhes: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id?: string | null
          tipo: 'info' | 'warning' | 'error' | 'auth' | 'api'
          mensagem: string
          detalhes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string | null
          tipo?: 'info' | 'warning' | 'error' | 'auth' | 'api'
          mensagem?: string
          detalhes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      marcos: {
        Row: {
          id: string
          turma_id: string
          tipo: 'prova' | 'entrega' | 'aviso' | 'simulado' | 'evento'
          titulo: string
          descricao: string | null
          data: string
          data_fim: string | null
          cor: string | null
          bloqueado: boolean
          vinculos_atividades: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          turma_id: string
          tipo: 'prova' | 'entrega' | 'aviso' | 'simulado' | 'evento'
          titulo: string
          descricao?: string | null
          data: string
          data_fim?: string | null
          cor?: string | null
          bloqueado?: boolean
          vinculos_atividades?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          turma_id?: string
          tipo?: 'prova' | 'entrega' | 'aviso' | 'simulado' | 'evento'
          titulo?: string
          descricao?: string | null
          data?: string
          data_fim?: string | null
          cor?: string | null
          bloqueado?: boolean
          vinculos_atividades?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      configuracoes: {
        Row: {
          id: string
          chave: string
          valor: Json
          descricao: string | null
          tipo: 'sistema' | 'integracao' | 'notificacao'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chave: string
          valor: Json
          descricao?: string | null
          tipo: 'sistema' | 'integracao' | 'notificacao'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chave?: string
          valor?: Json
          descricao?: string | null
          tipo?: 'sistema' | 'integracao' | 'notificacao'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}