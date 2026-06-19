import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faComment, faEye, faPen, faCoins, faGift } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { searchComicsApi } from '../services/searchApi';

const categories = [
  'Tất cả', 'Action', 'Adventure', 'Anime', 'Chuyển Sinh', 'Comedy', 'Comic', 'Cooking',
  'Cổ Đại', 'Doujinshi', 'Drama', 'Đam Mỹ', 'Fantasy', 'Gender Bender', 'Historical', 'Horror',
  'Live action', 'Manga', 'Manhua', 'Manhwa', 'Martial Arts', 'Mecha', 'Mystery', 'Ngôn Tình',
  'Psychological', 'Romance', 'School Life', 'Sci-fi', 'Shoujo', 'Shoujo Ai', 'Shounen',
  'Shounen Ai', 'Slice of Life', 'Sports', 'Supernatural', 'Thiếu Nhi', 'Tragedy', 'Trinh Thám',
  'Truyện scan', 'Truyện Màu', 'Webtoon', 'Xuyên Không', 'Tu Tiên', 'TruyenQQ', 'BlogTruyen',
  'TeamLanhLung', 'Tủ Sách Xinh Xinh', 'TruyenGiHot', 'Tu Tiên Truyện', 'UngtyComics', 'VyComycs',
  'Bảo Tàng Truyện', 'Dưa Leo Truyện', 'Fastscan', 'CManga', 'FuHu',
];

const sortButtons = [
  { label: 'Ngày cập nhật', value: 'updated' },
  { label: 'Truyện mới', value: 'new' },
  { label: 'Xếp hạng', value: 'rating' },
  { label: 'Theo dõi', value: 'follow' },
  { label: 'Bình luận', value: 'comment' },
  { label: 'Đề cử', value: 'featured' },
];

const statusOptions = ['Tất cả', 'Hoàn thành', 'Đang tiến hành'];

const paidOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Miễn phí', value: 'free' },
  { label: 'Có trả phí', value: 'paid' },
];

function TimTruyenCard({ item }) {
  const navigate = useNavigate();
  return (
    <article className="timtruyen-card">
      <Link to={`/chi-tiet-truyen/${item.slug}`} className="timtruyen-card-link">
        <img src={item.coverUrl || 'https://picsum.photos/seed/comic-fallback/300/420'} alt={item.title} loading="lazy" />
        <div className="timtruyen-meta">
          <FontAwesomeIcon icon={faStar} /> {(item.averageRating || 0).toFixed(1)}
          &nbsp;&nbsp;<FontAwesomeIcon icon={faComment} /> {Number(item.totalComments || 0).toLocaleString()}
          &nbsp;&nbsp;<FontAwesomeIcon icon={faEye} /> {Number(item.totalViews || 0).toLocaleString()}
        </div>
        <h3>{item.title}</h3>
        {item.authorName ? (
          <p className="timtruyen-author">
            <FontAwesomeIcon icon={faPen} /> <span className="author-link" onClick={(e) => { e.stopPropagation(); navigate(`/tac-gia/${encodeURIComponent(item.authorName)}`); }}>{item.authorName}</span>
          </p>
        ) : null}
        {item.description ? (
          <p className="timtruyen-desc">
            {item.description.length > 75 ? item.description.slice(0, 75) + '…' : item.description}
          </p>
        ) : null}
        <ul>
          <li>
            <span>{item.latestChapterTitle || 'Chap mới'}</span>
            <span>{item.publishedAt}</span>
          </li>
        </ul>
      </Link>
    </article>
  );
}

function CategorySidebar({ selectedCategory, onCategoryChange }) {
  return (
    <aside className="timtruyen-sidebar">
      <div className="timtruyen-box-title">Thể loại</div>
      <div className="timtruyen-category-grid">
        {categories.map((name) => (
          <a
            key={name}
            href="#"
            className={selectedCategory === name ? 'is-first' : ''}
            onClick={(e) => {
              e.preventDefault();
              onCategoryChange(name);
            }}
          >
            {name}
          </a>
        ))}
      </div>
    </aside>
  );
}

export default function TimTruyenPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');
  const [selectedPaidType, setSelectedPaidType] = useState('all');
  const [selectedSort, setSelectedSort] = useState('updated');
  const [currentPage, setCurrentPage] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || 'Tất cả');
  }, [searchParams]);

  const performSearch = async (page = 0) => {
    setLoading(true);
    try {
      const data = await searchComicsApi(query, selectedCategory, selectedStatus, selectedSort, selectedPaidType, page, pageSize);
      setResults(data.data || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalItems || 0);
      setCurrentPage(page);
    } catch (error) {
      setResults([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(0);
  }, [query, selectedCategory, selectedStatus, selectedSort, selectedPaidType]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      performSearch(newPage);
    }
  };

  return (
    <div className="page timtruyen-page">
      <Header />
      <div className="container">

        <main className="timtruyen-main">
          <div className="warning-box warning-box--compact">
            <span className="warning-icon"></span>
          </div>

          <div className="breadcrumb breadcrumb--small">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            <span>Thể loại</span>
          </div>

          <div className="timtruyen-layout">
            <section className="timtruyen-content">
              <h1>Tất cả thể loại truyện tranh</h1>

              <div className="timtruyen-tabs">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={selectedStatus === status ? 'active' : ''}
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="timtruyen-tabs timtruyen-tabs--paid">
                <span className="timtruyen-filter-label">Loại:</span>
                {paidOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={selectedPaidType === opt.value ? 'active' : ''}
                    onClick={() => setSelectedPaidType(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="timtruyen-sort-wrap">
                <span>Sắp xếp theo:</span>
                <div className="timtruyen-sort-buttons">
                  {sortButtons.map((btn) => (
                    <button
                      key={btn.value}
                      type="button"
                      className={selectedSort === btn.value ? 'active' : ''}
                      onClick={() => setSelectedSort(btn.value)}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? <div className="empty-preview">Đang tải kết quả...</div> : null}

              {!loading && results.length === 0 ? <div className="empty-preview">Không tìm thấy truyện nào</div> : null}

              {!loading && results.length > 0 ? (
                <>
                  <div className="timtruyen-grid">
                    {results.map((item) => (
                      <TimTruyenCard key={`tim-${item.id}`} item={item} />
                    ))}
                  </div>

                  {totalPages > 1 ? (
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
                  ) : null}
                </>
              ) : null}
            </section>

            <CategorySidebar selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
