import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { googleLoginApi, loginApi } from '../services/authApi';
import { getAdminStatsApi } from '../services/adminApi';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await loginApi({ email, password });
      setMessage(result?.message || 'Dang nhap thanh cong');
      setMessageType('success');

      window.setTimeout(async () => {
        try {
          await getAdminStatsApi();
          navigate('/admin');
        } catch {
          navigate('/');
        }
      }, 500);
    } catch (error) {
      setMessage(error.message || 'Dang nhap that bai');
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
            <span>Đăng nhập</span>
          </div>

          <section className="login-panel">
            <h1>ĐĂNG NHẬP</h1>
            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {message ? (
                <p className={`form-message ${messageType === 'success' ? 'form-message--success' : 'form-message--error'}`}>
                  {message}
                </p>
              ) : null}

              <div className="login-links">
                <Link to="/forgot-password">Quên mật khẩu</Link>
                <Link to="/register">Đăng ký</Link>
              </div>

              <button className="btn-login" type="submit" disabled={loading}>
                {loading ? 'Dang xu ly...' : 'Đăng nhập'}
              </button>

              <div className="btn-google-wrap">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      await googleLoginApi(credentialResponse.credential);
                      window.setTimeout(async () => {
                        try { await getAdminStatsApi(); navigate('/admin'); }
                        catch { navigate('/'); }
                      }, 300);
                    } catch (error) {
                      setMessage(error.message || 'Đăng nhập Google thất bại');
                      setMessageType('error');
                    }
                  }}
                  onError={() => {
                    setMessage('Đăng nhập Google thất bại');
                    setMessageType('error');
                  }}
                  text="signin_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </form>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
