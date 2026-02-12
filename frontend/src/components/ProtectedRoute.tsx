import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = '/dashboard'
}: ProtectedRouteProps) {
  const userStr = localStorage.getItem('user');
  if (!userStr || userStr === 'undefined') {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userStr);
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
