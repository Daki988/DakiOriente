import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MobileShell, WebShell } from './components/Shells';
import { useSession } from './app/hooks';
import { apiEnabled, getToken } from './app/api';
import { FarmerHome } from './pages/FarmerHome';
import { DailySheet } from './pages/DailySheet';
import { WeighingPage } from './pages/Weighing';
import { HealthReportPage } from './pages/HealthReport';
import { ExitPage } from './pages/Exit';
import { LotsPage, LotDetail } from './pages/Lots';
import { BandsPage, BandOpen } from './pages/Bands';
import { InputsPage } from './pages/Inputs';
import { ProfilePage } from './pages/Profile';
import { PublicLot } from './pages/PublicLot';
import { Dashboard } from './pages/Dashboard';
import { FarmsPage, FarmNew } from './pages/Farms';
import { FarmDetail } from './pages/FarmDetail';
import { AlertsPage } from './pages/Alerts';
import { SettingsPage, RightsPage } from './pages/Settings';
import { TracePage } from './pages/Trace';
import { Download } from './pages/Download';
import { Auth } from './pages/Auth';
import { AccessRequestPage } from './pages/AccessRequest';
import { Reception } from './pages/Reception';
import { AdminAudit, AdminHome, AdminOperators, AdminRequests, AdminUsers } from './pages/admin/Admin';
import { NotFound } from './pages/NotFound';
import { EntriesPage, WeighingsPage, ChargesPage, ConsultationsPage, DiagnosticsPage, OffersPage, OrdersPage, PricesPage, SlaughterPage, TreatmentsPage, VaccinationsPage, VisitsPage } from './pages/Registers';
import { BiosecurityPage } from './pages/Biosecurity';
import { LabelsPage } from './pages/Labels';
import { ReportsPage } from './pages/Reports';
import { ImportPage } from './pages/Import';
import { EconomicsPage, PublicationsPage, PublicStats, RankingPage } from './pages/Pilotage';
import { MoreMenu, ResourcesPage } from './pages/Resources';
import { AgentHome, BcegHome, MaedrHome, VetHome } from './pages/Homes';

const PILOT = ['dge', 'veterinaire', 'admin', 'bceg', 'maedr', 'aninf'];

export function App() {
  const s = useSession();
  const needLogin = apiEnabled ? !getToken() || !s.userLabel : !s.userLabel;
  const pilot = PILOT.includes(s.role);
  const r = s.role;
  // Chaque profil arrive sur le tableau de bord de son métier.
  const home = r === 'admin' ? <AdminHome /> : r === 'veterinaire' ? <VetHome /> : r === 'bceg' ? <BcegHome /> : r === 'maedr' ? <MaedrHome /> : r === 'aninf' ? <AdminAudit /> : <Dashboard />;
  const dgeLike = r === 'dge' || r === 'admin';
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Pages publiques : sans compte */}
        <Route path="/p/:token" element={<PublicLot />} />
        <Route path="/telecharger" element={<Download />} />
        <Route path="/demande-acces" element={<AccessRequestPage />} />
        <Route path="/statistiques" element={<PublicStats />} />
        {needLogin ? (
          <Route path="*" element={<Auth />} />
        ) : pilot ? (
          <Route element={<WebShell />}>
            <Route path="/" element={home} />
            <Route path="/profil" element={<ProfilePage />} />
            {r !== 'aninf' && r !== 'maedr' && <>
              <Route path="/national" element={<Dashboard />} />
              <Route path="/fermes" element={<FarmsPage />} />
              <Route path="/fermes/:id" element={<FarmDetail />} />
              <Route path="/alertes" element={<AlertsPage />} />
              <Route path="/tracer" element={<TracePage />} />
              <Route path="/lots/:id" element={<LotDetail />} />
              <Route path="/parametres" element={<SettingsPage />} />
              <Route path="/rapports" element={<ReportsPage />} />
              <Route path="/classement" element={<RankingPage />} />
              <Route path="/economie" element={<EconomicsPage />} />
              <Route path="/biosecurite" element={<BiosecurityPage />} />
              <Route path="/diagnostics" element={<DiagnosticsPage />} />
              <Route path="/visites" element={<VisitsPage />} />
              <Route path="/commandes" element={<OrdersPage />} />
              <Route path="/abattage" element={<SlaughterPage />} />
              <Route path="/assistance" element={<ConsultationsPage />} />
              <Route path="/prix" element={<PricesPage />} />
              <Route path="/offres" element={<OffersPage />} />
              <Route path="/charges" element={<ChargesPage />} />
              <Route path="/saisies/fiches" element={<EntriesPage />} />
              <Route path="/saisies/pesees" element={<WeighingsPage />} />
            </>}
            {dgeLike && <Route path="/etiquettes" element={<LabelsPage />} />}
            {(dgeLike || r === 'maedr') && <Route path="/diffusion" element={<PublicationsPage />} />}
            {dgeLike && <Route path="/reprise" element={<ImportPage />} />}
            {dgeLike && <Route path="/fermes/nouvelle" element={<FarmNew />} />}
            {(r === 'admin' || r === 'aninf') && <Route path="/admin/journal" element={<AdminAudit />} />}
            {r === 'admin' && <>
              <Route path="/admin/comptes" element={<AdminUsers />} />
              <Route path="/admin/demandes" element={<AdminRequests />} />
              <Route path="/admin/operateurs" element={<AdminOperators />} />
              <Route path="/admin/droits" element={<RightsPage />} />
            </>}
            <Route path="*" element={<NotFound />} />
          </Route>
        ) : r === 'operateur' ? (
          <Route element={<MobileShell />}>
            <Route path="/" element={<Reception />} />
            <Route path="/abattage" element={<SlaughterPage />} />
            <Route path="/lots/:id" element={<LotDetail />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route element={<MobileShell />}>
            <Route path="/" element={r === 'agent' ? <AgentHome /> : <FarmerHome />} />
            {r === 'agent' && <Route path="/ferme" element={<FarmerHome />} />}
            <Route path="/fiche" element={<DailySheet />} />
            <Route path="/pesee" element={<WeighingPage />} />
            <Route path="/sante" element={<HealthReportPage />} />
            <Route path="/sortie" element={<ExitPage />} />
            <Route path="/lots" element={<LotsPage />} />
            <Route path="/lots/:id" element={<LotDetail />} />
            <Route path="/bandes" element={<BandsPage />} />
            <Route path="/bande/nouvelle" element={<BandOpen />} />
            <Route path="/intrants" element={<InputsPage />} />
            <Route path="/vaccinations" element={<VaccinationsPage />} />
            <Route path="/traitements" element={<TreatmentsPage />} />
            <Route path="/biosecurite" element={<BiosecurityPage />} />
            <Route path="/visites" element={<VisitsPage />} />
            <Route path="/charges" element={<ChargesPage />} />
            <Route path="/commandes" element={<OrdersPage />} />
            <Route path="/abattage" element={<SlaughterPage />} />
            <Route path="/assistance" element={<ConsultationsPage />} />
            <Route path="/offres" element={<OffersPage />} />
            <Route path="/prix" element={<PricesPage />} />
            <Route path="/ressources" element={<ResourcesPage />} />
            <Route path="/plus" element={<MoreMenu />} />
            <Route path="/etiquettes" element={<LabelsPage />} />
            <Route path="/saisies/fiches" element={<EntriesPage />} />
            <Route path="/saisies/pesees" element={<WeighingsPage />} />
            <Route path="/fermes/nouvelle" element={<FarmNew />} />
            <Route path="/fermes/:id" element={<FarmDetail />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </HashRouter>
  );
}
