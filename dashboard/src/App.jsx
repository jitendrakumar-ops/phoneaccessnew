import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LiveAlertBanner from './components/LiveAlertBanner';
import SearchBar from './components/SearchBar';
import EmptyDeviceState from './components/EmptyDeviceState';
import { DASHBOARD_ROUTES, SEARCHABLE_ROUTE_KEYS } from './config/navigation';
import { DashboardProvider } from './context/DashboardContext';
import { useDashboardController } from './hooks/useDashboardController';
import OverviewPage from './pages/OverviewPage';
import ControlsPage from './pages/ControlsPage';
import SmsPage from './pages/SmsPage';
import CallsPage from './pages/CallsPage';
import MediaPage from './pages/MediaPage';
import RecordingsPage from './pages/RecordingsPage';
import WhatsAppPage from './pages/WhatsAppPage';
import RelayPage from './pages/RelayPage';

const routeElements = {
  overview: <OverviewPage />,
  controls: <ControlsPage />,
  sms: <SmsPage />,
  relay: <RelayPage />,
  calls: <CallsPage />,
  media: <MediaPage />,
  recordings: <RecordingsPage />,
  whatsapp: <WhatsAppPage />,
};

export default function App() {
  const location = useLocation();
  const dashboard = useDashboardController(location.pathname);

  return (
    <DashboardProvider value={dashboard}>
      <div className="dashboard-container">
        <Sidebar connected={dashboard.connected} syncing={dashboard.syncing} fetchDB={dashboard.fetchDB} />

        <main className="main-content">
          <LiveAlertBanner liveAlert={dashboard.liveAlert} />

          <Topbar
            activeRoute={dashboard.activeRoute}
            db={dashboard.db}
            selectedDeviceId={dashboard.selectedDeviceId}
            setSelectedDeviceId={dashboard.setSelectedDeviceId}
          />

          {!dashboard.selectedDeviceId ? (
            <EmptyDeviceState />
          ) : (
            <>
              {SEARCHABLE_ROUTE_KEYS.includes(dashboard.activeTab) ? (
                <SearchBar searchQuery={dashboard.searchQuery} setSearchQuery={dashboard.setSearchQuery} />
              ) : null}

              <Routes>
                {DASHBOARD_ROUTES.map(route => (
                  <Route key={route.key} path={route.path} element={routeElements[route.key]} />
                ))}
                <Route path="*" element={<Navigate to="/overview" replace />} />
              </Routes>
            </>
          )}
        </main>
      </div>
    </DashboardProvider>
  );
}
