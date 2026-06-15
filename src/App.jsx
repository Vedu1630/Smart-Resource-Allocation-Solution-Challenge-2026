import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import SurveyIntake from './pages/SurveyIntake';
import NeedsIntelligence from './pages/NeedsIntelligence';
import VolunteerRegistry from './pages/VolunteerRegistry';
import MatchEngine from './pages/MatchEngine';
import FieldOperations from './pages/FieldOperations';
import ZoneMap from './pages/ZoneMap';
import ReportAggregator from './pages/ReportAggregator';
import UrgencyAlerts from './pages/UrgencyAlerts';
import ImpactAnalytics from './pages/ImpactAnalytics';
import SkillGapAnalysis from './pages/SkillGapAnalysis';
import Settings from './pages/Settings';
import UrgencyHeatmap from './pages/UrgencyHeatmap';

// Auth Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import MyMissions from './pages/MyMissions';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Manager-only Protected Routes */}
            <Route element={
              <ProtectedRoute requiredRole="manager">
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/needs" element={<NeedsIntelligence />} />
              <Route path="/volunteers" element={<VolunteerRegistry />} />
              <Route path="/match" element={<MatchEngine />} />
              <Route path="/field-ops" element={<FieldOperations />} />
              <Route path="/zones" element={<ZoneMap />} />
              <Route path="/reports" element={<ReportAggregator />} />
              <Route path="/alerts" element={<UrgencyAlerts />} />
              <Route path="/analytics" element={<ImpactAnalytics />} />
              <Route path="/skill-gap" element={<SkillGapAnalysis />} />
              <Route path="/heatmap" element={<UrgencyHeatmap />} />
            </Route>

            {/* General Protected Routes (accessible by Volunteers & Managers) */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/missions" element={<MyMissions />} />
              <Route path="/survey" element={<SurveyIntake />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
