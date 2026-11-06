import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MobileShell, WebShell } from './components/Shells';
import { useSession } from './app/hooks';
import { FarmerHome } from './pages/FarmerHome';
import { DailySheet } from './pages/DailySheet';
import { WeighingPage } from './pages/Weighing';
import { HealthReportPage } from './pages/HealthReport';
import { ExitPage } from './pages/Exit';
import { LotsPage, LotDetail } from './pages/Lots';
import { BandsPage } from './pages/Bands';
import { InputsPage } from './pages/Inputs';
import { ProfilePage } from './pages/Profile';
import { PublicLot } from './pages/PublicLot';
import { Dashboard } from './pages/Dashboard';
import { FarmsPage, FarmNew } from './pages/Farms';
import { AlertsPage } from './pages/Alerts';
import { SettingsPage } from './pages/Settings';
import { TracePage } from './pages/Trace';
import { Login } from './pages/Login';
import { apiEnabled, getToken } from './app/api';

export function App() {
  const s = useSession();
  const needLogin = apiEnabled && (!getToken() || !s.userLabel);
  const pilot = s.role === 'dge' || s.role === 'veterinaire' || s.role === 'admin' || s.role === 'bceg';
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Page publique consommateur : sans compte, sans coque applicative */}
        <Route path="/p/:token" element={<PublicLot />} />
        {needLogin ? (
          <Route path="*" element={<Login />} />
        ) : pilot ? (
          <Route element={<WebShell />}>
            <Route path="/" element={s.role === 'veterinaire' ? <AlertsPage /> : <Dashboard />} />
            <Route path="/national" element={<Dashboard />} />
            <Route path="/fermes" element={<FarmsPage />} />
            <Route path="/fermes/nouvelle" element={<FarmNew />} />
            <Route path="/alertes" element={<AlertsPage />} />
            <Route path="/tracer" element={<TracePage />} />
            <Route path="/lots/:id" element={<LotDetail />} />
            <Route path="/parametres" element={<SettingsPage />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route element={<MobileShell />}>
            <Route path="/" element={<FarmerHome />} />
            <Route path="/fiche" element={<DailySheet />} />
            <Route path="/pesee" element={<WeighingPage />} />
            <Route path="/sante" element={<HealthReportPage />} />
            <Route path="/sortie" element={<ExitPage />} />
            <Route path="/lots" element={<LotsPage />} />
            <Route path="/lots/:id" element={<LotDetail />} />
            <Route path="/bandes" element={<BandsPage />} />
            <Route path="/intrants" element={<InputsPage />} />
            <Route path="/fermes/nouvelle" element={<FarmNew />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </HashRouter>
  );
}
