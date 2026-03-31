import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonText,
} from '../components/ui/Skeleton';
import { CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';

export default function ComponentShowcase() {
  const [loading, setLoading] = useState(false);

  const handleSuccess = () => {
    toast.success('Operação concluída!', 'Seus dados foram salvos com sucesso.');
  };

  const handleError = () => {
    toast.error('Erro ao processar', 'Por favor, verifique os dados e tente novamente.');
  };

  const handleWarning = () => {
    toast.warning('Atenção necessária', 'Você tem alterações não salvas.');
  };

  const handleInfo = () => {
    toast.info('Informação importante', 'Esta é uma mensagem informativa.');
  };

  const handlePromise = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve({ name: 'Dados' }) : reject('Erro simulado');
      }, 3000);
    });

    toast.promise(promise, {
      loading: 'Processando...',
      success: 'Dados carregados com sucesso!',
      error: 'Falha ao carregar dados.',
    });
  };

  const toggleLoading = () => {
    setLoading(!loading);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Componentes & Animações</h1>
        <p className="text-muted-foreground mt-1">
          Demonstração de toasts, skeletons e micro-animações
        </p>
      </div>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Notificações (Toast)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="success"
              icon={<CheckCircle className="h-4 w-4" />}
              onClick={handleSuccess}
            >
              Success
            </Button>
            <Button
              variant="danger"
              icon={<AlertCircle className="h-4 w-4" />}
              onClick={handleError}
            >
              Error
            </Button>
            <Button
              variant="outline"
              icon={<AlertTriangle className="h-4 w-4" />}
              onClick={handleWarning}
            >
              Warning
            </Button>
            <Button
              variant="outline"
              icon={<Info className="h-4 w-4" />}
              onClick={handleInfo}
            >
              Info
            </Button>
          </div>
          <div className="mt-4">
            <Button
              icon={<Loader2 className="h-4 w-4" />}
              onClick={handlePromise}
            >
              Promise Toast (3s)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Loaders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Skeleton Loaders</h2>
          <Button onClick={toggleLoading} size="sm">
            {loading ? 'Mostrar Conteúdo' : 'Mostrar Loading'}
          </Button>
        </div>

        {/* Basic Skeletons */}
        <Card>
          <CardHeader>
            <CardTitle>Skeletons Básicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Text</p>
              {loading ? (
                <Skeleton variant="text" width="80%" />
              ) : (
                <p className="text-foreground">Este é um texto de exemplo que está carregado.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Circular (Avatar)</p>
              {loading ? (
                <SkeletonAvatar size="lg" />
              ) : (
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">JD</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Button</p>
              {loading ? (
                <SkeletonButton width="120px" />
              ) : (
                <Button>Clique Aqui</Button>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Multiple Lines</p>
              {loading ? (
                <SkeletonText lines={4} />
              ) : (
                <div className="space-y-2">
                  <p className="text-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  <p className="text-foreground">Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                  <p className="text-foreground">Ut enim ad minim veniam, quis nostrud exercitation ullamco.</p>
                  <p className="text-foreground">Duis aute irure dolor in reprehenderit in voluptate.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Skeleton */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Card Skeleton</p>
          {loading ? (
            <SkeletonCard />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Card com Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Este é um card completo com título, descrição e conteúdo carregado.
                  O skeleton simula a estrutura enquanto os dados são carregados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Table Skeleton */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Table Skeleton</p>
          {loading ? (
            <SkeletonTable rows={4} />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 p-4 border-b border-border">
                <div className="flex gap-4 font-semibold text-foreground">
                  <span className="w-1/4">Nome</span>
                  <span className="w-1/3">Email</span>
                  <span className="w-1/4">Status</span>
                  <span className="w-1/4">Ações</span>
                </div>
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">U{i}</span>
                    </div>
                    <div className="flex-1 flex gap-4">
                      <span className="w-1/4 text-foreground">Usuário {i}</span>
                      <span className="w-1/3 text-muted-foreground">usuario{i}@email.com</span>
                      <span className="w-1/4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-success/10 text-success border border-success/20">
                          Ativo
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Animation Types */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Animação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Pulse (padrão)</p>
            <Skeleton variant="rounded" width="100%" height="60px" animation="pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Wave (shimmer)</p>
            <Skeleton variant="rounded" width="100%" height="60px" animation="wave" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">None (sem animação)</p>
            <Skeleton variant="rounded" width="100%" height="60px" animation="none" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
