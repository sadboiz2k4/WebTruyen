import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { clearAllHistoryApi, deleteHistoryItemApi, getReadHistoryApi } from '../services/libraryApi';

export default function LichSuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getReadHistoryApi()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError('Bạn cần đăng nhập để xem lịch sử.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (comicId) => {
    await deleteHistoryItemApi(comicId).catch(() => {});
    setItems((prev) => prev.filter((i) => i.comicId !== comicId));
  };

  const handleClearAll = async () => {
    if (!window.confirm('Xóa toàn bộ lịch sử đọc?')) return;
    await clearAllHistoryApi().catch(() => {});
    setItems([]);
  };

  return (
    <div className="page library-page">
      <Header />
      <div className="container">
        <main className="library-page-wrap">
        <div className="library-header-row">
          <h2 className="library-page-title"><FontAwesomeIcon icon={faBookOpen} /> Lịch sử đọc</h2>
          {items.length > 0 && (
            <button className="library-clear-btn" onClick={handleClearAll}>
              Xóa tất cả
            </button>
          )}
        </div>

        {loading && <p className="library-loading">Đang tải...</p>}
        {error && (
          <div className="library-empty">
            <p>{error}</p>
            <Link to="/login" className="library-login-btn">Đăng nhập</Link>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="library-empty">
            <p>Chưa có lịch sử đọc nào.</p>
            <Link to="/tim-truyen" className="library-login-btn">Khám phá truyện</Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ul className="library-list">
            {items.map((item) => (
              <li key={item.comicId} className="library-item">
                <Link to={`/chi-tiet-truyen/${item.comicSlug}`} className="library-item-cover-link">
                  <div className="library-item-info">
                    <span className="library-item-title">{item.comicTitle}</span>
                    <span className="library-item-chapter">
                      Đang đọc: Chương {item.chapterNo}
                      {item.chapterTitle ? ` — ${item.chapterTitle}` : ''}
                    </span>
                    <span className="library-item-date">{item.lastReadAt}</span>
                  </div>
                </Link>
                <div className="library-item-actions">
                  <button
                    className="library-continue-btn"
                    onClick={() => navigate(`/doc-truyen/${item.comicSlug}/${item.chapterId}`)}
                  >
                    Đọc tiếp
                  </button>
                  <button
                    className="library-delete-btn"
                    onClick={() => handleDelete(item.comicId)}
                    title="Xóa khỏi lịch sử"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
