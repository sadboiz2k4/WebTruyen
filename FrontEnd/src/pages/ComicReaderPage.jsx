import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faFlag, faPlay, faPause, faStop, faVolumeHigh, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTTS } from '../hooks/useTTS';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { getPublishedChapterDetailApi, getPublishedComicDetailApi, unlockChapterApi } from '../services/publicComicApi';
import { meApi } from '../services/authApi';
import { followComicApi, getFollowStatusApi, markChapterReadApi, unfollowComicApi } from '../services/libraryApi';
import {
  createCommentApi,
  deleteCommentApi,
  getChapterCommentsApi,
  getComicRatingSummaryApi,
  rateComicApi,
  reportContentApi,
  createReportAppealApi,
} from '../services/interactionApi';
import { createCommentReplyApi, getCommentRepliesApi } from '../services/commentReplyApi';

const REPORT_REASON_OPTIONS = [
  { value: 'SPAM', label: 'Spam / quảng cáo' },
  { value: 'HATE', label: 'Thù ghét / công kích' },
  { value: 'SEXUAL', label: 'Nội dung nhạy cảm' },
  { value: 'VIOLENCE', label: 'Bạo lực' },
  { value: 'COPYRIGHT', label: 'Vi phạm bản quyền' },
  { value: 'SCAM', label: 'Lừa đảo / spam link' },
  { value: 'OTHER', label: 'Khác' },
];

