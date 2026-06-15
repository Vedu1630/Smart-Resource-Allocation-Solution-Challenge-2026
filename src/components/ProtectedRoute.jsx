import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Not logged in, redirect to login page with the return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role authorization check
    if (requiredRole && currentUser.role !== requiredRole) {
        if (currentUser.role === 'volunteer') {
            return <Navigate to="/missions" replace />;
        } else {
            return <Navigate to="/" replace />;
        }
    }

    return children;
}
