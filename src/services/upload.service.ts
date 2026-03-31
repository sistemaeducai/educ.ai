/**
 * Serviço de Upload - EDUC.AI
 * Gerenciamento de arquivos com Supabase Storage
 */

import { supabase } from '../lib/supabase';

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

export class UploadService {
  private static readonly BUCKET_NAME = 'educai-files';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Tipos de arquivo permitidos
   */
  private static readonly ALLOWED_TYPES = {
    pdf: ['application/pdf'],
    imagem: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documento: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
  };

  /**
   * Validar arquivo antes do upload
   */
  private static validarArquivo(file: File): void {
    // Verificar tamanho
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Verificar tipo
    const todosOsTipos = Object.values(this.ALLOWED_TYPES).flat();
    if (!todosOsTipos.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido');
    }
  }

  /**
   * Gerar nome único para o arquivo
   */
  private static gerarNomeUnico(fileName: string, professorId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extensao = fileName.split('.').pop();
    const nomeBase = fileName.replace(`.${extensao}`, '').replace(/[^a-zA-Z0-9]/g, '-');
    return `${professorId}/${timestamp}-${random}-${nomeBase}.${extensao}`;
  }

  /**
   * Upload de arquivo único
   */
  static async upload(file: File, professorId: string): Promise<UploadResult> {
    try {
      // Validar arquivo
      this.validarArquivo(file);

      // Gerar caminho único
      const path = this.gerarNomeUnico(file.name, professorId);

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Erro no upload:', error);
        throw new Error('Falha ao fazer upload do arquivo');
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(path);

      return {
        url: publicUrl,
        path: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  }

  /**
   * Upload de múltiplos arquivos
   */
  static async uploadMultiplo(
    files: File[],
    professorId: string
  ): Promise<UploadResult[]> {
    const uploads = files.map(file => this.upload(file, professorId));
    return Promise.all(uploads);
  }

  /**
   * Deletar arquivo
   */
  static async deletar(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw new Error('Falha ao deletar o arquivo');
    }
  }

  /**
   * Listar arquivos do professor
   */
  static async listar(professorId: string): Promise<string[]> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(professorId);

    if (error) {
      console.error('Erro ao listar arquivos:', error);
      throw new Error('Falha ao listar arquivos');
    }

    return data?.map(file => file.name) || [];
  }

  /**
   * Obter URL assinada (privada) com expiração
   */
  static async obterUrlAssinada(
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Erro ao gerar URL assinada:', error);
      throw new Error('Falha ao gerar URL do arquivo');
    }

    return data.signedUrl;
  }

  /**
   * Download de arquivo
   */
  static async download(path: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .download(path);

    if (error) {
      console.error('Erro ao baixar arquivo:', error);
      throw new Error('Falha ao baixar o arquivo');
    }

    return data;
  }

  /**
   * Helper: Converter File para base64 (para preview)
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Helper: Formatar tamanho de arquivo
   */
  static formatarTamanho(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
