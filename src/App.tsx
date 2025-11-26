import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminAmenitiesPage from './pages/AmenitiesPage.tsx';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Тут потім підвʼяжемо protected route під ADMIN */}
        <Route
          path="/"
          element={
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          }
        />

        <Route
          path="/amenities"
          element={
            <AdminLayout>
              <AdminAmenitiesPage />
            </AdminLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
