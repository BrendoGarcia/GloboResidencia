import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import MaximizedCameraViewPage from './pages/MaximizedCameraViewPage';
import { NotificationProvider } from './components/NotificationSystem';
import DashboardPage from './pages/DashboardPage'; // Importando a nova página de dashboard

const isAuthenticated = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/"
            element={
              <PrivateRoute>
                <MainPage />
              </PrivateRoute>
            }
          />
          <Route path="/camera-viewer" element={<MaximizedCameraViewPage />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } 
          />
          <Route path="*" element={<Navigate to={isAuthenticated() ? "/" : "/login"} />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;

