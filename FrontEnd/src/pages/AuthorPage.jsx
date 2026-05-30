import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faUser, faCheck, faPlus, faHeart } from '@fortawesome/free-solid-svg-icons';
import DonateModal from '../components/DonateModal';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { meApi } from '../services/authApi';
import {
  getAuthorPostsApi, createAuthorPostApi, deleteAuthorPostApi,
  getAuthorPostCommentsApi, createAuthorPostCommentApi, deleteAuthorPostCommentApi,
} from '../services/authorCommunityApi';
import { followAuthorApi, getAuthorFollowStatusApi, unfollowAuthorApi } from '../services/libraryApi';
import { getAuthorFollowersApi, getAuthorProfileApi, getAuthorReadingListApi, getComicsByAuthorApi } from '../services/publicComicApi';
import { getDonationsReceivedApi } from '../services/walletApi';

export default function AuthorPage() {
  const { authorName } = useParams();
  const decodedName = decodeURIComponent(authorName);

  const [profile, setProfile] = useState(null);
  const [comics, setComics] = useState([]);
  const [readingList, setReadingList] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('works');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDonate, setShowDonate] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);

  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(0);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postInput, setPostInput] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postMessage, setPostMessage] = useState('');
  const [openComments, setOpenComments] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      getAuthorProfileApi(decodedName).catch(() => null),
      getComicsByAuthorApi(decodedName).catch(() => []),
      meApi().catch(() => null),
      getAuthorFollowStatusApi(decodedName).catch(() => ({ following: false })),
      getAuthorReadingListApi(decodedName).catch(() => []),
      getAuthorFollowersApi(decodedName).catch(() => []),
    ]).then(([profileData, comicsData, meData, followData, readingData, followersData]) => {
      if (!mounted) return;
      setProfile(profileData);
      setComics(Array.isArray(comicsData) ? comicsData : []);
      setIsLoggedIn(!!meData?.authenticated);
      setCurrentUser(meData?.authenticated ? meData : null);
      setIsFollowing(!!followData?.following);
      setReadingList(Array.isArray(readingData) ? readingData : []);
      setFollowers(Array.isArray(followersData) ? followersData : []);
    }).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [decodedName]);

  const handleToggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowAuthorApi(decodedName);
        setIsFollowing(false);
        setFollowers((prev) => prev.filter((f) => f.is_current_user !== true));
      } else {
        await followAuthorApi(decodedName);
        setIsFollowing(true);
      }
    } catch {
      // ignore
    } finally {
      setFollowLoading(false);
    }
  };

  const loadPosts = useCallback(async (name, page) => {
    setPostsLoading(true);
    try {
      const data = await getAuthorPostsApi(name, page, 20);
      const list = Array.isArray(data) ? data : [];
      setPosts((prev) => page === 0 ? list : [...prev, ...list]);
      setPostsPage(page);
      setPostsHasMore(list.length === 20);
    } catch (_) {}
    finally { setPostsLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'community' && decodedName) loadPosts(decodedName, 0);
  }, [tab, decodedName, loadPosts]);

  useEffect(() => {
    if (tab === 'donations') {
      setDonationsLoading(true);
      getDonationsReceivedApi(0, 50)
        .then((data) => setDonations(Array.isArray(data) ? data : []))
        .catch(() => setDonations([]))
        .finally(() => setDonationsLoading(false));
    }
  }, [tab]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { setPostMessage('Đăng nhập để đăng bài.'); return; }
    if (!postInput.trim()) return;
    setPostSubmitting(true);
    setPostMessage('');
    try {
      await createAuthorPostApi(decodedName, postInput.trim());
      setPostInput('');
      await loadPosts(decodedName, 0);
    } catch (err) {
      setPostMessage(err.message || 'Đăng bài thất bại.');
    } finally { setPostSubmitting(false); }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteAuthorPostApi(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setPostMessage(err.message || 'Xóa thất bại.');
    }
  };

  const togglePostComments = async (postId) => {
    const isOpen = openComments[postId];
    setOpenComments((prev) => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen && !commentsMap[postId]) {
      try {
        const data = await getAuthorPostCommentsApi(postId, decodedName);
        setCommentsMap((prev) => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
      } catch (_) {}
    }
  };

  const handleCommentSubmit = async (postId) => {
    const content = commentInputs[postId] || '';
    if (!content.trim()) return;
    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      await createAuthorPostCommentApi(postId, content.trim());
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      const data = await getAuthorPostCommentsApi(postId, decodedName);
      setCommentsMap((prev) => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
    } catch (_) {}
    finally { setCommentSubmitting((prev) => ({ ...prev, [postId]: false })); }
  };

  const handleDeleteComment = async (commentId, postId) => {
    try {
      await deleteAuthorPostCommentApi(commentId);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));
    } catch (_) {}
  };

  const isOwnProfile = isLoggedIn && currentUser?.displayName === decodedName;

  const genderLabel = (g) => {
    if (g === 'MALE' || g === 'Nam') return 'Nam';
    if (g === 'FEMALE' || g === 'Nữ') return 'Nữ';
    if (g && g !== '') return g;
    return null;
  };

  const avatarContent = profile?.avatarUrl
    ? <img src={profile.avatarUrl} alt={decodedName} className="author-avatar-img" />
    : decodedName.charAt(0).toUpperCase();

  return (
    <div className="page author-page">
      <Header />
      <div className="container">

        <main className="author-main">
          <div className="breadcrumb breadcrumb--small">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            <span>Tác giả</span>
            <span>»</span>
            <span>{decodedName}</span>
          </div>

          {loading ? (
            <div className="empty-preview">Đang tải...</div>
          ) : (
            <>
              <div className="author-profile-card">
                <div className="author-avatar-lg">
                  {avatarContent}
                </div>
                <div className="author-profile-info">
                  <h1 className="author-name">{decodedName}</h1>

                  <div className="author-stats-row">
                    <div className="author-stat-item">
                      <span className="author-stat-value">{profile?.comicCount ?? comics.length}</span>
                      <span className="author-stat-label">Tác phẩm</span>
                    </div>
                    <div className="author-stat-item">
                      <span className="author-stat-value">{Number(profile?.totalFollows ?? 0).toLocaleString()}</span>
                      <span className="author-stat-label">Người theo dõi</span>
                    </div>
                    <div className="author-stat-item">
                      <span className="author-stat-value">{Number(profile?.totalViews ?? 0).toLocaleString()}</span>
                      <span className="author-stat-label">Lượt xem</span>
                    </div>
                  </div>

                  <div className="author-bio-section">
                    <h3 className="author-bio-title">Giới thiệu</h3>
                    <p className="author-bio">
                      {profile?.bio || 'Tác giả chưa có thông tin giới thiệu.'}
                    </p>
                  </div>

                  <div className="author-meta-row">
                    {profile?.joinedAt && (
                      <span className="author-meta-chip"><FontAwesomeIcon icon={faCalendarDays} /> Tham gia {profile.joinedAt}</span>
                    )}
                    {profile?.gender && genderLabel(profile.gender) && (
                      <span className="author-meta-chip"><FontAwesomeIcon icon={faUser} /> {genderLabel(profile.gender)}</span>
                    )}
                  </div>

                  {isLoggedIn && !isOwnProfile && (
                    <div className="author-action-row">
                      <button
                        className={`author-follow-btn${isFollowing ? ' author-follow-btn--following' : ''}`}
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                      >
                        {isFollowing ? <><FontAwesomeIcon icon={faCheck} /> Đang theo dõi</> : <><FontAwesomeIcon icon={faPlus} /> Theo dõi</>}
                      </button>
                      <button
                        className="donate-trigger-btn"
                        onClick={() => setShowDonate(true)}
                      >
                        <FontAwesomeIcon icon={faHeart} /> Ủng hộ
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <DonateModal
                authorName={decodedName}
                isOpen={showDonate}
                onClose={() => setShowDonate(false)}
              />

              {/* Tabs */}
              <div className="author-tabs">
                <button
                  className={`author-tab-btn${tab === 'works' ? ' active' : ''}`}
                  onClick={() => setTab('works')}
                >
                  Tác phẩm ({comics.length})
                </button>
                <button
                  className={`author-tab-btn${tab === 'reading' ? ' active' : ''}`}
                  onClick={() => setTab('reading')}
                >
                  Danh sách đọc ({readingList.length})
                </button>
                <button
                  className={`author-tab-btn${tab === 'followers' ? ' active' : ''}`}
                  onClick={() => setTab('followers')}
                >
                  Người theo dõi ({Number(profile?.totalFollows ?? followers.length).toLocaleString()})
                </button>
                <button
                  className={`author-tab-btn${tab === 'community' ? ' active' : ''}`}
                  onClick={() => setTab('community')}
                >
                  Hội thoại
                </button>
                {isOwnProfile && (
                  <button
                    className={`author-tab-btn${tab === 'donations' ? ' active' : ''}`}
                    onClick={() => setTab('donations')}
                  >
                    <FontAwesomeIcon icon={faHeart} /> Ủng hộ nhận được
                  </button>
                )}
              </div>

              {/* Tab: Tác phẩm */}
              {tab === 'works' && (
                comics.length === 0 ? (
                  <div className="empty-preview">Tác giả này chưa có tác phẩm nào.</div>
                ) : (
                  <div className="author-grid">
                    {comics.map((item) => (
                      <article key={item.id} className="author-comic-card">
                        <Link to={`/chi-tiet-truyen/${item.slug}`}>
                          <img
                            src={item.coverUrl || 'https://picsum.photos/seed/author-fallback/300/420'}
                            alt={item.title}
                            loading="lazy"
                          />
                          <div className="author-comic-info">
                            <h3>{item.title}</h3>
                            {item.latestChapterNo && (
                              <p>Chapter {item.latestChapterNo}</p>
                            )}
                            <p className="author-comic-date">{item.publishedAt}</p>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                )
              )}

              {/* Tab: Danh sách đọc */}
              {tab === 'reading' && (
                readingList.length === 0 ? (
                  <div className="empty-preview">Tác giả chưa theo dõi truyện nào.</div>
                ) : (
                  <div className="author-grid">
                    {readingList.map((item) => (
                      <article key={item.id} className="author-comic-card">
                        <Link to={`/chi-tiet-truyen/${item.slug}`}>
                          <img
                            src={item.cover_url || 'https://picsum.photos/seed/reading-fallback/300/420'}
                            alt={item.title}
                            loading="lazy"
                          />
                          <div className="author-comic-info">
                            <h3>{item.title}</h3>
                            {item.latest_chapter_no && (
                              <p>Chapter {item.latest_chapter_no}</p>
                            )}
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                )
              )}

              {/* Tab: Hội thoại */}
              {tab === 'community' && (
                <div className="community-section">
                  <form className="community-post-form" onSubmit={handlePostSubmit}>
                    <textarea
                      value={postInput}
                      onChange={(e) => setPostInput(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder={isLoggedIn ? 'Viết bài chia sẻ, thông báo, hỏi đáp...' : 'Đăng nhập để đăng bài'}
                      disabled={!isLoggedIn}
                    />
                    <div className="community-post-form-footer">
                      <span className="community-char-count">{postInput.length}/2000</span>
                      <button type="submit" className="secondary-btn" disabled={postSubmitting || !isLoggedIn || !postInput.trim()}>
                        {postSubmitting ? 'Đang đăng...' : 'Đăng bài'}
                      </button>
                    </div>
                  </form>
                  {postMessage && <p className="reader-follow-message">{postMessage}</p>}

                  {postsLoading && posts.length === 0 && (
                    <div className="empty-preview">Đang tải...</div>
                  )}
                  {!postsLoading && posts.length === 0 && (
                    <div className="empty-preview">Chưa có bài đăng nào. Hãy là người đầu tiên!</div>
                  )}

                  <div className="community-post-list">
                    {posts.map((post) => (
                      <article key={post.id} className="community-post-item">
                        <div className="community-post-header">
                          <div className="community-post-author">
                            <div className="community-author-avatar">
                              {post.avatarUrl
                                ? <img src={post.avatarUrl} alt={post.displayName} />
                                : <span>{post.displayName?.charAt(0).toUpperCase()}</span>}
                            </div>
                            <div className="community-author-info">
                              <div className="community-author-top">
                                <span className="community-author-name">{post.displayName}</span>
                                {post.isAuthor && <span className="community-author-badge">Tác giả</span>}
                              </div>
                              <span className="community-post-date">{post.createdAt}</span>
                            </div>
                          </div>
                        </div>

                        <p className="community-post-content">{post.content}</p>

                        <div className="community-post-actions">
                          <button
                            type="button"
                            className="community-comment-toggle"
                            onClick={() => togglePostComments(post.id)}
                          >
                            {openComments[post.id]
                              ? 'Ẩn bình luận'
                              : `Bình luận${post.commentCount > 0 ? ` (${post.commentCount})` : ''}`}
                          </button>
                          {post.own && (
                            <button
                              type="button"
                              className="chapter-remove-btn"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              Xóa
                            </button>
                          )}
                        </div>

                        {openComments[post.id] && (
                          <div className="community-comments">
                            {(commentsMap[post.id] || []).map((c) => (
                              <div key={c.id} className="community-comment-item">
                                <div className="community-post-header">
                                  <div className="community-post-author">
                                    <div className="community-author-avatar community-author-avatar--sm">
                                      {c.avatarUrl
                                        ? <img src={c.avatarUrl} alt={c.displayName} />
                                        : <span>{c.displayName?.charAt(0).toUpperCase()}</span>}
                                    </div>
                                    <div className="community-author-info">
                                      <div className="community-author-top">
                                        <span className="community-author-name">{c.displayName}</span>
                                        {c.isAuthor && <span className="community-author-badge">Tác giả</span>}
                                      </div>
                                      <span className="community-post-date">{c.createdAt}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="community-comment-content">{c.content}</p>
                                {c.own && (
                                  <button
                                    type="button"
                                    className="chapter-remove-btn"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => handleDeleteComment(c.id, post.id)}
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                            ))}

                            {isLoggedIn ? (
                              <div className="community-comment-form">
                                <input
                                  type="text"
                                  placeholder="Viết bình luận..."
                                  value={commentInputs[post.id] || ''}
                                  onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                                  maxLength={500}
                                />
                                <button
                                  type="button"
                                  className="secondary-btn"
                                  disabled={commentSubmitting[post.id]}
                                  onClick={() => handleCommentSubmit(post.id)}
                                >
                                  {commentSubmitting[post.id] ? '...' : 'Gửi'}
                                </button>
                              </div>
                            ) : (
                              <p className="reply-login-hint">
                                <Link to="/login">Đăng nhập</Link> để bình luận
                              </p>
                            )}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>

                  {postsHasMore && (
                    <button
                      type="button"
                      className="secondary-btn load-more-comments-btn"
                      disabled={postsLoading}
                      onClick={() => loadPosts(decodedName, postsPage + 1)}
                    >
                      {postsLoading ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                  )}
                </div>
              )}

              {/* Tab: Ủng hộ nhận được (chỉ hiện với chủ tài khoản) */}
              {tab === 'donations' && isOwnProfile && (
                <div className="donations-received-section">
                  {donationsLoading ? (
                    <div className="empty-preview">Đang tải...</div>
                  ) : donations.length === 0 ? (
                    <div className="empty-preview">Chưa có ủng hộ nào.</div>
                  ) : (
                    <>
                      <div className="donations-summary">
                        <span>Tổng nhận được: <strong>{donations.reduce((s, d) => s + (d.author_received || 0), 0).toLocaleString()} xu</strong></span>
                        <span className="donations-fee-note">(Phí sàn 40% đã được trừ)</span>
                      </div>
                      <div className="donations-list">
                        {donations.map((d) => (
                          <div key={d.id} className="donation-item">
                            <div className="donation-item-header">
                              <span className="donation-from">
                                <Link to={`/tac-gia/${encodeURIComponent(d.from_display_name)}`}>
                                  {d.from_display_name}
                                </Link>
                              </span>
                              <span className="donation-amount">+{Number(d.author_received).toLocaleString()} xu</span>
                            </div>
                            <div className="donation-item-meta">
                              <span className="donation-original">Gốc: {Number(d.amount).toLocaleString()} xu · Phí sàn: {Number(d.platform_fee).toLocaleString()} xu</span>
                              <span className="donation-date">{new Date(d.created_at).toLocaleString('vi-VN')}</span>
                            </div>
                            {d.message && (
                              <p className="donation-message">"{d.message}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab: Người theo dõi */}
              {tab === 'followers' && (
                followers.length === 0 ? (
                  <div className="empty-preview">Chưa có người theo dõi tác giả này.</div>
                ) : (
                  <div className="author-followers-list">
                    {followers.map((f) => (
                      <div key={f.id} className="author-follower-item">
                        <div className="author-follower-avatar">
                          {f.avatar_url
                            ? <img src={f.avatar_url} alt={f.display_name} />
                            : (f.display_name || '?').charAt(0).toUpperCase()
                          }
                        </div>
                        <div className="author-follower-info">
                          <span className="author-follower-name">
                            <Link to={`/tac-gia/${encodeURIComponent(f.display_name)}`}>
                              {f.display_name}
                            </Link>
                          </span>
                          {f.followed_at && (
                            <span className="author-follower-date">Theo dõi từ {f.followed_at}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
