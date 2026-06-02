import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { meApi } from '../services/authApi';

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    meApi()
      .then(data => {
        if (!data?.authenticated) { setStatus('unauth'); return; }
        setStatus(data.isAdmin ? 'ok' : 'forbidden');
      })
      .catch(() => setStatus('unauth'));
  }, []);

  if (status === 'loading') return null;
  if (status === 'unauth') return <Navigate to="/login" replace />;
  if (status === 'forbidden') return <Navigate to="/" replace />;
  return children;
}