export default function ComicReaderPage() {
  const { slug, chapterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comic, setComic] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followMessage, setFollowMessage] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentPage, setCommentPage] = useState(0);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentMessage, setCommentMessage] = useState('');
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, totalRatings: 0, currentUserRating: null });
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');
  const [repliesMap, setRepliesMap] = useState({});
  const [openReplies, setOpenReplies] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replySubmitting, setReplySubmitting] = useState({});
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetType, setReportTargetType] = useState('COMIC');
  const [reportCommentId, setReportCommentId] = useState(null);
  const [reportTargetLabel, setReportTargetLabel] = useState('');
  const [reportReasonKey, setReportReasonKey] = useState('SPAM');
  const [reportReasonDetail, setReportReasonDetail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [lastReport, setLastReport] = useState(null);
  const [appealMessage, setAppealMessage] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealNotice, setAppealNotice] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [readFontSize, setReadFontSize] = useState(() => localStorage.getItem('read_font_size') || 'medium');
  const [readBg, setReadBg] = useState(() => localStorage.getItem('read_bg') || 'white');
  const [readFont, setReadFont] = useState(() => localStorage.getItem('read_font') || 'default');
  const [ttsOpen, setTtsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sortedChapters = useMemo(() => {
    if (!comic?.chapters) return [];
    return [...comic.chapters].sort((a, b) => a.chapterNo - b.chapterNo);
  }, [comic]);

  const currentChapterIndex = useMemo(() => {
    if (!chapter?.id || sortedChapters.length === 0) return -1;
    return sortedChapters.findIndex((item) => String(item.id) === String(chapter.id));
  }, [chapter?.id, sortedChapters]);

  const prevChapter = currentChapterIndex > 0 ? sortedChapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < sortedChapters.length - 1
    ? sortedChapters[currentChapterIndex + 1]
    : null;

  const textLines = useMemo(() => {
    const content = (chapter?.content || '').normalize('NFC');
    if (!content.trim()) return [];

    return content
      .split(/\n\n+/)
      .map(para => para.replace(/\n/g, ' ').trim())
      .filter(para => para.length > 0);
  }, [chapter?.content]);

  const wordCount = useMemo(() => {
    if (!chapter?.content) return 0;
    return chapter.content.normalize('NFC').trim().split(/\s+/).filter(Boolean).length;
  }, [chapter?.content]);

  const tts = useTTS(textLines);

  const hasImagePages = (chapter?.pages?.length || 0) > 0;
  const readerBasePath = location.pathname.startsWith('/doc-truyen-chu/') ? '/doc-truyen-chu' : '/doc-truyen';

  const openChapter = (id) => {
    navigate(`${readerBasePath}/${slug}/${id}`);
  };

  const openReportModal = (type = 'COMIC', targetLabel = '', commentId = null) => {
    setReportTargetType(type);
    setReportCommentId(commentId);
    setReportTargetLabel(targetLabel);
    setReportReasonKey('SPAM');
    setReportReasonDetail('');
    setReportMessage('');
    setReportOpen(true);
  };

  const handleFollowToggle = async () => {
    if (!comic?.id) {
      return;
    }

    if (!isAuthenticated) {
      setFollowMessage('Ban can dang nhap de theo doi truyen.');
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    setFollowMessage('');
    try {
      if (isFollowing) {
        await unfollowComicApi(comic.id);
        setIsFollowing(false);
        setFollowMessage('Da bo theo doi truyen.');
      } else {
        await followComicApi(comic.id);
        setIsFollowing(true);
        setFollowMessage('Da them truyen vao danh sach theo doi.');
      }
    } catch (err) {
      setFollowMessage(err.message || 'Khong the cap nhat theo doi.');
    } finally {
      setFollowLoading(false);
    }
  };

  const PAGE_SIZE = 20;

  const loadComments = async (targetChapterId, page = 0) => {
    if (!targetChapterId) {
      setComments([]);
      setCommentsHasMore(false);
      return;
    }

    setCommentsLoading(true);
    try {
      const data = await getChapterCommentsApi(targetChapterId, page, PAGE_SIZE);
      const list = Array.isArray(data) ? data : [];
      if (page === 0) {
        setComments(list);
      } else {
        setComments((prev) => [...prev, ...list]);
      }
      setCommentPage(page);
      setCommentsHasMore(list.length === PAGE_SIZE);
    } catch (_) {
      if (page === 0) setComments([]);
      setCommentsHasMore(false);
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadRatingSummary = async (comicId) => {
    if (!comicId) {
      setRatingSummary({ averageRating: 0, totalRatings: 0, currentUserRating: null });
      return;
    }

    try {
      const data = await getComicRatingSummaryApi(comicId);
      setRatingSummary({
        averageRating: Number(data?.averageRating || 0),
        totalRatings: Number(data?.totalRatings || 0),
        currentUserRating: data?.currentUserRating ?? null,
      });

      if (data?.currentUserRating) {
        setRatingValue(Number(data.currentUserRating));
      }
    } catch (_) {
      setRatingSummary({ averageRating: 0, totalRatings: 0, currentUserRating: null });
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!chapter?.id) return;
    if (!isAuthenticated) {
      setCommentMessage('Ban can dang nhap de binh luan.');
      navigate('/login');
      return;
    }

    const trimmed = commentInput.trim();
    if (!trimmed) {
      setCommentMessage('Noi dung binh luan khong duoc de trong.');
      return;
    }

    setCommentSubmitting(true);
    setCommentMessage('');
    try {
      await createCommentApi(chapter.id, { content: trimmed });
      setCommentInput('');
      setCommentMessage('Da gui binh luan.');
      await loadComments(chapter.id, 0);
    } catch (err) {
      setCommentMessage(err.message || 'Gui binh luan that bai.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await deleteCommentApi(commentId);
      setCommentMessage('Da xoa binh luan.');
      await loadComments(chapter?.id, 0);
    } catch (err) {
      setCommentMessage(err.message || 'Khong the xoa binh luan.');
    }
  };

  const handleUnlockChapter = async () => {
    if (!chapter?.id) return;
    if (!isAuthenticated) {
      setUnlockMessage('Bạn cần đăng nhập để mở khóa chapter.');
      navigate('/login');
      return;
    }
    setUnlocking(true);
    setUnlockMessage('');
    try {
      await unlockChapterApi(chapter.id);
      const chapterData = await getPublishedChapterDetailApi(chapter.id);
      setChapter(chapterData);
      window.dispatchEvent(new CustomEvent('wallet:updated'));
      setUnlockMessage('Mở khóa thành công!');
    } catch (err) {
      setUnlockMessage(err.message || 'Mở khóa thất bại.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setReportMessage('Bạn cần đăng nhập để báo cáo.');
      return;
    }
    const targetId = reportTargetType === 'COMIC'
      ? comic?.id
      : reportTargetType === 'CHAPTER'
        ? chapter?.id
        : reportCommentId;
    if (!targetId) return;
    const reasonLabel = REPORT_REASON_OPTIONS.find((item) => item.value === reportReasonKey)?.label || 'Khác';
    const detail = reportReasonDetail.trim();
    const normalizedReason = detail ? `${reasonLabel}: ${detail}` : reasonLabel;
    setReportSubmitting(true);
    setReportMessage('');
    try {
      const result = await reportContentApi(reportTargetType, targetId, normalizedReason);
      setLastReport({ reportId: result?.reportId, reportScope: result?.reportScope || 'CONTENT' });
      setReportMessage(result?.reportId ? `Đã gửi báo cáo #${result.reportId}. Cảm ơn bạn!` : 'Đã gửi báo cáo. Cảm ơn bạn!');
      setReportReasonDetail('');
      setTimeout(() => { setReportOpen(false); setReportMessage(''); }, 1800);
    } catch (err) {
      setReportMessage(err.message || 'Gửi báo cáo thất bại.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAppealNotice('Bạn cần đăng nhập để kháng nghị.');
      navigate('/login');
      return;
    }
    if (!lastReport?.reportId) {
      setAppealNotice('Chưa có báo cáo nào để kháng nghị.');
      return;
    }

    const trimmed = appealMessage.trim();
    if (!trimmed) {
      setAppealNotice('Nội dung kháng nghị không được để trống.');
      return;
    }

    setAppealSubmitting(true);
    setAppealNotice('');
    try {
      await createReportAppealApi(lastReport.reportId, lastReport.reportScope, trimmed);
      setAppealNotice('Đã gửi kháng nghị.');
      setAppealMessage('');
    } catch (err) {
      setAppealNotice(err.message || 'Gửi kháng nghị thất bại.');
    } finally {
      setAppealSubmitting(false);
    }
  };

  const handleRateComic = async () => {
    if (!comic?.id) return;
    if (!isAuthenticated) {
      setRatingMessage('Ban can dang nhap de danh gia.');
      navigate('/login');
      return;
    }

    setRatingSubmitting(true);
    setRatingMessage('');
    try {
      await rateComicApi(comic.id, { rating: Number(ratingValue) });
      setRatingMessage('Da ghi nhan danh gia cua ban.');
      await loadRatingSummary(comic.id);
    } catch (err) {
      setRatingMessage(err.message || 'Danh gia that bai.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    meApi()
      .then((data) => {
        if (!mounted) return;
        setIsAuthenticated(Boolean(data?.authenticated));
      })
      .catch(() => {
        if (!mounted) return;
        setIsAuthenticated(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusFromQuery = params.get('focusCommentId');
    const hash = location.hash || '';
    const focusFromHash = hash.startsWith('#comment-') ? hash.replace('#comment-', '') : (hash ? hash.replace('#', '') : null);
    const focus = focusFromQuery || focusFromHash;
    if (!focus) return;
    if (!comments || comments.length === 0) return;
    // wait a tick for DOM render
    setTimeout(() => {
      const el = document.getElementById(`comment-${focus}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const prevBg = el.style.background;
        el.style.background = 'rgba(255,245,150,0.5)';
        setTimeout(() => { el.style.background = prevBg || ''; }, 1600);
      }
    }, 200);
  }, [comments, location]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    getPublishedComicDetailApi(slug)
      .then((comicData) => {
        if (!mounted) return;
        setComic(comicData);

        const targetChapterId = chapterId || comicData?.chapters?.[0]?.id;
        if (!targetChapterId) {
          setError('Truyen chua co chapter da dang.');
          setLoading(false);
          return;
        }

        return getPublishedChapterDetailApi(targetChapterId)
          .then((chapterData) => {
            if (!mounted) return;
            setChapter(chapterData);
          });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Khong the tai du lieu truyen.');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug, chapterId]);

  useEffect(() => {
    if (!isAuthenticated || !comic?.id) {
      setIsFollowing(false);
      return;
    }

    let mounted = true;
    getFollowStatusApi(comic.id)
      .then((data) => {
        if (!mounted) return;
        setIsFollowing(Boolean(data?.following));
      })
      .catch(() => {
        if (!mounted) return;
        setIsFollowing(false);
      });

    return () => {
      mounted = false;
    };
  }, [comic?.id, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !chapter?.id) {
      return;
    }

    markChapterReadApi(chapter.id).catch(() => {
      // Keep reader flow uninterrupted when history API fails.
    });
  }, [chapter?.id, isAuthenticated]);

  useEffect(() => {
    loadComments(chapter?.id, 0);
    setRepliesMap({});
    setOpenReplies({});
    setReplyInputs({});
  }, [chapter?.id]);

  const toggleReplies = async (commentId) => {
    const isOpen = openReplies[commentId];
    setOpenReplies((prev) => ({ ...prev, [commentId]: !isOpen }));
    if (!isOpen && !repliesMap[commentId]) {
      try {
        const data = await getCommentRepliesApi(commentId);
        setRepliesMap((prev) => ({ ...prev, [commentId]: Array.isArray(data) ? data : [] }));
      } catch (_) {
        setRepliesMap((prev) => ({ ...prev, [commentId]: [] }));
      }
    }
  };

  const handleReplySubmit = async (commentId) => {
    const content = (replyInputs[commentId] || '').trim();
    if (!content || !isAuthenticated) return;
    setReplySubmitting((prev) => ({ ...prev, [commentId]: true }));
    try {
      await createCommentReplyApi(commentId, content);
      setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
      const data = await getCommentRepliesApi(commentId);
      setRepliesMap((prev) => ({ ...prev, [commentId]: Array.isArray(data) ? data : [] }));
    } catch (_) {
    } finally {
      setReplySubmitting((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  useEffect(() => {
    loadRatingSummary(comic?.id);
  }, [comic?.id]);

  // Auto-scroll to the paragraph currently being read
  useEffect(() => {
    if (tts.currentPara < 0) return;
    const el = document.getElementById(`para-${tts.currentPara}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [tts.currentPara]);

  return (
    <div className="page">
      <Header />
      <div className="container">

        <main className="reader-main">
          <div className="breadcrumb breadcrumb--small">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            {comic ? (
              <Link to={`/chi-tiet-truyen/${slug}`}>{comic.title}</Link>
            ) : (
              <span>Chi tiết truyện</span>
            )}
            <span>»</span>
            <span>{chapter ? `Chapter ${chapter.chapterNo}` : 'Đọc truyện'}</span>
          </div>

          {loading ? <div className="empty-preview">Đang tải chapter...</div> : null}
          {error ? <div className="tip-box">{error}</div> : null}

          {!loading && !error && comic && chapter ? (
            <section className="reader-layout">
              <header className="reader-head">
                <h1>{comic.title}</h1>
                <p>{chapter.title} · Chapter {chapter.chapterNo}</p>
                <div className="reader-actions">
                  {!chapter.locked && !hasImagePages && (
                    <div className="reader-settings-wrapper">
                      <button type="button" className={`reader-settings-btn${settingsOpen ? ' active' : ''}`} onClick={() => setSettingsOpen((v) => !v)}>
                        <FontAwesomeIcon icon={faGear} /> Cài đặt đọc
                      </button>
                      {settingsOpen && (
                        <div className="reader-settings-panel">
                          <div className="reader-settings-group">
                            <span>Cỡ chữ</span>
                            <div className="reader-settings-options">
                              {[['small','Nhỏ'],['medium','Vừa'],['large','Lớn'],['xlarge','Rất lớn']].map(([v, label]) => (
                                <button key={v} type="button"
                                  className={`reader-settings-opt${readFontSize === v ? ' active' : ''}`}
                                  onClick={() => { setReadFontSize(v); localStorage.setItem('read_font_size', v); }}>
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="reader-settings-group">
                            <span>Nền</span>
                            <div className="reader-settings-options">
                              {[['white','Trắng'],['sepia','Sepia'],['dark','Tối'],['black','Đen']].map(([v, label]) => (
                                <button key={v} type="button"
                                  className={`reader-settings-opt reader-settings-opt--bg-${v}${readBg === v ? ' active' : ''}`}
                                  onClick={() => { setReadBg(v); localStorage.setItem('read_bg', v); }}>
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="reader-settings-group">
                            <span>Font chữ</span>
                            <div className="reader-settings-options">
                              {[['default','Mặc định'],['serif','Serif'],['mono','Monospace']].map(([v, label]) => (
                                <button key={v} type="button"
                                  className={`reader-settings-opt${readFont === v ? ' active' : ''}`}
                                  onClick={() => { setReadFont(v); localStorage.setItem('read_font', v); }}>
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!chapter.locked && !hasImagePages && tts.isSupported && (
                    <button type="button" className="reader-settings-btn tts-toggle-btn" onClick={() => setTtsOpen((v) => !v)}>
                      <FontAwesomeIcon icon={faVolumeHigh} /> Nghe truyện
                    </button>
                  )}
                  <button type="button" className="report-btn" onClick={() => openReportModal('COMIC', comic?.title)}>
                    <FontAwesomeIcon icon={faFlag} /> Báo cáo vi phạm
                  </button>
                </div>

                {ttsOpen && !hasImagePages && tts.isSupported && (
                  <div className="tts-panel">
                    <div className="tts-panel-controls">
                      <div className="tts-playback-btns">
                        {!tts.isPlaying ? (
                          <button type="button" className="tts-btn tts-btn--play" onClick={tts.play} title="Phát">
                            <FontAwesomeIcon icon={faPlay} />
                          </button>
                        ) : (
                          <button type="button" className="tts-btn tts-btn--pause" onClick={tts.pause} title="Tạm dừng">
                            <FontAwesomeIcon icon={faPause} />
                          </button>
                        )}
                        <button type="button" className="tts-btn tts-btn--stop" onClick={tts.stop} title="Dừng" disabled={!tts.isPlaying && !tts.isPaused}>
                          <FontAwesomeIcon icon={faStop} />
                        </button>
                      </div>

                      <div className="tts-rate-group">
                        <span>Tốc độ</span>
                        <div className="tts-rate-options">
                          {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                            <button
                              key={r}
                              type="button"
                              className={`tts-rate-btn${tts.rate === r ? ' active' : ''}`}
                              onClick={() => tts.changeRate(r)}
                            >
                              {r}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {tts.voices.length > 0 && (
                        <div className="tts-voice-group">
                          <span>Giọng đọc</span>
                          <div className="tts-gender-options">
                            {[['female','Nữ','♀'],['male','Nam','♂'],['all','Tất cả','◉']].map(([g, label, icon]) => {
                              const hasVoice = tts.voicesWithGender.some((v) => g === 'all' || v.gender === g);
                              return (
                                <button
                                  key={g}
                                  type="button"
                                  className={`tts-gender-btn tts-gender-btn--${g}${tts.genderFilter === g ? ' active' : ''}${!hasVoice ? ' disabled' : ''}`}
                                  onClick={() => hasVoice && tts.changeGenderFilter(g)}
                                  title={hasVoice ? label : `Không có giọng ${label}`}
                                >
                                  {icon} {label}
                                </button>
                              );
                            })}
                          </div>
                          {tts.filteredVoices.length > 1 && (
                            <select
                              className="tts-voice-select"
                              value={tts.selectedVoice}
                              onChange={(e) => tts.changeVoice(e.target.value)}
                            >
                              {tts.filteredVoices.map(({ voice, gender }) => (
                                <option key={voice.name} value={voice.name}>
                                  {gender === 'female' ? '♀' : gender === 'male' ? '♂' : '◉'} {voice.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>

                    {(tts.isPlaying || tts.isPaused) && tts.currentPara >= 0 && (
                      <div className="tts-progress">
                        <span className="tts-progress-label">
                          {tts.isPaused ? 'Đang tạm dừng' : 'Đang đọc'} đoạn {tts.currentPara + 1}/{textLines.length}
                        </span>
                        <div className="tts-progress-bar">
                          <div
                            className="tts-progress-fill"
                            style={{ width: `${((tts.currentPara + 1) / textLines.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {!tts.isSupported && (
                      <p className="tts-unsupported">Trình duyệt của bạn không hỗ trợ tính năng đọc truyện. Hãy dùng Chrome hoặc Edge.</p>
                    )}
                  </div>
                )}

                {reportOpen ? (
                  <div className="report-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setReportOpen(false); }}>
                    <div className="report-modal">
                      <h4>Báo cáo nội dung vi phạm</h4>
                      {reportTargetLabel ? <p className="reader-follow-message" style={{ marginTop: 0 }}>{reportTargetLabel}</p> : null}
                      <form onSubmit={handleReportSubmit}>
                        <label className="report-modal-label">
                          <span>Loại báo cáo</span>
                          <select value={reportTargetType} onChange={(e) => setReportTargetType(e.target.value)}>
                            <option value="COMIC">Báo cáo truyện</option>
                            <option value="CHAPTER">Báo cáo chapter này</option>
                            {reportCommentId ? <option value="COMMENT">Báo cáo bình luận</option> : null}
                          </select>
                        </label>
                        <label className="report-modal-label">
                          <span>Lý do nhanh</span>
                          <select value={reportReasonKey} onChange={(e) => setReportReasonKey(e.target.value)}>
                            {REPORT_REASON_OPTIONS.map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </select>
                        </label>
                        <label className="report-modal-label">
                          <span>Mô tả thêm</span>
                          <textarea
                            rows={3}
                            maxLength={500}
                            placeholder="Mô tả nội dung vi phạm..."
                            value={reportReasonDetail}
                            onChange={(e) => setReportReasonDetail(e.target.value)}
                          />
                        </label>
                        {reportMessage ? <p className="reader-follow-message">{reportMessage}</p> : null}
                        <div className="report-modal-actions">
                          <button type="submit" className="secondary-btn" disabled={reportSubmitting}>
                            {reportSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                          </button>
                          <button type="button" className="ghost-btn" onClick={() => setReportOpen(false)}>Hủy</button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : null}

                {lastReport?.reportId ? (
                  <div className="reader-follow-message" style={{ marginTop: 16, padding: 16, border: '1px solid var(--line)', borderRadius: 12 }}>
                    <strong>Kháng nghị báo cáo #{lastReport.reportId}</strong>
                    <p style={{ marginTop: 8, marginBottom: 12 }}>
                      Nếu bạn muốn bổ sung giải trình, hãy gửi nội dung kháng nghị bên dưới.
                    </p>
                    <form onSubmit={handleAppealSubmit}>
                      <textarea
                        rows={3}
                        maxLength={800}
                        placeholder="Viết nội dung kháng nghị..."
                        value={appealMessage}
                        onChange={(e) => setAppealMessage(e.target.value)}
                        style={{ width: '100%', marginBottom: 10 }}
                      />
                      {appealNotice ? <p className="reader-follow-message">{appealNotice}</p> : null}
                      <button type="submit" className="secondary-btn" disabled={appealSubmitting}>
                        {appealSubmitting ? 'Đang gửi...' : 'Gửi kháng nghị'}
                      </button>
                    </form>
                  </div>
                ) : null}
              </header>

              {chapter.locked ? (
                <div className="chapter-lock-overlay">
                  <div className="chapter-lock-box">
                    <div className="chapter-lock-icon">🔒</div>
                    <h3>Chapter trả phí</h3>
                    <p>Mở khóa chapter này với <strong>{(chapter.price ?? 0).toLocaleString()} xu</strong></p>
                    {unlockMessage ? <p className="reader-follow-message">{unlockMessage}</p> : null}
                    <button
                      type="button"
                      className="secondary-btn chapter-unlock-btn"
                      disabled={unlocking}
                      onClick={handleUnlockChapter}
                    >
                      {unlocking ? 'Đang xử lý...' : `Mở khóa — ${(chapter.price ?? 0).toLocaleString()} xu`}
                    </button>
                    <p className="chapter-lock-hint">Nạp xu tại <Link to="/vi-xu">trang ví xu</Link></p>
                  </div>
                </div>
              ) : hasImagePages ? (
                <>
                  <div className="reader-chapter-nav">
                    <button
                      type="button"
                      className="reader-nav-btn"
                      disabled={!prevChapter}
                      onClick={() => prevChapter && openChapter(prevChapter.id)}
                    >
                      ‹ Chap trước
                    </button>

                    <select
                      className="reader-chapter-select"
                      value={chapter.id}
                      onChange={(e) => openChapter(e.target.value)}
                    >
                      {sortedChapters.map((item) => (
                        <option key={item.id} value={item.id}>
                          Chap {item.chapterNo}{item.price > 0 ? ' 🔒' : ''}: {item.title}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="reader-nav-btn reader-nav-btn--next"
                      disabled={!nextChapter}
                      onClick={() => nextChapter && openChapter(nextChapter.id)}
                    >
                      Chap tiếp ›
                    </button>
                  </div>

                  <article className="reader-pages">
                    {chapter.pages.map((page) => (
                      <img key={page.id} src={page.imageUrl} alt={page.fileName || chapter.title} loading="lazy" />
                    ))}
                  </article>

                  <div className="reader-chapter-nav reader-chapter-nav--bottom">
                    <button
                      type="button"
                      className="reader-nav-btn"
                      disabled={!prevChapter}
                      onClick={() => prevChapter && openChapter(prevChapter.id)}
                    >
                      ‹ Chap trước
                    </button>

                    <button
                      type="button"
                      className="reader-nav-btn reader-nav-btn--next"
                      disabled={!nextChapter}
                      onClick={() => nextChapter && openChapter(nextChapter.id)}
                    >
                      Chap tiếp ›
                    </button>
                  </div>
                </>
              ) : (
                <section className="text-reader-layout">
                  <div className="reader-chapter-nav">
                    <button
                      type="button"
                      className="reader-nav-btn"
                      disabled={!prevChapter}
                      onClick={() => prevChapter && openChapter(prevChapter.id)}
                    >
                      ‹ Chap trước
                    </button>

                    <select
                      className="reader-chapter-select"
                      value={chapter.id}
                      onChange={(e) => openChapter(e.target.value)}
                    >
                      {sortedChapters.map((item) => (
                        <option key={item.id} value={item.id}>
                          Chương {item.chapterNo}{item.price > 0 ? ' 🔒' : ''}: {item.title}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="reader-nav-btn reader-nav-btn--next"
                      disabled={!nextChapter}
                      onClick={() => nextChapter && openChapter(nextChapter.id)}
                    >
                      Chap tiếp ›
                    </button>
                  </div>

                  <article
                    className={`text-reader-content text-reader-content--${readBg} text-reader-font--${readFont} text-reader-size--${readFontSize}`}
                  >
                    {textLines.length > 0 ? (
                      textLines.map((para, index) => {
                        const isActivePara = tts.currentPara === index;
                        const wordRange = isActivePara ? tts.currentWord : null;

                        let content;
                        if (isActivePara && wordRange && wordRange.charLength > 0) {
                          const before = para.slice(0, wordRange.charIndex);
                          const word = para.slice(wordRange.charIndex, wordRange.charIndex + wordRange.charLength);
                          const after = para.slice(wordRange.charIndex + wordRange.charLength);
                          content = (
                            <>
                              {before}
                              <mark className="tts-word-highlight">{word}</mark>
                              {after}
                            </>
                          );
                        } else {
                          content = para;
                        }

                        return (
                          <p
                            key={index}
                            id={`para-${index}`}
                            className={isActivePara ? 'tts-reading' : undefined}
                            onClick={() => tts.speakFrom(index)}
                            style={{ cursor: tts.isSupported ? 'pointer' : undefined }}
                          >
                            {content}
                          </p>
                        );
                      })
                    ) : (
                      <p>Chapter này chưa có nội dung chữ.</p>
                    )}
                  </article>

                  <div className="reader-chapter-nav reader-chapter-nav--bottom">
                    <button
                      type="button"
                      className="reader-nav-btn"
                      disabled={!prevChapter}
                      onClick={() => prevChapter && openChapter(prevChapter.id)}
                    >
                      ‹ Chap trước
                    </button>
                    <button
                      type="button"
                      className="reader-nav-btn reader-nav-btn--next"
                      disabled={!nextChapter}
                      onClick={() => nextChapter && openChapter(nextChapter.id)}
                    >
                      Chap tiếp ›
                    </button>
                  </div>
                </section>
              )}

              <section className="reader-comments">
                <h3>Binh luan chapter</h3>

                <form className="reader-comment-form" onSubmit={handleCommentSubmit}>
                  <textarea
                    value={commentInput}
                    onChange={(event) => setCommentInput(event.target.value)}
                    rows={3}
                    maxLength={1200}
                    placeholder="Viet binh luan cua ban..."
                  />
                  <button type="submit" className="secondary-btn" disabled={commentSubmitting}>
                    {commentSubmitting ? 'Dang gui...' : 'Gui binh luan'}
                  </button>
                </form>
                {commentMessage ? <p className="reader-follow-message">{commentMessage}</p> : null}

                {commentsLoading ? <div className="empty-preview">Dang tai binh luan...</div> : null}

                {!commentsLoading && comments.length === 0 ? (
                  <div className="empty-preview">Chua co binh luan nao cho chapter nay.</div>
                ) : null}

                {!commentsLoading && comments.length > 0 ? (
                  <>
                  <div className="reader-comment-list">
                    {comments.map((item) => (
                      <article id={`comment-${item.id}`} key={item.id} className="reader-comment-item">
                        <div className="reader-comment-head">
                          <strong>{item.displayName || 'Nguoi dung'}</strong>
                          <span>{item.createdAt}</span>
                        </div>
                        <p>{item.content}</p>
                        {(() => {
                          const count = Math.max(item.replyCount || 0, repliesMap[item.id]?.length || 0);
                          return count > 0 ? (
                            <button
                              type="button"
                              className="view-replies-btn"
                              onClick={() => toggleReplies(item.id)}
                            >
                              {openReplies[item.id] ? 'Ẩn phản hồi' : `Xem tất cả ${count} phản hồi`}
                            </button>
                          ) : null;
                        })()}
                        <div className="reader-comment-actions">
                          <button
                            type="button"
                            className="reply-toggle-btn"
                            onClick={() => toggleReplies(item.id)}
                          >
                            Trả lời
                          </button>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => openReportModal('COMMENT', `Bình luận của ${item.displayName || 'người dùng'}`, item.id)}
                          >
                            Báo cáo
                          </button>
                          {item.own ? (
                            <button type="button" className="chapter-remove-btn" onClick={() => handleDeleteComment(item.id)}>
                              Xóa
                            </button>
                          ) : null}
                        </div>

                        {openReplies[item.id] && (
                          <div className="reader-replies">
                            {(repliesMap[item.id] || []).map((reply) => (
                              <div key={reply.id} className="reader-reply-item">
                                <div className="reader-comment-head">
                                  <strong>{reply.userName || 'Người dùng'}</strong>
                                  <span>{reply.createdAt}</span>
                                </div>
                                <p>{reply.content}</p>
                              </div>
                            ))}
                            {isAuthenticated ? (
                              <div className="reader-reply-form">
                                <input
                                  type="text"
                                  placeholder="Viết trả lời..."
                                  value={replyInputs[item.id] || ''}
                                  onChange={(e) => setReplyInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleReplySubmit(item.id); }}
                                  maxLength={500}
                                />
                                <button
                                  type="button"
                                  className="secondary-btn"
                                  disabled={replySubmitting[item.id]}
                                  onClick={() => handleReplySubmit(item.id)}
                                >
                                  {replySubmitting[item.id] ? '...' : 'Gửi'}
                                </button>
                              </div>
                            ) : (
                              <p className="reply-login-hint">Đăng nhập để trả lời</p>
                            )}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                  {commentsHasMore && (
                    <button
                      type="button"
                      className="secondary-btn load-more-comments-btn"
                      disabled={commentsLoading}
                      onClick={() => loadComments(chapter?.id, commentPage + 1)}
                    >
                      {commentsLoading ? 'Đang tải...' : 'Xem thêm bình luận'}
                    </button>
                  )}
                  </>
                ) : null}
              </section>
            </section>
          ) : null}
        </main>

        <Footer />
      </div>

      {showScrollTop && (
        <button
          type="button"
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Lên đầu trang"
        >
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
      )}
    </div>
  );
}
