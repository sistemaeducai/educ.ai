import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Zap,
  Database,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useMetricasIA } from '../hooks/useMetricasIA';
import { Button } from './ui/Button';

export function DashboardMetricasIA() {
  const { metricas, loading, error, refetch } = useMetricasIA();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando métricas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar métricas: {error}</p>
          <Button onClick={refetch} className="mt-4" variant="outline">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metricas) {
    return null;
  }

  const stats = metricas.estatisticas;
  const cache = metricas.efetividadeCache;

  // Calcular totais de cache
  const totalCacheHits = cache.reduce((sum, c) => sum + c.total_cache_hits, 0);
  const totalCacheEntries = cache.reduce((sum, c) => sum + c.total_entradas_cache, 0);
  const cacheHitRate = totalCacheEntries > 0 
    ? Math.round((totalCacheHits / (totalCacheHits + totalCacheEntries)) * 100)
    : 0;

  // Calcular economia
  const economiaEstimadaBRL = stats.tempo_total_economizado_horas * 50; // R$ 50/hora
  const custoBRL = stats.custo_total_usd * 5; // Conversão aproximada USD -> BRL
  const roi = custoBRL > 0 
    ? Math.round(((economiaEstimadaBRL - custoBRL) / custoBRL) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header com Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Métricas de IA</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o uso e economia com inteligência artificial
          </p>
        </div>
        <Button onClick={refetch} variant="outline" icon={<RefreshCw className="h-4 w-4" />}>
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Operações */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Operações de IA</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stats.total_operacoes}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tempo Economizado */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Economizado</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stats.tempo_total_economizado_horas}h
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              R$ {economiaEstimadaBRL.toFixed(0)} economizados
            </div>
          </CardContent>
        </Card>

        {/* Custo Total */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  R$ {custoBRL.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ${stats.custo_total_usd.toFixed(2)} USD
            </p>
          </CardContent>
        </Card>

        {/* ROI */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {roi}%
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-xs text-purple-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Excelente retorno
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Cache */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efetividade de Cache */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Efetividade de Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {cacheHitRate}%
                  </p>
                </div>
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                  cacheHitRate >= 80 ? 'bg-green-500/20' : 
                  cacheHitRate >= 60 ? 'bg-yellow-500/20' : 
                  'bg-red-500/20'
                }`}>
                  <span className={`text-2xl font-bold ${
                    cacheHitRate >= 80 ? 'text-green-600' : 
                    cacheHitRate >= 60 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {cacheHitRate >= 80 ? '🎯' : cacheHitRate >= 60 ? '⚠️' : '❌'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de Entradas</span>
                  <span className="font-semibold">{totalCacheEntries}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de Hits</span>
                  <span className="font-semibold text-green-600">{totalCacheHits}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tokens Economizados</span>
                  <span className="font-semibold text-blue-600">
                    {cache.reduce((sum, c) => sum + c.tokens_economizados, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operações por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Operações por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cache.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma operação de cache ainda. Use as funcionalidades de IA para começar!
                </p>
              ) : (
                cache.slice(0, 5).map((item, index) => {
                  const totalOperacoes = item.total_entradas_cache + item.total_cache_hits;
                  const hitRate = totalOperacoes > 0 
                    ? Math.round((item.total_cache_hits / totalOperacoes) * 100)
                    : 0;

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {item.tipo_operacao.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {hitRate}% cache hit
                        </span>
                      </div>
                      <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${hitRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.total_entradas_cache} entradas</span>
                        <span>{item.total_cache_hits} hits</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Turmas com IA</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {stats.turmas_com_ia}
              </p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Tokens Totais</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {stats.tokens_totais.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Média por Operação</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {stats.total_operacoes > 0 
                  ? Math.round(stats.tokens_totais / stats.total_operacoes).toLocaleString()
                  : 0
                } tokens
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
