import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StudentProvider } from './context/StudentContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/campus/Dashboard';
import Login from './components/auth/Login';
import HostelManagement from './components/campus/HostelManagement';
import RoomManagement from './components/campus/RoomManagement';
import StudentDetails from './components/campus/StudentDetails';
import FeeManagement from './components/campus/FeeManagement';
import Complaints from './components/campus/Complaints';
import Attendance from './components/campus/Attendance';
import HealthIssues from './components/campus/HealthIssues';
import ParentVisits from './components/campus/ParentVisits';
import MessManagement from './components/campus/MessManagement';
import CampusHome from './components/campus/CampusHome';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StudentProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Navigate to="/" replace />} />
                      <Route path="/hostels" element={<HostelManagement />} />
                      <Route path="/rooms" element={<RoomManagement />} />
                      <Route path="/students" element={<StudentDetails />} />
                      <Route path="/fees" element={<FeeManagement />} />
                      <Route path="/complaints" element={<Complaints />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/health" element={<HealthIssues />} />
                      <Route path="/parent-visits" element={<ParentVisits />} />
                      <Route path="/mess" element={<MessManagement />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </StudentProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
