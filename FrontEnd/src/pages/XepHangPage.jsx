import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCommentDots, faStar, faHeart, faFire, faChartBar, faCalendarDay, faCalendarWeek, faCalendar, faBook, faTrophy, faPen, faTag, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { searchComicsApi } from '../services/searchApi';

const RANK_TYPES = [
  { label: 'Top All', value: 'top-all', icon: faTrophy, sort: 'rating' },
  { label: 'Top Tháng', value: 'top-thang', icon: faCalendar, sort: 'rating' },
  { label: 'Top Tuần', value: 'top-tuan', icon: faCalendarWeek, sort: 'follow' },
  { label: 'Top Ngày', value: 'top-ngay', icon: faCalendarDay, sort: 'updated' },
  { label: 'Top Follow', value: 'top-follow', icon: faHeart, sort: 'follow' },
  { label: 'Yêu Thích', value: 'yeu-thich', icon: faStar, sort: 'rating' },
  { label: 'Mới Cập Nhật', value: 'moi-cap-nhat', icon: faFire, sort: 'updated' },
  { label: 'Truyện Mới', value: 'truyen-moi', icon: faBook, sort: 'new' },
  { label: 'Số Chapter', value: 'so-chapter', icon: faChartBar, sort: 'comment' },
  { label: 'Truyện Full', value: 'truyen-full', icon: faBook, sort: 'rating' },
];

const STATUS_MAP = {
  'truyen-full': 'Hoàn thành',
};

const CATEGORIES = [
  'Action', 'Adventure', 'Anime', 'Chuyển Sinh', 'Comedy', 'Cổ Đại', 'Drama',
  'Đam Mỹ', 'Fantasy', 'Historical', 'Horror', 'Manhua', 'Manhwa', 'Martial Arts',
  'Mystery', 'Ngôn Tình', 'Psychological', 'Romance', 'School Life', 'Sci-fi',
  'Shounen', 'Slice of Life', 'Sports', 'Supernatural', 'Tragedy', 'Tu Tiên',
  'Webtoon', 'Xuyên Không',
];

const PAGE_SIZE = 20;

