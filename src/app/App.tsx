import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from '../contexts/AuthContext';
import { DadosProvider } from '../contexts/DadosContext';
import { ConfigProvider } from '../contexts/ConfigContext';
import { NotificacoesProvider } from '../contexts/NotificacoesContext';

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <DadosProvider>
          <NotificacoesProvider>
            <RouterProvider router={router} />
            <ToastProvider />
          </NotificacoesProvider>
        </DadosProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}