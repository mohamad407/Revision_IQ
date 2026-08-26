import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import IntroPage from './pages/IntroPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPassword';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import QuizPage from './pages/QuizPage';
import PredictorListPage from './pages/PredictorListPage';
import PredictorDetailPage from './pages/PredictorDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <ProtectedRoute>
                <DocumentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/predictor"
            element={
              <ProtectedRoute>
                <PredictorListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/predictor/:id"
            element={
              <ProtectedRoute>
                <PredictorDetailPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<IntroPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
