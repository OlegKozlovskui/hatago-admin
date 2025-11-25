import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';

function App() {
  return (
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
