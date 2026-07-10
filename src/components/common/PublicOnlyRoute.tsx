import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * PublicOnlyRoute – redirects authenticated users away from /login and /register.
 * Buyers → /buyer/dashboard, Sellers → /seller/dashboard.
 */
export const PublicOnlyRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const dashboardPath = `/${user.role}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
};
