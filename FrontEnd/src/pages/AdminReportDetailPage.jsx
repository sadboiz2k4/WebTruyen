import { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { meApi } from '../services/authApi';
import { getAdminReportDetailApi, resolveReportApi } from '../services/adminApi';

export default function AdminReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Helpers: translate enums
  const getStatusLabel = (s) => {
    if (!s) return '—';
    return s === 'PENDING' ? 'Chờ xử lý'
      : s === 'FLAGGED' ? 'Tự động gắn cờ'
      : s === 'RESOLVED' ? 'Đã xử lý'
      : s === 'DISMISSED' ? 'Bỏ qua'
      : s === 'APPROVED' ? 'Đã chấp nhận'
      : s === 'REJECTED' ? 'Từ chối'
      : s;
  };

  const getTypeLabel = (t) => {
    if (!t) return '—';
    return t === 'COMIC' ? 'Truyện' : t === 'COMMENT' ? 'Bình luận' : t === 'CHAPTER' ? 'Chương' : t;
  };

  useEffect(() => {
    meApi()
      .then((d) => { if (!d?.authenticated) navigate('/login'); else setIsAdmin(true); })
      .catch(() => navigate('/login'))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getAdminReportDetailApi(id, 'CONTENT')
      .then((d) => { if (!mounted) return; setDetail(d); })
      .catch((e) => setActionMsg(e.message || 'Không tải được chi tiết'))
      .finally(() => { if (!mounted) return; setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  const outlet = useOutletContext();

  const handleResolve = async (newStatus) => {
    try {
      const scope = detail?.target_type || detail?.targetType || 'CONTENT';
      if (newStatus === 'DISMISSED') {
        await resolveReportApi(Number(id), newStatus, scope, '');
      } else {
        // Prefer inline adminNote if provided, otherwise fall back to modal
        let noteToSend = adminNote?.trim();
        if (!noteToSend) {
          noteToSend = await outlet.openAdminNote(detail?.reviewer_note || '');
        }
        await resolveReportApi(Number(id), newStatus, scope, noteToSend || '');
      }
      setActionMsg('Đã cập nhật trạng thái');
      setTimeout(() => navigate('/admin?tab=reports'), 600);
    } catch (e) { setActionMsg(e.message); }
  };

  if (!authChecked) return (
    <div className="page admin-page">
      <div className="container">
        <main style={{ padding: '24px 0' }}>
          <div className="empty-preview">Đang kiểm tra quyền...</div>
        </main>
      </div>
    </div>
  );

  return (
    <div className="page admin-page">
      <div className="container">
        <main style={{ padding: '24px 0' }}>
          <h2>Chi tiết báo cáo #{id}</h2>
          {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}
          {loading ? <div className="empty-preview">Đang tải...</div> : (
            detail ? (
              <div style={{ background: 'var(--bg-2)', padding: 18, borderRadius: 8, boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
                <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 10, columnGap: 16, margin: 0 }}>
                  <dt style={{ fontWeight: 700, color: 'var(--text)' }}>Người báo cáo</dt>
                  <dd style={{ margin: 0 }}>{detail.reporter_name || detail.reporterId}</dd>

                  <dt style={{ fontWeight: 700, color: 'var(--text)' }}>Loại</dt>
                  <dd style={{ margin: 0 }}>{getTypeLabel(detail.target_type || detail.targetType)}</dd>

                  <dt style={{ fontWeight: 700, color: 'var(--text)' }}>Đích</dt>
                  <dd style={{ margin: 0 }}>{detail.target_title || detail.targetTitle || detail.target_slug || `#${detail.target_id || ''}`}</dd>

                  <dt style={{ fontWeight: 700, color: 'var(--text)' }}>Lý do</dt>
                  <dd style={{ margin: 0, color: 'var(--text-sub)' }}>{detail.reason}</dd>

                  <dt style={{ fontWeight: 700, color: 'var(--text)' }}>Trạng thái</dt>
                  <dd style={{ margin: 0 }}>
                    <span className={`admin-badge admin-badge--${detail.status === 'PENDING' ? 'orange' : detail.status === 'FLAGGED' ? 'blue' : detail.status === 'RESOLVED' ? 'green' : 'gray'}`}>
                      {getStatusLabel(detail.status)}
                    </span>
                  </dd>
                </dl>

                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button className="admin-btn admin-btn--sm admin-btn--success" onClick={() => handleResolve('RESOLVED')}>Đánh dấu: Đã xử lý</button>
                  <button className="admin-btn admin-btn--sm" onClick={() => handleResolve('DISMISSED')}>Bỏ qua</button>
                  <button className="admin-btn admin-btn--sm" onClick={() => navigate('/admin?tab=reports')}>Quay lại</button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Ghi chú của quản trị viên (tùy chọn)</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Nhập ghi chú gửi kèm khi đánh dấu đã xử lý (ví dụ: lý do, hướng dẫn kháng nghị)..."
                    style={{ width: '100%', minHeight: 80, padding: 8, borderRadius: 6, border: '1px solid var(--line)', resize: 'vertical' }}
                  />
                </div>

                <h4 style={{ marginTop: 18 }}>Lịch sử xử lý</h4>
                <div style={{ maxHeight: 320, overflow: 'auto', borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                  {(detail.auditLogs || []).length === 0 && (
                    <div style={{ color: 'var(--text-sub)', padding: '8px 0' }}>Chưa có lịch sử</div>
                  )}
                  {(detail.auditLogs || []).map((l, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px dashed var(--line)' }}>
                      <div style={{ fontSize: 13 }}><strong>{l.action}</strong> — <span style={{ color: 'var(--text-sub)' }}>bởi {l.actor_user_id || l.actorUserId || 'Hệ thống'}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{l.ts || l.created_at} {l.note ? `· ${l.note}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="empty-preview">Không tìm thấy báo cáo</div>
          )}
        </main>
      </div>
    </div>
  );
}
