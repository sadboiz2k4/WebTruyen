import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { resetPasswordApi } from '../services/authApi';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  if (!token) {
    return (
      <div className="page page--login">
        <Header />
        <div className="container login-container">
          <main className="login-main">
            <section className="login-panel auth-card">
              <div className="auth-card__icon auth-card__icon--error">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <h2 className="auth-card__title">Link không hợp lệ</h2>
              <p className="auth-card__desc">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
              <Link to="/forgot-password" className="btn-login" style={{ display: 'block', textAlign: 'center', marginTop: 16, textDecoration: 'none' }}>
                Yêu cầu link mới
              </Link>
            </section>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp.');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const result = await resetPasswordApi(token, newPassword);
      setMessage(result?.message || 'Đặt lại mật khẩu thành công!');
      setMessageType('success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--login">
      <Header />
      <div className="container login-container">
        <main className="login-main">
          <div className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            <span>Đặt lại mật khẩu</span>
          </div>

          <section className="login-panel auth-card">
            <div className="auth-card__icon">
              <FontAwesomeIcon icon={faLock} />
            </div>
            <h2 className="auth-card__title">Đặt lại mật khẩu</h2>
            <p className="auth-card__desc">
              Nhập mật khẩu mới cho tài khoản của bạn.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="new-password">Mật khẩu mới</label>
              <input
                id="new-password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />

              <label htmlFor="confirm-new-password">Xác nhận mật khẩu</label>
              <input
                id="confirm-new-password"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {message && (
                <p className={`form-message ${messageType === 'success' ? 'form-message--success' : 'form-message--error'}`}>
                  {message}
                </p>
              )}

              <button className="btn-login" type="submit" disabled={loading || messageType === 'success'} style={{ marginTop: 8 }}>
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>

            <div className="auth-card__footer">
              <Link to="/login">← Quay lại đăng nhập</Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
