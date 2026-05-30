import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import { createReportAppealApi } from '../services/interactionApi';

export default function AppealModal({ isOpen, reportId, targetTitle, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Vui lòng nhập lý do kháng nghị');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createReportAppealApi(reportId, 'CONTENT', message);
      setMessage('');
      setError('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message || 'Lỗi khi gửi kháng nghị. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Kháng nghị báo cáo</h2>
          <button className="modal-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <div className="modal-body">
          {targetTitle && (
            <p className="report-target">
              <strong>Nội dung:</strong> {targetTitle}
            </p>
          )}

          <div className="appeal-info">
            <p>Bạn có <strong>7 ngày</strong> để kháng nghị từ khi nhận thông báo.</p>
            <p>Vui lòng giải thích lý do bạn cho rằng báo cáo này không chính xác.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="form-label">Nội dung kháng nghị</label>

            <textarea
              className="form-textarea"
              placeholder="Nhập lý do kháng nghị của bạn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="6"
              disabled={loading}
            />

            {error && <p className="error-message">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={loading || !message.trim()}>
                {loading ? 'Đang gửi...' : 'Gửi kháng nghị'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .appeal-info {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .appeal-info p {
          margin: 6px 0;
        }
      `}</style>
    </div>
  );
}
