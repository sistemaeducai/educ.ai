import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from '../contexts/AuthContext';
import { DadosProvider } from '../contexts/DadosContext';
import { ConfigProvider } from '../contexts/ConfigContext';

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <DadosProvider>
          <RouterProvider router={router} />
          <ToastProvider />
        </DadosProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}