import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StudentProvider } from './context/StudentContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/campus/Dashboard';
import RoomManagement from './components/campus/RoomManagement';
import StudentDetails from './components/campus/StudentDetails';
import FeeManagement from './components/campus/FeeManagement';
import SecurityDeposit from './components/campus/SecurityDeposit';
import Maintenance from './components/campus/Maintenance';
import Attendance from './components/campus/Attendance';
import HealthIssues from './components/campus/HealthIssues';
import ParentVisits from './components/campus/ParentVisits';
import MessManagement from './components/campus/MessManagement';
import CampusHome from './components/campus/CampusHome';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function App() {
  return (
    <ThemeProvider>
      <StudentProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<CampusHome />} />
              {/* Keeping other routes if direct access is needed, but they will show the full page */}
              <Route path="/rooms" element={<CampusHome />} />
              <Route path="/students" element={<CampusHome />} />
              <Route path="/fees" element={<CampusHome />} />
              <Route path="/security" element={<CampusHome />} />
              <Route path="/maintenance" element={<CampusHome />} />
              <Route path="/attendance" element={<CampusHome />} />
              <Route path="/health" element={<CampusHome />} />
              <Route path="/parent-visits" element={<CampusHome />} />
              <Route path="/mess" element={<CampusHome />} />
            </Routes>
          </Layout>
        </Router>
      </StudentProvider>
    </ThemeProvider>
  );
}

export default App;