function RankCard({ item, rank }) {
  const navigate = useNavigate();
  const rankClass = rank <= 3 ? `rank-card-top rank-card-top--${rank}` : '';

  return (
    <article className={`rank-card ${rankClass}`}>
      <div className="rank-card-number">
        {rank <= 3 ? (
          <span className={`rank-medal rank-medal--${rank}`}>{rank}</span>
        ) : (
          <span className="rank-number">{rank}</span>
        )}
      </div>
      <Link to={`/chi-tiet-truyen/${item.slug}`} className="rank-card-thumb">
        <img src={item.coverUrl || 'https://picsum.photos/seed/rank-fallback/80/110'} alt={item.title} loading="lazy" />
      </Link>
      <div className="rank-card-info">
        <Link to={`/chi-tiet-truyen/${item.slug}`} className="rank-card-title">{item.title}</Link>
        {item.authorName && (
          <span
            className="rank-card-author"
            onClick={() => navigate(`/tac-gia/${encodeURIComponent(item.authorName)}`)}
          >
            <FontAwesomeIcon icon={faPen} /> {item.authorName}
          </span>
        )}
        <div className="rank-card-meta">
          <span><FontAwesomeIcon icon={faEye} /> {Number(item.totalViews || 0).toLocaleString()}</span>
          <span><FontAwesomeIcon icon={faCommentDots} /> {Number(item.totalComments || 0).toLocaleString()}</span>
          <span><FontAwesomeIcon icon={faStar} /> {(item.averageRating || 0).toFixed(1)}</span>
        </div>
        <div className="rank-card-bottom">
          {item.latestChapterTitle && (
            <span className="rank-card-chapter">{item.latestChapterTitle}</span>
          )}
          {item.categories?.slice(0, 2).map((cat) => (
            <Link key={cat} to={`/tim-truyen?category=${encodeURIComponent(cat)}`} className="rank-card-tag">{cat}</Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function XepHangPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeType = searchParams.get('type') || 'top-all';
  const activeCategory = searchParams.get('category') || '';

  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const currentRank = RANK_TYPES.find((r) => r.value === activeType) || RANK_TYPES[0];
  const visibleCategories = showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 12);

  const fetchRanking = async (page = 0) => {
    setLoading(true);
    try {
      const status = STATUS_MAP[activeType] || '';
      const data = await searchComicsApi('', activeCategory, status, currentRank.sort, 'all', page, PAGE_SIZE);
      setComics(data.data || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalItems || 0);
      setCurrentPage(page);
    } catch {
      setComics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
    fetchRanking(0);
  }, [activeType, activeCategory]);

  const handleTypeChange = (value) => {
    const params = { type: value };
    if (activeCategory) params.category = activeCategory;
    setSearchParams(params);
  };

  const handleCategoryChange = (cat) => {
    const params = { type: activeType };
    if (cat) params.category = cat;
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      fetchRanking(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const breadcrumbLabel = activeCategory
    ? `${currentRank.label} · ${activeCategory}`
    : currentRank.label;

  return (
    <div className="page xephang-page">
      <Header />
      <div className="container">
        <main className="xephang-main">
          <div className="breadcrumb breadcrumb--small">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            <span>Xếp hạng</span>
            <span>»</span>
            <span>{breadcrumbLabel}</span>
          </div>

          <div className="xephang-layout">
            {/* Sidebar */}
            <aside className="xephang-sidebar">
              <div className="xephang-sidebar-title">
                <FontAwesomeIcon icon={faTrophy} /> Xếp hạng
              </div>
              <ul className="xephang-type-list">
                {RANK_TYPES.map((type) => (
                  <li key={type.value}>
                    <button
                      type="button"
                      className={activeType === type.value ? 'active' : ''}
                      onClick={() => handleTypeChange(type.value)}
                    >
                      <FontAwesomeIcon icon={type.icon} />
                      <span>{type.label}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Category filter */}
              <div className="xephang-sidebar-title xephang-sidebar-title--category">
                <FontAwesomeIcon icon={faTag} /> Theo thể loại
              </div>
              <div className="xephang-category-list">
                <button
                  type="button"
                  className={`xephang-cat-btn${!activeCategory ? ' active' : ''}`}
                  onClick={() => handleCategoryChange('')}
                >
                  Tất cả
                </button>
                {visibleCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`xephang-cat-btn${activeCategory === cat ? ' active' : ''}`}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  type="button"
                  className="xephang-cat-toggle"
                  onClick={() => setShowAllCategories((v) => !v)}
                >
                  <FontAwesomeIcon icon={showAllCategories ? faChevronUp : faChevronDown} />
                  {showAllCategories ? ' Thu gọn' : ' Xem thêm'}
                </button>
              </div>
            </aside>

            {/* Main content */}
            <section className="xephang-content">
              <div className="xephang-header">
                <h1>
                  <FontAwesomeIcon icon={currentRank.icon} /> {currentRank.label}
                  {activeCategory && (
                    <span className="xephang-header-category">
                      <FontAwesomeIcon icon={faTag} /> {activeCategory}
                      <button
                        type="button"
                        className="xephang-header-category-clear"
                        onClick={() => handleCategoryChange('')}
                        title="Bỏ lọc thể loại"
                      >×</button>
                    </span>
                  )}
                </h1>
                {totalItems > 0 && (
                  <span className="xephang-count">{totalItems.toLocaleString()} truyện</span>
                )}
              </div>

              {loading ? (
                <div className="xephang-loading">
                  <div className="xephang-spinner" />
                  <p>Đang tải bảng xếp hạng...</p>
                </div>
              ) : comics.length === 0 ? (
                <div className="xephang-empty">Không có dữ liệu xếp hạng</div>
              ) : (
                <>
                  <div className="rank-list">
                    {comics.map((item, idx) => (
                      <RankCard
                        key={item.id}
                        item={item}
                        rank={currentPage * PAGE_SIZE + idx + 1}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        type="button"
                        disabled={currentPage === 0}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        ‹ Trước
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = Math.max(0, Math.min(currentPage - 2 + i, totalPages - 1));
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            className={currentPage === pageNum ? 'active' : ''}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        disabled={currentPage === totalPages - 1}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Tiếp ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
