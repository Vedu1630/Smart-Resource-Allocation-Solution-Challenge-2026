import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
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

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/survey" element={<SurveyIntake />} />
            <Route path="/needs" element={<NeedsIntelligence />} />
            <Route path="/volunteers" element={<VolunteerRegistry />} />
            <Route path="/match" element={<MatchEngine />} />
            <Route path="/field-ops" element={<FieldOperations />} />
            <Route path="/zones" element={<ZoneMap />} />
            <Route path="/reports" element={<ReportAggregator />} />
            <Route path="/alerts" element={<UrgencyAlerts />} />
            <Route path="/analytics" element={<ImpactAnalytics />} />
            <Route path="/skill-gap" element={<SkillGapAnalysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/heatmap" element={<UrgencyHeatmap />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
