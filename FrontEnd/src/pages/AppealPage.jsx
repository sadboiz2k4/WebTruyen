import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { meApi } from '../services/authApi';
import { createReportAppealApi } from '../services/interactionApi';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AppealPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [targetTitle, setTargetTitle] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportedAt, setReportedAt] = useState('');
  const location = useLocation();

  useEffect(() => {
    meApi()
      .then((d) => {
        if (!d?.authenticated) navigate('/login');
        else setIsAuth(true);
      })
      .catch(() => navigate('/login'))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    // load appeal status and admin note (author view)
    async function loadAppeal() {
      try {
        const base = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
        const resp = await fetch(`${base}/api/author/reports/${reportId}/appeal-status`, { credentials: 'include' });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          // if unauthorized or not owner, backend will return message
          if (data?.message) setError(data.message);
          return;
        }
        if (data?.admin_note) setAdminNote(data.admin_note);
        // If API returned report metadata (no appeal yet), use it
        if (data && data.found === false) {
          if (data.targetTitle) setTargetTitle(data.targetTitle);
          if (data.reason) setReportReason(data.reason);
          if (data.reportedAt) setReportedAt(data.reportedAt);
        }
      } catch (e) {
        // ignore network failures silently
      }
    }

    if (authChecked && isAuth) loadAppeal();
  }, [authChecked, isAuth, reportId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Vui lòng nhập lý do kháng nghị');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createReportAppealApi(Number(reportId), 'CONTENT', message);
      setSuccess(true);
      setMessage('');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err?.message || 'Lỗi khi gửi kháng nghị. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) return (
    <div className="page">
      <Header />
      <div className="container">
        <div className="empty-preview">Đang kiểm tra quyền...</div>
      </div>
    </div>
  );
  if (!isAuth) return null;

  return (
    <div className="page">
      <Header />
      <div className="container">
        <main style={{ margin: '40px 0' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#333', margin: '0 0 12px' }}>Kháng nghị báo cáo</h1>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Báo cáo #{reportId}</p>
          </div>

          {(location?.state?.notifTitle || targetTitle) && (
            <div style={{ marginBottom: 12 }}>
              <strong>{location?.state?.notifTitle || targetTitle}</strong>
            </div>
          )}

          {(location?.state?.notifMessage || reportReason) && (
            <div style={{ marginBottom: 12, whiteSpace: 'pre-wrap', color: '#444' }}>{location?.state?.notifMessage || reportReason}</div>
          )}

          {(location?.state?.notifCreatedAt || reportedAt) && (
            <div style={{ marginBottom: 12, color: '#777', fontSize: 13 }}>Thời gian báo cáo: {location?.state?.notifCreatedAt || reportedAt}</div>
          )}
          {success && (
            <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
              <FontAwesomeIcon icon={faCheck} /> Kháng nghị đã được gửi thành công. Đang chuyển hướng...
            </div>
          )}

          {error && (
            <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
              <FontAwesomeIcon icon={faXmark} /> {error}
            </div>
          )}

          {adminNote && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
              <strong>Ghi chú của admin:</strong>
              <div style={{ marginTop: 6 }}>{adminNote}</div>
            </div>
          )}

          <div style={{ background: '#e3f2fd', border: '1px solid #90caf9', borderLeft: '4px solid #2196f3', padding: '12px', borderRadius: '4px', marginBottom: '24px', fontSize: '14px' }}>
            <p style={{ margin: '6px 0' }}><strong>Hạn kháng nghị:</strong> 7 ngày kể từ khi nhận thông báo</p>
            <p style={{ margin: '6px 0' }}>Vui lòng giải thích rõ lý do bạn cho rằng báo cáo này không chính xác.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>Nội dung kháng nghị</label>
            <textarea
              placeholder="Nhập lý do kháng nghị của bạn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="8"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'auto'
              }}
            />

            {/* Debug / info: show whether API returned existing appeal or just report metadata */}
            {(targetTitle || reportReason || reportedAt) && (
              <div style={{ marginTop: 12, color: '#555', fontSize: 13 }}>
                <div><strong>Tiêu đề:</strong> {targetTitle}</div>
                <div><strong>Lý do báo cáo:</strong> {reportReason}</div>
                <div><strong>Thời gian báo cáo:</strong> {reportedAt}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={loading}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #ddd',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !message.trim()}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: '#2196f3',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: (loading || !message.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: (loading || !message.trim()) ? 0.6 : 1,
                }}
              >
                {loading ? 'Đang gửi...' : 'Gửi kháng nghị'}
              </button>
            </div>
          </form>
        </div>
      </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
