import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/campus/Dashboard';
import RoomManagement from './components/campus/RoomManagement';
import StudentDetails from './components/campus/StudentDetails';
import FeeManagement from './components/campus/FeeManagement';
import SecurityDeposit from './components/campus/SecurityDeposit';
import Maintenance from './components/campus/Maintenance';
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Bootstrap JS explicitly if needed, or rely on it being loaded
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<RoomManagement />} />
          <Route path="/students" element={<StudentDetails />} />
          <Route path="/fees" element={<FeeManagement />} />
          <Route path="/security" element={<SecurityDeposit />} />
          <Route path="/maintenance" element={<Maintenance />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
