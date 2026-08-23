import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthResolvingSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Shown while onAuthStateChanged resolves on first load, so a logged-in
// user never sees a flash of the login page.
function AuthResolvingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-md space-y-4 px-6">
        <div className="h-4 w-24 animate-pulse rounded-sm bg-paper-line" />
        <div className="h-8 w-2/3 animate-pulse rounded-sm bg-paper-line" />
        <div className="h-40 w-full animate-pulse rounded-sm bg-paper-line" />
      </div>
    </div>
  );
}
