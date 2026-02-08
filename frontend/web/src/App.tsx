import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/Dashboard';
import FilesPage from './pages/Files';
import NodesPage from './pages/Nodes';
import WalletPage from './pages/Wallet';
import SettingsPage from './pages/Settings';
import './App.css'; // This file is now empty, but imports might rely on it for resets if added later

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="nodes" element={<NodesPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
