import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StudentProvider } from './context/StudentContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/campus/Dashboard';
import Login from './components/auth/Login';
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
                      <Route path="/" element={<CampusHome />} />
                      <Route path="/hostels" element={<CampusHome />} />
                      <Route path="/rooms" element={<CampusHome />} />
                      <Route path="/students" element={<CampusHome />} />
                      <Route path="/fees" element={<CampusHome />} />
                      <Route path="/complaints" element={<CampusHome />} />
                      <Route path="/attendance" element={<CampusHome />} />
                      <Route path="/health" element={<CampusHome />} />
                      <Route path="/parent-visits" element={<CampusHome />} />
                      <Route path="/mess" element={<CampusHome />} />
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
