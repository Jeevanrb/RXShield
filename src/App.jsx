import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MedicalProvider } from './context/MedicalContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <MedicalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </MedicalProvider>
  );
};

export default App;
