import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { forgotPasswordApi } from '../services/authApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await forgotPasswordApi(email);
      setMessage(result?.message || 'Đã gửi email hướng dẫn.');
      setMessageType('success');
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
            <span>Quên mật khẩu</span>
          </div>

          <section className="login-panel auth-card">
            <div className="auth-card__icon">
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <h2 className="auth-card__title">Quên mật khẩu?</h2>
            <p className="auth-card__desc">
              Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu có hiệu lực trong <strong>1 giờ</strong>.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {message && (
                <p className={`form-message ${messageType === 'success' ? 'form-message--success' : 'form-message--error'}`}>
                  {message}
                </p>
              )}

              <button className="btn-login" type="submit" disabled={loading || messageType === 'success'} style={{ marginTop: 8 }}>
                {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
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
