import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import DonorRequestPage from './pages/DonorRequestPage';
import DonorUpdatePage from './pages/DonorUpdatePage';
import DonorRemovePage from './pages/DonorRemovePage';
import DonorsListPage from './pages/DonorsListPage';
import RequestsListPage from './pages/RequestsListPage';
import HelpPage from './pages/HelpPage';
import { useBasketStats } from './hooks/useBasket';

function App() {
  // Get real-time basket stats for header badge
  const basketStats = useBasketStats();
  const requestCount = basketStats.total;
  const isAuthenticated = false;

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Layout 
            requestCount={requestCount}
            isAuthenticated={isAuthenticated}
          />
        }
      >
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="donor-request" element={<DonorRequestPage />} />
        <Route path="donor-update/:code" element={<DonorUpdatePage />} />
        <Route path="donor-remove/:code" element={<DonorRemovePage />} />
        <Route path="donors" element={<DonorsListPage />} />
        <Route path="requests-list" element={<RequestsListPage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>
    </Routes>
  );
}

export default App;