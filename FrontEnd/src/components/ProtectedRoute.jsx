import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { meApi } from '../services/authApi';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    meApi()
      .then(data => setStatus(data?.authenticated ? 'ok' : 'unauth'))
      .catch(() => setStatus('unauth'));
  }, []);

  if (status === 'loading') return null;
  if (status === 'unauth') return <Navigate to="/login" replace />;
  return children;
}
