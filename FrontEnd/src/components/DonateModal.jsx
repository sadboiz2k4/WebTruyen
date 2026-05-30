import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { getWalletBalanceApi, transferWalletApi } from '../services/walletApi';

const PRESETS = [50, 100, 200, 500];

export default function DonateModal({ authorName, isOpen, onClose }) {
  const [balance, setBalance] = useState(null);
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(null);
    setCustom('');
    setNote('');
    setMessage('');
    setIsError(false);
    getWalletBalanceApi()
      .then((data) => setBalance(typeof data === 'number' ? data : (data?.balance ?? 0)))
      .catch(() => setBalance(null));
  }, [isOpen]);

  if (!isOpen) return null;

  const amount = selected ?? (custom ? parseInt(custom) : 0);

  const handleDonate = async () => {
    if (!amount || amount <= 0) {
      setMessage('Vui lòng chọn hoặc nhập số xu.');
      setIsError(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const result = await transferWalletApi(authorName, amount, note || `Ủng hộ tác giả ${authorName}`);
      const authorReceived = result?.authorReceived ?? Math.floor(amount * 0.6);
      setMessage(`Đã ủng hộ ${amount.toLocaleString()} xu! Tác giả nhận được ${Number(authorReceived).toLocaleString()} xu.`);
      setIsError(false);
      setSelected(null);
      setCustom('');
      setNote('');
      setBalance((b) => (b !== null ? b - amount : null));
    } catch (err) {
      setMessage(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate-overlay" onClick={onClose}>
      <div className="donate-modal" onClick={(e) => e.stopPropagation()}>
        <button className="donate-close" onClick={onClose} aria-label="Đóng">×</button>

        <div className="donate-header">
          <div className="donate-icon"><FontAwesomeIcon icon={faHeart} /></div>
          <h2 className="donate-title">Ủng hộ tác giả</h2>
          <p className="donate-author-name">{authorName}</p>
        </div>

        {balance !== null && (
          <p className="donate-balance">
            Số dư của bạn: <strong>{balance.toLocaleString()} xu</strong>
          </p>
        )}

        {amount > 0 && (
          <p className="donate-fee-info">
            Tác giả nhận: <strong>{Math.floor(amount * 0.6).toLocaleString()} xu</strong>
            <span className="donate-fee-detail"> (phí sàn 40%: {Math.ceil(amount * 0.4).toLocaleString()} xu)</span>
          </p>
        )}

        <div className="donate-presets">
          {PRESETS.map((val) => (
            <button
              key={val}
              type="button"
              className={`donate-preset-btn${selected === val && !custom ? ' active' : ''}`}
              onClick={() => { setSelected(val); setCustom(''); setMessage(''); }}
            >
              {val} xu
            </button>
          ))}
        </div>

        <input
          className="donate-custom-input"
          type="number"
          min="1"
          placeholder="Hoặc nhập số xu tùy ý..."
          value={custom}
          onChange={(e) => { setCustom(e.target.value); setSelected(null); setMessage(''); }}
        />

        <input
          className="donate-custom-input"
          type="text"
          placeholder="Lời nhắn cho tác giả (tùy chọn)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
        />

        {message && (
          <p className={`donate-message${isError ? ' donate-message--error' : ' donate-message--success'}`}>
            {message}
          </p>
        )}

        <button
          className="donate-confirm-btn"
          onClick={handleDonate}
          disabled={loading || !amount || amount <= 0}
        >
          {loading ? 'Đang gửi...' : `Ủng hộ ${amount ? amount.toLocaleString() + ' xu' : ''}`}
        </button>
      </div>
    </div>
  );
}
