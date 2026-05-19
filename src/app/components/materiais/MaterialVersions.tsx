import { useState, useEffect } from 'react';
import { Clock, RotateCcw, Loader2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { toast } from '../ui/Toast';
import { MaterialVersoesService, type MaterialVersao } from '../../../services/material-versoes.service';

interface MaterialVersionsProps {
  materialId: string;
  materialNome: string;
  onRestaurar?: (conteudo: string) => void;
}

export function MaterialVersions({ materialId, materialNome, onRestaurar }: MaterialVersionsProps) {
  const [versoes, setVersoes] = useState<MaterialVersao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [restaurando, setRestaurando] = useState<string | null>(null);

  useEffect(() => {
    if (!materialId) return;
    setCarregando(true);
    MaterialVersoesService.listar(materialId)
      .then(setVersoes)
      .finally(() => setCarregando(false));
  }, [materialId]);

  const handleRestaurar = async (versao: MaterialVersao) => {
    if (restaurando) return;
    setRestaurando(versao.id);
    try {
      const conteudo = await MaterialVersoesService.restaurar(versao.id, materialId);
      toast.success(
        `Versão ${versao.versao} restaurada`,
        `O material "${materialNome}" foi restaurado com sucesso`
      );
      if (conteudo && onRestaurar) {
        onRestaurar(conteudo);
      }
    } catch (err: any) {
      toast.error('Erro ao restaurar', err.message || 'Não foi possível restaurar esta versão');
    } finally {
      setRestaurando(null);
    }
  };

  const formatarData = (dataIso: string) => {
    return new Date(dataIso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground text-sm">Carregando histórico de versões...</span>
      </div>
    );
  }

  if (versoes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <h3 className="font-semibold text-foreground mb-1">Nenhuma versão encontrada</h3>
        <p className="text-sm text-muted-foreground">
          O histórico de versões aparecerá aqui quando o material for editado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {versoes.length} {versoes.length === 1 ? 'versão encontrada' : 'versões encontradas'}
        </span>
      </div>

      {versoes.map((versao) => (
        <div
          key={versao.id}
          className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className="text-xs font-mono">
                  v{versao.versao}
                </Badge>
                {versao.autor_nome && (
                  <span className="text-sm font-medium text-foreground truncate">
                    {versao.autor_nome}
                  </span>
                )}
              </div>

              {versao.descricao_mudanca && (
                <p className="text-sm text-foreground mb-1.5 line-clamp-2">
                  {versao.descricao_mudanca}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatarData(versao.created_at)}</span>
              </div>

              {versao.conteudo_anterior && (
                <p className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded p-2 line-clamp-2 font-mono">
                  {versao.conteudo_anterior.replace(/<[^>]*>/g, '').slice(0, 120)}
                  {versao.conteudo_anterior.length > 120 ? '...' : ''}
                </p>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRestaurar(versao)}
              disabled={restaurando === versao.id}
              icon={
                restaurando === versao.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <RotateCcw className="h-3.5 w-3.5" />
              }
              className="flex-shrink-0"
            >
              {restaurando === versao.id ? 'Restaurando...' : 'Restaurar esta versão'}
            </Button>
          </div>
        </div>
      ))}

      <div className="flex items-start gap-2 mt-4 p-3 bg-warning/5 border border-warning/20 rounded-lg">
        <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Restaurar uma versão irá sobrescrever o conteúdo atual do material. Esta ação não pode ser desfeita diretamente, mas a versão atual ficará salva no histórico.
        </p>
      </div>
    </div>
  );
}
