/**
 * Componente de Upload - EDUC.AI
 * Componente reutilizável para upload de arquivos
 */

import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { UploadService, type UploadResult } from '../../services/upload.service';
import { useAuth } from '../../contexts/AuthContext';

interface FileUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: Error) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  acceptedTypes,
  maxSize,
  className,
}: FileUploadProps) {
  const { professor } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !professor) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simular progresso (Supabase não retorna progresso real)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await UploadService.upload(file, professor.id);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);

      if (onUploadComplete) {
        onUploadComplete(result);
      }

      // Limpar após 2 segundos
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        setUploadSuccess(false);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }, 2000);
    } catch (error) {
      console.error('Erro no upload:', error);
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    if (type === 'application/pdf') return <FileText className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {!file ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#16A085] transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Clique para selecionar ou arraste um arquivo
          </p>
          <p className="text-xs text-gray-500">
            Tamanho máximo: {UploadService.formatarTamanho(maxSize || 10485760)}
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={acceptedTypes?.join(',')}
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getFileIcon(file.type)}
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {UploadService.formatarTamanho(file.size)}
                </p>
              </div>
            </div>
            {!uploading && !uploadSuccess && (
              <button
                onClick={handleRemove}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {uploadSuccess && (
              <CheckCircle className="w-6 h-6 text-green-500" />
            )}
          </div>

          {uploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Enviando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#16A085] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadSuccess && (
            <p className="text-sm text-green-600 mb-4">
              ✓ Arquivo enviado com sucesso!
            </p>
          )}

          {!uploading && !uploadSuccess && (
            <Button
              onClick={handleUpload}
              className="w-full bg-[#16A085] hover:bg-[#0E3B37]"
            >
              Fazer Upload
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface MultipleFileUploadProps {
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: Error) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  className?: string;
}

export function MultipleFileUpload({
  onUploadComplete,
  onUploadError,
  acceptedTypes,
  maxFiles = 5,
  className,
}: MultipleFileUploadProps) {
  const { professor } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Você pode enviar no máximo ${maxFiles} arquivos`);
      return;
    }
    setFiles([...files, ...selectedFiles]);
  };

  const handleRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (!files.length || !professor) return;

    try {
      setUploading(true);
      const results = await UploadService.uploadMultiplo(files, professor.id);
      
      if (onUploadComplete) {
        onUploadComplete(results);
      }

      setFiles([]);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#16A085] transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 mb-1">
          Clique para selecionar múltiplos arquivos
        </p>
        <p className="text-xs text-gray-500">
          Máximo de {maxFiles} arquivos
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes?.join(',')}
          multiple
          onChange={handleFilesSelect}
        />
      </div>

      {files.length > 0 && (
        <>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {UploadService.formatarTamanho(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  disabled={uploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUploadAll}
            disabled={uploading}
            className="w-full bg-[#16A085] hover:bg-[#0E3B37]"
          >
            {uploading ? 'Enviando...' : `Enviar ${files.length} arquivo(s)`}
          </Button>
        </>
      )}
    </div>
  );
}
