/**
 * NotificationBell — EDUC.AI
 * Sino de notificações com badge, dropdown e suporte a Realtime via NotificacoesContext.
 */

import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  BookOpen,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useNotificacoes, type Notificacao } from '../../../contexts/NotificacoesContext';

// ── Ícone por tipo ────────────────────────────────────────────────────────────

function IconeTipo({ tipo }: { tipo: Notificacao['tipo'] }) {
  switch (tipo) {
    case 'aprovacao':
      return <Check className="h-4 w-4 text-green-500 shrink-0" />;
    case 'aluno_risco':
      return <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />;
    case 'atividade':
      return <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />;
    case 'sistema':
      return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

// ── Badge de cor por tipo ─────────────────────────────────────────────────────

function badgeClasses(tipo: Notificacao['tipo']): string {
  switch (tipo) {
    case 'aprovacao':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'aluno_risco':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'atividade':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'sistema':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// ── Formatar data relativa ────────────────────────────────────────────────────

function formatarTempo(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutos = Math.floor(diff / 60_000);
    if (minutos < 1) return 'Agora mesmo';
    if (minutos < 60) return `Há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Há ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `Há ${dias} dia${dias > 1 ? 's' : ''}`;
  } catch {
    return '';
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export function NotificationBell() {
  const { notificacoes, naoLidas, loading, marcarComoLida, marcarTodasComoLidas } =
    useNotificacoes();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label="Notificações"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5 text-foreground" />

        {/* Badge de contagem */}
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full leading-none">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Cabeçalho */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
              {naoLidas > 0 && (
                <p className="text-xs text-muted-foreground">
                  {naoLidas} não lida{naoLidas !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {naoLidas > 0 && (
              <button
                onClick={() => marcarTodasComoLidas()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <p className="text-xs text-muted-foreground">Carregando...</p>
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notificacoes.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => marcarComoLida(notif.id)}
                    className={`w-full p-4 text-left hover:bg-muted/60 transition-colors ${
                      !notif.lida ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Ícone colorido */}
                      <span
                        className={`mt-0.5 p-1.5 rounded-full ${badgeClasses(notif.tipo)}`}
                      >
                        <IconeTipo tipo={notif.tipo} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {!notif.lida && (
                            <span className="h-1.5 w-1.5 bg-primary rounded-full shrink-0" />
                          )}
                          <p className="text-sm font-medium text-foreground truncate">
                            {notif.titulo}
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {notif.mensagem}
                        </p>

                        <p className="text-[11px] text-muted-foreground">
                          {formatarTempo(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
