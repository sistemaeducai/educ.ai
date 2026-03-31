import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
          <h2 className="text-3xl font-bold text-foreground mt-4">Página não encontrada</h2>
          <p className="text-muted-foreground mt-2">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <Button icon={<Home className="h-4 w-4" />} onClick={() => navigate('/')}>
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
}