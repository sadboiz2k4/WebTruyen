import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { reportContentApi } from '../services/interactionApi';

export default function ReportModal({ isOpen, targetType, targetId, targetTitle, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reportReasons = [
    'Nội dung không phù hợp',
    'Quấy rối/Bạo lực',
    'Vi phạm bản quyền',
    'Spam',
    'Lừa đảo',
    'Lý do khác',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = reason === 'Lý do khác' ? otherText : reason;
    if (!finalReason || !finalReason.trim()) {
      setError('Vui lòng chọn hoặc nhập lý do báo cáo');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await reportContentApi(targetType, targetId, finalReason);
      setReason('');
      setOtherText('');
      setError('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message || 'Lỗi khi gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Báo cáo vi phạm</h2>
          <button className="modal-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <div className="modal-body">
          {targetTitle && (
            <p className="report-target">
              <strong>Báo cáo:</strong> {targetTitle}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label className="form-label">Lý do báo cáo</label>

            <div className="report-reasons">
              {reportReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`reason-btn ${reason === r ? 'reason-btn--active' : ''}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === 'Lý do khác' && (
              <textarea
                className="form-textarea"
                placeholder="Nhập lý do báo cáo của bạn..."
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                rows="4"
              />
            )}

            {error && <p className="error-message">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  loading || !(reason === 'Lý do khác' ? otherText.trim() : reason.trim())
                }
              >
                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: 20px;
        }

        .report-target {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .form-label {
          display: block;
          margin-bottom: 10px;
          font-weight: 500;
        }

        .report-reasons {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-bottom: 15px;
        }

        .reason-btn {
          background: #f5f5f5;
          border: 2px solid transparent;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .reason-btn:hover {
          background: #e8e8e8;
        }

        .reason-btn--active {
          background: #fff;
          border-color: #007bff;
          color: #007bff;
          font-weight: 500;
        }

        .form-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }

        .error-message {
          color: #d32f2f;
          font-size: 14px;
          margin: 10px 0;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }
      `}</style>
    </div>
  );
}
