import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './pages/Dashboard';
import AnalyzeData from './pages/AnalyzeData';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import Agents from './pages/Agents';
import Reports from './pages/Reports';
import { getDashboardStats } from './services/api';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await getDashboardStats();
      setDashboardStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <ThemeProvider>
      <Router>
        <div className="app-layout">
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} stats={dashboardStats} />
          <div className="main-content">
            <TopBar stats={dashboardStats} />
            <div className="page-content">
              <Routes>
                <Route path="/" element={<Dashboard stats={dashboardStats} onRefresh={fetchStats} />} />
                <Route path="/analyze" element={<AnalyzeData onAnalysisComplete={fetchStats} />} />
                <Route path="/incidents" element={<Incidents />} />
                <Route path="/incidents/:id" element={<IncidentDetail />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}
