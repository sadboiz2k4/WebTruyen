import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { registerApi } from '../services/authApi';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await registerApi({ name, email, password, confirmPassword });
      setMessage(result?.message || 'Dang ky thanh cong');
      setMessageType('success');

      window.setTimeout(() => {
        navigate('/');
      }, 700);
    } catch (error) {
      setMessage(error.message || 'Dang ky that bai');
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
            <span>Đăng ký</span>
          </div>

          <section className="login-panel">
            <h1>ĐĂNG KÝ</h1>
            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="register-password">Mật khẩu</label>
              <input
                id="register-password"
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <label htmlFor="confirm-password">Xác nhận mật khẩu</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {message ? (
                <p className={`form-message ${messageType === 'success' ? 'form-message--success' : 'form-message--error'}`}>
                  {message}
                </p>
              ) : null}

              <div className="login-links login-links--single">
                <Link to="/login">Đăng nhập</Link>
              </div>

              <button className="btn-login" type="submit" disabled={loading}>
                {loading ? 'Dang xu ly...' : 'Đăng ký'}
              </button>

              <button className="btn-google" type="button">
                <span>G</span>
                Đăng ký bằng tài khoản Google
              </button>
            </form>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
