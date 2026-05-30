import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen, faCalendarDays, faBook, faEye, faBookmark, faLock, faHeart as faHeartSolid, faFlag, faStar,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ReportModal from '../components/ReportModal';
import { meApi } from '../services/authApi';
import {
  getComicRatingSummaryApi, rateComicApi,
  getComicDiscussionApi, createComicDiscussionCommentApi, deleteComicDiscussionCommentApi,
} from '../services/interactionApi';
import {
  getComicDiscussionRepliesApi, createComicDiscussionReplyApi,
} from '../services/commentReplyApi';
import { followComicApi, getFollowStatusApi, unfollowComicApi } from '../services/libraryApi';
import { getPublishedComicDetailApi, getRelatedComicsApi } from '../services/publicComicApi';

export default function ChiTietTruyenPage() {
  const { slug } = useParams();
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalRatings: 0, currentUserRating: null });
  const [hoverStar, setHoverStar] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');
  const [relatedComics, setRelatedComics] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const [discussionComments, setDiscussionComments] = useState([]);
  const [discussionPage, setDiscussionPage] = useState(0);
  const [discussionHasMore, setDiscussionHasMore] = useState(false);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionInput, setDiscussionInput] = useState('');
  const [discussionSubmitting, setDiscussionSubmitting] = useState(false);
  const [discussionMessage, setDiscussionMessage] = useState('');
  const [discussionRepliesMap, setDiscussionRepliesMap] = useState({});
  const [discussionOpenReplies, setDiscussionOpenReplies] = useState({});
  const [discussionReplyInputs, setDiscussionReplyInputs] = useState({});
  const [discussionReplySubmitting, setDiscussionReplySubmitting] = useState({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getPublishedComicDetailApi(slug)
      .then((comicData) => {
        if (!mounted) return;
        setComic(comicData);

        if (comicData?.id) {
          getComicRatingSummaryApi(comicData.id)
            .then((r) => {
              if (mounted) setRatingSummary({
                averageRating: Number(r?.averageRating || 0),
                totalRatings: Number(r?.totalRatings || 0),
                currentUserRating: r?.currentUserRating ?? null,
              });
            })
            .catch(() => {});
        }

        if (comicData?.slug && comicData?.categories) {
          getRelatedComicsApi(comicData.slug, comicData.categories)
            .then((data) => { if (mounted) setRelatedComics(Array.isArray(data) ? data : []); })
            .catch(() => {});
        }

        return meApi()
          .then((meData) => {
            if (!mounted) return;
            const loggedIn = !!meData?.authenticated;
            setIsLoggedIn(loggedIn);
            if (loggedIn && comicData?.id) {
              return getFollowStatusApi(comicData.id)
                .then((status) => { if (mounted) setIsFollowing(!!status?.following); })
                .catch(() => {});
            }
          })
          .catch(() => {});
      })
      .catch(() => { if (mounted) setComic(null); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [slug]);

  const loadDiscussion = useCallback(async (comicId, page) => {
    setDiscussionLoading(true);
    try {
      const data = await getComicDiscussionApi(comicId, page, 20);
      const list = Array.isArray(data) ? data : [];
      setDiscussionComments((prev) => page === 0 ? list : [...prev, ...list]);
      setDiscussionPage(page);
      setDiscussionHasMore(list.length === 20);
    } catch (_) {}
    finally { setDiscussionLoading(false); }
  }, []);

  useEffect(() => {
    if (comic?.id) loadDiscussion(comic.id, 0);
  }, [comic?.id, loadDiscussion]);

  const handleDiscussionSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { setDiscussionMessage('Đăng nhập để bình luận.'); return; }
    if (!discussionInput.trim()) return;
    setDiscussionSubmitting(true);
    setDiscussionMessage('');
    try {
      await createComicDiscussionCommentApi(comic.id, { content: discussionInput.trim() });
      setDiscussionInput('');
      await loadDiscussion(comic.id, 0);
    } catch (err) {
      setDiscussionMessage(err.message || 'Gửi thất bại.');
    } finally { setDiscussionSubmitting(false); }
  };

  const handleDeleteDiscussionComment = async (commentId) => {
    try {
      await deleteComicDiscussionCommentApi(commentId);
      setDiscussionComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setDiscussionMessage(err.message || 'Xóa thất bại.');
    }
  };

  const toggleDiscussionReplies = async (commentId) => {
    const isOpen = discussionOpenReplies[commentId];
    setDiscussionOpenReplies((prev) => ({ ...prev, [commentId]: !isOpen }));
    if (!isOpen && !discussionRepliesMap[commentId]) {
      try {
        const replies = await getComicDiscussionRepliesApi(commentId);
        setDiscussionRepliesMap((prev) => ({ ...prev, [commentId]: Array.isArray(replies) ? replies : [] }));
      } catch (_) {}
    }
  };

  const handleDiscussionReplySubmit = async (commentId) => {
    const content = discussionReplyInputs[commentId] || '';
    if (!content.trim()) return;
    setDiscussionReplySubmitting((prev) => ({ ...prev, [commentId]: true }));
    try {
      await createComicDiscussionReplyApi(commentId, content.trim());
      setDiscussionReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
      const replies = await getComicDiscussionRepliesApi(commentId);
      setDiscussionRepliesMap((prev) => ({ ...prev, [commentId]: Array.isArray(replies) ? replies : [] }));
    } catch (_) {}
    finally { setDiscussionReplySubmitting((prev) => ({ ...prev, [commentId]: false })); }
  };

  const handleFollowToggle = async () => {
    if (!isLoggedIn || !comic || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowComicApi(comic.id);
        setIsFollowing(false);
      } else {
        await followComicApi(comic.id);
        setIsFollowing(true);
      }
    } catch (_) {
    } finally {
      setFollowLoading(false);
    }
  };

  const handleRating = async (star) => {
    if (!isLoggedIn) { setRatingMessage('Đăng nhập để đánh giá.'); return; }
    if (ratingSubmitting) return;
    setRatingSubmitting(true);
    setRatingMessage('');
    try {
      await rateComicApi(comic.id, { rating: star });
      const r = await getComicRatingSummaryApi(comic.id);
      setRatingSummary({
        averageRating: Number(r?.averageRating || 0),
        totalRatings: Number(r?.totalRatings || 0),
        currentUserRating: r?.currentUserRating ?? null,
      });
      setRatingMessage('Đã lưu đánh giá!');
      setTimeout(() => setRatingMessage(''), 2000);
    } catch (e) {
      setRatingMessage(e.message || 'Đánh giá thất bại.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const sortedChapters = comic?.chapters
    ? [...comic.chapters].sort((a, b) => (a.chapterNo ?? 0) - (b.chapterNo ?? 0))
    : [];
  const firstChapter = sortedChapters[0];
  const latestChapter = sortedChapters[sortedChapters.length - 1];

  const categoryList = comic?.categories
    ? comic.categories.split(',').map((c) => c.trim()).filter(Boolean)
    : [];

  return (
    <div className="page chitiet-page">
      <Header />
      <div className="container">

        <main className="chitiet-main">
          <div className="breadcrumb breadcrumb--small">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            <span>{comic?.title || 'Chi tiết truyện'}</span>
          </div>

          {loading ? (
            <div className="empty-preview">Đang tải thông tin truyện...</div>
          ) : !comic ? (
            <div className="empty-preview">Không tìm thấy truyện.</div>
          ) : (
            <>
              <div className="chitiet-layout">
                <div className="chitiet-cover">
                  <img
                    src={comic.coverUrl || 'https://picsum.photos/seed/no-cover/300/420'}
                    alt={comic.title}
                  />
                </div>

                <div className="chitiet-info">
                  <h1 className="chitiet-title">{comic.title}</h1>

                  {comic.authorName && (
                    <p className="chitiet-author">
                      <FontAwesomeIcon icon={faPen} /> <Link to={`/tac-gia/${encodeURIComponent(comic.authorName)}`}>{comic.authorName}</Link>
                    </p>
                  )}

                  {categoryList.length > 0 && (
                    <div className="chitiet-categories">
                      {categoryList.map((cat) => (
                        <Link
                          key={cat}
                          to={`/tim-truyen?category=${encodeURIComponent(cat)}`}
                          className="chitiet-cat-chip"
                        >
                          {cat}
                        </Link>
                      ))}
                    </div>
                  )}

                  {comic.description && (
                    <p className="chitiet-desc">{comic.description}</p>
                  )}

                  <div className="chitiet-meta">
                    <span><FontAwesomeIcon icon={faCalendarDays} /> Đăng: {comic.publishedAt || 'N/A'}</span>
                    <span><FontAwesomeIcon icon={faBook} /> {sortedChapters.length} chapter</span>
                    {comic.totalViews > 0 && (
                      <span><FontAwesomeIcon icon={faEye} /> {comic.totalViews.toLocaleString()} lượt đọc</span>
                    )}
                  </div>

                  <div className="chitiet-rating">
                    <div className="chitiet-stars">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= (hoverStar || ratingSummary.currentUserRating || 0) ? 'star-btn--active' : ''}`}
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => handleRating(star)}
                          disabled={ratingSubmitting}
                        ><FontAwesomeIcon icon={faStar} /></button>
                      ))}
                    </div>
                    <span className="chitiet-rating-text">
                      {ratingSummary.totalRatings > 0
                        ? `${ratingSummary.averageRating.toFixed(1)}/5 (${ratingSummary.totalRatings} lượt)`
                        : 'Chưa có đánh giá'}
                    </span>
                    {ratingMessage && <span className="chitiet-rating-msg">{ratingMessage}</span>}
                  </div>

                  <div className="chitiet-actions">
                    {firstChapter && (
                      <Link
                        className="chitiet-btn chitiet-btn--primary"
                        to={`/doc-truyen/${comic.slug}/${firstChapter.id}`}
                      >
                        <FontAwesomeIcon icon={faBook} /> Đọc từ đầu
                      </Link>
                    )}
                    {latestChapter && latestChapter.id !== firstChapter?.id && (
                      <Link
                        className="chitiet-btn chitiet-btn--secondary"
                        to={`/doc-truyen/${comic.slug}/${latestChapter.id}`}
                      >
                        <FontAwesomeIcon icon={faBookmark} /> Chapter mới nhất
                      </Link>
                    )}
                    {isLoggedIn ? (
                      <button
                        type="button"
                        className={`chitiet-btn ${isFollowing ? 'chitiet-btn--following' : 'chitiet-btn--follow'}`}
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                      >
                        {isFollowing
                          ? <><FontAwesomeIcon icon={faHeartSolid} /> Đang theo dõi</>
                          : <><FontAwesomeIcon icon={faHeartRegular} /> Theo dõi</>}
                      </button>
                    ) : (
                      <Link className="chitiet-btn chitiet-btn--follow" to="/login">
                        <FontAwesomeIcon icon={faHeartRegular} /> Đăng nhập để theo dõi
                      </Link>
                    )}
                    <button
                      type="button"
                      className="chitiet-btn chitiet-btn--report"
                      onClick={() => setReportModalOpen(true)}
                      title="Báo cáo vi phạm"
                    >
                      <FontAwesomeIcon icon={faFlag} /> Báo cáo
                    </button>
                    {reportSuccess && (
                      <div className="report-success-msg">Đã gửi báo cáo. Cảm ơn bạn!</div>
                    )}
                  </div>
                </div>
              </div>

              {sortedChapters.length > 0 && (
                <section className="chitiet-chapters">
                  <h2>Danh sách chapter ({sortedChapters.length})</h2>
                  <div className="chitiet-chapter-list">
                    {[...sortedChapters].reverse().map((ch) => (
                      <Link
                        key={ch.id}
                        to={`/doc-truyen/${comic.slug}/${ch.id}`}
                        className="chitiet-chapter-item"
                      >
                        <span className="ch-title">
                          {ch.price > 0 ? <><FontAwesomeIcon icon={faLock} /> </> : ''}Chapter {ch.chapterNo}: {ch.title}
                        </span>
                        <span className="ch-date">{ch.publishedAt}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="chitiet-discussion">
                <h2>Thảo luận</h2>

                <form className="reader-comment-form" onSubmit={handleDiscussionSubmit}>
                  <textarea
                    value={discussionInput}
                    onChange={(e) => setDiscussionInput(e.target.value)}
                    rows={3}
                    maxLength={1200}
                    placeholder={isLoggedIn ? 'Viết bình luận của bạn...' : 'Đăng nhập để bình luận'}
                    disabled={!isLoggedIn}
                  />
                  <button type="submit" className="secondary-btn" disabled={discussionSubmitting || !isLoggedIn}>
                    {discussionSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
                  </button>
                </form>
                {discussionMessage && <p className="reader-follow-message">{discussionMessage}</p>}

                {discussionLoading && discussionPage === 0 && (
                  <div className="empty-preview">Đang tải bình luận...</div>
                )}

                {!discussionLoading && discussionComments.length === 0 && (
                  <div className="empty-preview">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
                )}

                {discussionComments.length > 0 && (
                  <>
                    <div className="reader-comment-list">
                      {discussionComments.map((item) => (
                        <article key={item.id} className="reader-comment-item">
                          <div className="reader-comment-head">
                            <strong>{item.displayName || 'Người dùng'}</strong>
                            <span>{item.createdAt}</span>
                          </div>
                          <p>{item.content}</p>
                          {(() => {
                            const count = Math.max(item.replyCount || 0, discussionRepliesMap[item.id]?.length || 0);
                            return count > 0 ? (
                              <button
                                type="button"
                                className="view-replies-btn"
                                onClick={() => toggleDiscussionReplies(item.id)}
                              >
                                {discussionOpenReplies[item.id] ? 'Ẩn phản hồi' : `Xem tất cả ${count} phản hồi`}
                              </button>
                            ) : null;
                          })()}
                          <div className="reader-comment-actions">
                            <button
                              type="button"
                              className="reply-toggle-btn"
                              onClick={() => toggleDiscussionReplies(item.id)}
                            >
                              Trả lời
                            </button>
                            {item.own && (
                              <button
                                type="button"
                                className="chapter-remove-btn"
                                onClick={() => handleDeleteDiscussionComment(item.id)}
                              >
                                Xóa
                              </button>
                            )}
                          </div>

                          {discussionOpenReplies[item.id] && (
                            <div className="reader-replies">
                              {(discussionRepliesMap[item.id] || []).map((reply) => (
                                <div key={reply.id} className="reader-reply-item">
                                  <div className="reader-comment-head">
                                    <strong>{reply.userName || 'Người dùng'}</strong>
                                    <span>{reply.createdAt}</span>
                                  </div>
                                  <p>{reply.content}</p>
                                </div>
                              ))}
                              {isLoggedIn ? (
                                <div className="reader-reply-form">
                                  <input
                                    type="text"
                                    placeholder="Viết trả lời..."
                                    value={discussionReplyInputs[item.id] || ''}
                                    onChange={(e) => setDiscussionReplyInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleDiscussionReplySubmit(item.id); }}
                                    maxLength={500}
                                  />
                                  <button
                                    type="button"
                                    className="secondary-btn"
                                    disabled={discussionReplySubmitting[item.id]}
                                    onClick={() => handleDiscussionReplySubmit(item.id)}
                                  >
                                    {discussionReplySubmitting[item.id] ? '...' : 'Gửi'}
                                  </button>
                                </div>
                              ) : (
                                <p className="reply-login-hint">
                                  <Link to="/login">Đăng nhập</Link> để trả lời
                                </p>
                              )}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                    {discussionHasMore && (
                      <button
                        type="button"
                        className="secondary-btn load-more-comments-btn"
                        disabled={discussionLoading}
                        onClick={() => loadDiscussion(comic.id, discussionPage + 1)}
                      >
                        {discussionLoading ? 'Đang tải...' : 'Xem thêm bình luận'}
                      </button>
                    )}
                  </>
                )}
              </section>

              {relatedComics.length > 0 && (
                <section className="chitiet-related">
                  <h2>Truyện liên quan</h2>
                  <div className="chitiet-related-grid">
                    {relatedComics.map((item) => (
                      <Link key={item.id} to={`/chi-tiet-truyen/${item.slug}`} className="chitiet-related-card">
                        <img
                          src={item.coverUrl || 'https://picsum.photos/seed/related-fallback/200/280'}
                          alt={item.title}
                          loading="lazy"
                        />
                        <div className="chitiet-related-info">
                          <h4>{item.title}</h4>
                          {item.latestChapterNo && <p>Chapter {item.latestChapterNo}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>

      <ReportModal
        isOpen={reportModalOpen}
        targetType="COMIC"
        targetId={comic?.id}
        targetTitle={comic?.title}
        onClose={() => setReportModalOpen(false)}
        onSuccess={() => {
          setReportSuccess(true);
          setTimeout(() => setReportSuccess(false), 3000);
        }}
      />
    </div>
  );
}
