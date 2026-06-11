import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import WalletConnect from './components/WalletConnect';
import Dashboard from './pages/Dashboard';

function App() {
  const { isConnected } = useAuthStore();

  return (
    <Routes>
      {/* Login Page */}
      <Route 
        path="/login" 
        element={!isConnected ? <WalletConnect /> : <Navigate to="/" replace />} 
      />

      {/* Main Dashboard (Root) */}
      <Route 
        path="/" 
        element={isConnected ? <Dashboard /> : <Navigate to="/login" replace />} 
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;