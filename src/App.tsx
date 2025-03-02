import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { CarProfiles } from './pages/CarProfiles';
import ExpenseTracker from './pages/ExpenseTracker';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import { Maintenance } from './pages/Maintenance';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/cars" element={
                <PrivateRoute>
                  <Layout>
                    <CarProfiles />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/calendar" element={
                <PrivateRoute>
                  <Layout>
                    <Calendar />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/expenses" element={
                <PrivateRoute>
                  <Layout>
                    <ExpenseTracker />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/analytics" element={
                <PrivateRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/maintenance" element={
                <PrivateRoute>
                  <Layout>
                    <Maintenance />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/documents" element={
                <PrivateRoute>
                  <Layout>
                    <Documents />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AuthProvider>
        </Router>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

export default App;
