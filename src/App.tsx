import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import DonorRequestPage from './pages/DonorRequestPage';
import DonorsListPage from './pages/DonorsListPage';
import RequestsListPage from './pages/RequestsListPage';
import HelpPage from './pages/HelpPage';

function App() {
  // TODO: These will be managed by state management in later phases
  const requestCount = 0;
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
        <Route path="donors" element={<DonorsListPage />} />
        <Route path="requests-list" element={<RequestsListPage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>
    </Routes>
  );
}

export default App;