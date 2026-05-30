import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { getFollowedComicsApi, unfollowComicApi } from '../services/libraryApi';

const STATUS_LABELS = {
  READING: 'Đang đọc',
  COMPLETED: 'Đã đọc xong',
  PLAN_TO_READ: 'Chờ đọc',
};

const STATUS_BADGE_CLASS = {
  READING: 'library-badge--reading',
  COMPLETED: 'library-badge--completed',
  PLAN_TO_READ: 'library-badge--plan',
};

const TABS = ['Tất cả', 'Đang đọc', 'Đã đọc xong', 'Chờ đọc'];

export default function TuTruyenPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả');

  useEffect(() => {
    getFollowedComicsApi()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError('Bạn cần đăng nhập để xem tủ truyện.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUnfollow = async (comicId) => {
    if (!window.confirm('Bỏ theo dõi truyện này?')) return;
    await unfollowComicApi(comicId).catch(() => {});
    setItems((prev) => prev.filter((i) => i.comicId !== comicId));
  };

  const filtered =
    activeTab === 'Tất cả'
      ? items
      : items.filter((i) => STATUS_LABELS[i.readStatus] === activeTab);

  return (
    <div className="page library-page">
      <Header />
      <div className="container">
      <main className="library-page-wrap">
        <div className="library-header-row">
          <h2 className="library-page-title"><FontAwesomeIcon icon={faBookmark} /> Tủ truyện</h2>
          <span className="library-count">{items.length} truyện đang theo dõi</span>
        </div>

        <div className="library-tabs">
          {TABS.map((tab) => {
            const count =
              tab === 'Tất cả'
                ? items.length
                : items.filter((i) => STATUS_LABELS[i.readStatus] === tab).length;
            return (
              <button
                key={tab}
                className={`library-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {count > 0 && <span className="library-tab-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {loading && <p className="library-loading">Đang tải...</p>}
        {error && (
          <div className="library-empty">
            <p>{error}</p>
            <Link to="/login" className="library-login-btn">Đăng nhập</Link>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="library-empty">
            <p>
              {activeTab === 'Tất cả'
                ? 'Chưa theo dõi truyện nào.'
                : `Không có truyện nào trong mục "${activeTab}".`}
            </p>
            {activeTab === 'Tất cả' && (
              <Link to="/tim-truyen" className="library-login-btn">Khám phá truyện</Link>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <ul className="library-list">
            {filtered.map((item) => (
              <li key={item.comicId} className="library-item">
                <Link to={`/chi-tiet-truyen/${item.slug}`} className="library-item-cover-link">
                  <div className="library-item-info">
                    <span className="library-item-title">{item.title}</span>
                    <span className="library-item-chapter">
                      {item.latestChapterNo ? `Mới nhất: Chương ${item.latestChapterNo}` : 'Chưa có chapter'}
                    </span>
                    <span className="library-item-date">Theo dõi: {item.followedAt}</span>
                  </div>
                </Link>
                <div className="library-item-actions">
                  <span className={`library-badge ${STATUS_BADGE_CLASS[item.readStatus] || 'library-badge--plan'}`}>
                    {STATUS_LABELS[item.readStatus] || 'Chờ đọc'}
                  </span>
                  <button
                    className="library-delete-btn"
                    onClick={() => handleUnfollow(item.comicId)}
                    title="Bỏ theo dõi"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      </div>
      <Footer />
    </div>
  );
}
