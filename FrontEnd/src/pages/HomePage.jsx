import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCommentDots, faStar } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Pagination from '../components/Pagination';
import RankingBox from '../components/RankingBox';
import RecommendStrip from '../components/RecommendStrip';
import { getPublishedComicsApi } from '../services/publicComicApi';

const PAGE_SIZE = 20;

export default function HomePage() {
  const [publishedComics, setPublishedComics] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [topMonth, setTopMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPage = async (page) => {
    setLoading(true);
    try {
      const result = await getPublishedComicsApi(page, PAGE_SIZE);
      const comicsData = Array.isArray(result) ? result : (result?.data ?? []);
      const total = result?.totalPages ?? 1;

      setPublishedComics(comicsData);
      setTotalPages(total);
      setCurrentPage(page);

      if (page === 0) {
        setRecommended(
          comicsData.slice(0, 5).map((item) => ({
            title: item.title,
            chapter: item.latestChapterNo ? `Chapter ${item.latestChapterNo}` : 'Đang cập nhật',
            time: item.publishedAt || 'Gần đây',
            image: item.coverUrl || 'https://picsum.photos/seed/rec-fallback/280/180',
            id: item.id,
            slug: item.slug,
            description: item.description || '',
            totalViews: item.totalViews || 0,
            totalComments: item.totalComments || 0,
          }))
        );

        setTopMonth(
          [...comicsData]
            .slice(0, 7)
            .map((item, idx) => ({
              no: String(idx + 1).padStart(2, '0'),
              title: item.title,
              chapter: item.latestChapterNo ? `Chapter ${item.latestChapterNo}` : 'Đang cập nhật',
              views: item.totalViews > 0 ? Number(item.totalViews).toLocaleString() + ' lượt xem' : (item.totalComments > 0 ? item.totalComments + ' bình luận' : 'Mới đăng'),
              image: item.coverUrl || 'https://picsum.photos/seed/top-fallback/80/110',
              id: item.id,
              slug: item.slug,
            }))
        );
      }
    } catch {
      setPublishedComics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(0);
  }, []);

  const handlePageChange = (page) => {
    fetchPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page">
      <Header />
      <div className="container">
        <main className="layout">
          <div>
            {recommended.length > 0 && <RecommendStrip items={recommended} />}
            {publishedComics.length > 0 && (
              <section className="comic-grid" style={{ marginBottom: '16px' }}>
                <div className="section-title">
                  <h2>Truyện Mới Đăng</h2>
                </div>
                <div className="grid-list">
                  {publishedComics.map((item) => (
                    <article className="comic-card" key={item.id}>
                      <Link to={`/chi-tiet-truyen/${item.slug}`} className="comic-card-link">
                        <img
                          className="comic-thumb"
                          src={item.coverUrl || 'https://picsum.photos/seed/published-fallback/300/420'}
                          alt={item.title}
                          loading="lazy"
                        />
                        <div className="comic-content">
                          <h3>{item.title}</h3>
                          {item.description && <p className="comic-desc">{item.description.length > 80 ? item.description.slice(0, 80) + '…' : item.description}</p>}
                          <ul>
                            {item.totalViews > 0 && <li><span><FontAwesomeIcon icon={faEye} /> {Number(item.totalViews).toLocaleString()}</span></li>}
                            <li><span><FontAwesomeIcon icon={faCommentDots} /> {item.totalComments || 0}</span></li>
                            {item.averageRating > 0 && <li><span><FontAwesomeIcon icon={faStar} /> {Number(item.averageRating).toFixed(1)}</span></li>}
                            <li>
                              {item.latestChapterId ? (
                                <span>Chap {item.latestChapterNo || '?'}</span>
                              ) : (
                                <span>Đang cập nhật</span>
                              )}
                              <span>{item.publishedAt || ''}</span>
                            </li>
                          </ul>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="comic-grid">
              <div className="section-title">
                <h2>TopTruyen - Truyện gì cũng có!</h2>
              </div>
              <div className="grid-list">
                {publishedComics.length > 0 ? (
                  publishedComics.map((item) => (
                    <article className="comic-card" key={`top-${item.id}`}>
                      <Link to={`/chi-tiet-truyen/${item.slug}`} className="comic-card-link">
                        <img
                          className="comic-thumb"
                          src={item.coverUrl || 'https://picsum.photos/seed/comic-fallback/300/420'}
                          alt={item.title}
                          loading="lazy"
                        />
                        <div className="comic-content">
                          <h3>{item.title}</h3>
                          {item.description && <p className="comic-desc">{item.description.length > 80 ? item.description.slice(0, 80) + '…' : item.description}</p>}
                          <ul>
                            {item.totalViews > 0 && <li><span><FontAwesomeIcon icon={faEye} /> {Number(item.totalViews).toLocaleString()}</span></li>}
                            <li><span><FontAwesomeIcon icon={faCommentDots} /> {item.totalComments || 0}</span></li>
                            {item.averageRating > 0 && <li><span><FontAwesomeIcon icon={faStar} /> {Number(item.averageRating).toFixed(1)}</span></li>}
                            {item.latestChapterId && (
                              <li><span>Chap {item.latestChapterNo || '?'}</span></li>
                            )}
                          </ul>
                        </div>
                      </Link>
                    </article>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    {loading ? 'Đang tải...' : 'Không có dữ liệu truyện'}
                  </div>
                )}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </section>
          </div>

          {topMonth.length > 0 && <RankingBox topMonth={topMonth} />}
        </main>

        <Footer />
      </div>
    </div>
  );
}
