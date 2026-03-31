import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  style,
  ...props
}: SkeletonProps) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const defaultHeight = variant === 'text' ? '1rem' : undefined;

  return (
    <div
      className={`bg-muted ${variants[variant]} ${animations[animation]} ${className}`}
      style={{
        width,
        height: height || defaultHeight,
        ...style,
      }}
      {...props}
    />
  );
};

// Skeleton pré-configurados para casos comuns
export const SkeletonCard = () => (
  <div className="bg-card border border-border rounded-lg p-6 space-y-4">
    <Skeleton variant="text" width="60%" height="1.5rem" />
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="80%" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-card border border-border rounded-lg overflow-hidden">
    <div className="bg-muted/50 p-4 border-b border-border">
      <div className="flex gap-4">
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="25%" />
        <Skeleton variant="text" width="25%" />
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 border-b border-border last:border-0">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </div>
          <Skeleton variant="rounded" width="5rem" height="1.5rem" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return <Skeleton variant="circular" className={sizes[size]} />;
};

export const SkeletonButton = ({ width = '6rem' }: { width?: string | number }) => (
  <Skeleton variant="rounded" width={width} height="2.5rem" />
);

export const SkeletonText = ({
  lines = 3,
  width = '100%',
}: {
  lines?: number;
  width?: string | number;
}) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '80%' : width}
      />
    ))}
  </div>
);

// Exemplo de uso:
// import { Skeleton, SkeletonCard, SkeletonTable } from './components/ui/Skeleton';
//
// {isLoading ? (
//   <Skeleton variant="rounded" width="100%" height="200px" />
// ) : (
//   <div>Conteúdo carregado</div>
// )}
//
// {isLoading ? <SkeletonCard /> : <Card>...</Card>}
// {isLoading ? <SkeletonTable rows={5} /> : <Table>...</Table>}
