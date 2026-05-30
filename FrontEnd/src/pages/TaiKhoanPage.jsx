import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBookOpen, faClock, faCoins, faLock, faRightFromBracket, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { changePasswordApi, getProfileApi, logoutApi, meApi, updateAvatarApi, updateProfileApi } from '../services/authApi';
import { checkInApi, getDailyStatusApi, getWalletBalanceApi } from '../services/walletApi';
import { getFollowedComicsApi, getReadHistoryApi } from '../services/libraryApi';
import { uploadImageApi } from '../services/uploadApi';

const defaultHistory = [
  { time: '2026-04-06 16:29:33', type: 'Điểm danh', amount: '+100' },
];

export default function TaiKhoanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [section, setSection] = useState('tai-khoan');
  const [activeTab, setActiveTab] = useState('history');
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwMessageType, setPwMessageType] = useState('');
  const [stone, setStone] = useState(0);
  const [history, setHistory] = useState(defaultHistory);
  const [checkedInToday, setCheckedInToday] = useState(false);
const [profile, setProfile] = useState({ displayName: '', gender: '', bio: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileMessageType, setProfileMessageType] = useState('');
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [followedComics, setFollowedComics] = useState([]);
  const [readHistory, setReadHistory] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const appendHistory = (type, amount) => {
    const time = new Date().toLocaleString('sv-SE').replace('T', ' ');
    setHistory((prev) => [{ time, type, amount }, ...prev]);
  };

  const handleCheckIn = async () => {
    if (checkedInToday) return;
    try {
      const data = await checkInApi();
      setCheckedInToday(true);
      const reward = data?.reward ?? 100;
      if (data?.newBalance != null) setStone(data.newBalance);
      else setStone((prev) => prev + reward);
      appendHistory('Điểm danh', `+${reward}`);
    } catch (err) {
      if (err.message?.includes('đã điểm danh')) setCheckedInToday(true);
    }
  };

  const handleProfileChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const openProfileEditor = () => {
    setProfileMessage('');
    setProfileMessageType('');
    setIsProfileEditorOpen(true);
  };

  const closeProfileEditor = () => {
    setIsProfileEditorOpen(false);
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');

    try {
      await updateProfileApi({
        displayName: profile.displayName.trim(),
        gender: profile.gender.trim(),
        bio: profile.bio,
      });
      setMe((prev) => (prev ? { ...prev, displayName: profile.displayName.trim() } : prev));
      setProfileMessage('Cập nhật hồ sơ thành công.');
      setProfileMessageType('success');
    } catch (error) {
      setProfileMessage(error.message || 'Cập nhật hồ sơ thất bại.');
      setProfileMessageType('error');
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    meApi()
      .then((data) => {
        if (!mounted) return;
        if (data?.authenticated) {
          setMe(data);
        } else {
          setMe(null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setMe(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!me?.authenticated) {
      return;
    }

    let mounted = true;
    setProfileLoading(true);

    getProfileApi()
      .then((data) => {
        if (!mounted) return;
        setProfile({
          displayName: data?.displayName || me.displayName || '',
          gender: data?.gender || '',
          bio: data?.bio || '',
        });
        if (data?.avatar) setAvatarUrl(data.avatar);
      })
      .catch(() => {
        if (!mounted) return;
        setProfile({
          displayName: me.displayName || '',
          gender: '',
          bio: '',
        });
      })
      .finally(() => {
        if (!mounted) return;
        setProfileLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [me]);

  useEffect(() => {
    if (!me?.authenticated) {
      setStone(0);
      return;
    }
    Promise.all([
      getWalletBalanceApi().catch(() => null),
      getDailyStatusApi().catch(() => null),
    ]).then(([balanceData, statusData]) => {
      if (balanceData != null) {
        const bal = typeof balanceData === 'number' ? balanceData : (balanceData?.balance ?? 0);
        setStone(bal);
      }
      if (statusData) {
        setCheckedInToday(!!statusData.checkedIn);
      }
    });
  }, [me?.authenticated]);

  useEffect(() => {
    if (!me?.authenticated) {
      setFollowedComics([]);
      setReadHistory([]);
      return;
    }

    let mounted = true;
    setLibraryLoading(true);

    Promise.all([
      getFollowedComicsApi().catch(() => []),
      getReadHistoryApi().catch(() => []),
    ])
      .then(([follows, history]) => {
        if (!mounted) return;
        setFollowedComics(Array.isArray(follows) ? follows : []);
        setReadHistory(Array.isArray(history) ? history : []);
      })
      .finally(() => {
        if (!mounted) return;
        setLibraryLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [me?.authenticated]);

  useEffect(() => {
    if (location.pathname === '/linh-thach') {
      setSection('linh-thach');
    } else if (section !== 'doi-mat-khau') {
      setSection('tai-khoan');
    }
  }, [location.pathname]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage('Mật khẩu xác nhận không khớp');
      setPwMessageType('error');
      return;
    }
    setPwSaving(true);
    try {
      await changePasswordApi(pwForm.oldPassword, pwForm.newPassword);
      setPwMessage('Đổi mật khẩu thành công!');
      setPwMessageType('success');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMessage(err.message || 'Đổi mật khẩu thất bại');
      setPwMessageType('error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarMessage('');
    try {
      const uploadResult = await uploadImageApi(file);
      const url = uploadResult.imageUrl || uploadResult.url;
      await updateAvatarApi(url);
      setAvatarUrl(url);
      setAvatarMessage('Cập nhật ảnh đại diện thành công.');
    } catch (err) {
      setAvatarMessage(err.message || 'Tải ảnh thất bại.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    try { await logoutApi(); } catch (_) {}
    navigate('/');
  };

  useEffect(() => {
    if (!isProfileEditorOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    const onEsc = (event) => {
      if (event.key === 'Escape') {
        closeProfileEditor();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isProfileEditorOpen]);

  return (
    <div className="page taikhoan-page">
      <Header />
      <div className="container">

        <main className="taikhoan-main">
          <div className="warning-box warning-box--compact">
            <span className="warning-icon"></span>
          </div>

          <div className="breadcrumb breadcrumb--small">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            <span>Thông tin chung</span>
          </div>

          {loading ? (
            <div className="account-empty">Đang tải thông tin tài khoản...</div>
          ) : !me ? (
            <div className="account-empty">
              Bạn chưa đăng nhập. <Link to="/login">Vào trang đăng nhập</Link>
            </div>
          ) : (
            <section className="taikhoan-layout">
              <aside className="account-sidebar">
                <div className="account-card-head">
                  <div className="account-avatar"><FontAwesomeIcon icon={faUser} /></div>
                  <div>
                    <small>Tài khoản của</small>
                    <strong>{me.displayName}</strong>
                  </div>
                </div>
                <nav className="account-nav">
                  <button type="button" className={section === 'tai-khoan' ? 'active' : ''} onClick={() => setSection('tai-khoan')}><FontAwesomeIcon icon={faCircleInfo} /> Thông tin tài khoản</button>
                  <button type="button" className={section === 'theo-doi' ? 'active' : ''} onClick={() => setSection('theo-doi')}><FontAwesomeIcon icon={faBookOpen} /> Truyện theo dõi</button>
                  <button type="button" className={section === 'lich-su' ? 'active' : ''} onClick={() => setSection('lich-su')}><FontAwesomeIcon icon={faClock} /> Lịch sử đọc</button>
                  <Link className={section === 'linh-thach' ? 'active' : ''} to="/linh-thach"><FontAwesomeIcon icon={faCoins} /> Xu</Link>
                  <button type="button" className={section === 'doi-mat-khau' ? 'active' : ''} onClick={() => { setSection('doi-mat-khau'); setPwMessage(''); }}><FontAwesomeIcon icon={faLock} /> Đổi mật khẩu</button>
                  <button type="button" onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Thoát</button>
                </nav>
              </aside>

              <div className="account-content">
                {section === 'linh-thach' ? (
                  <>
                    <h1>XU</h1>

                    <section className="account-box">
                      <h2>Xu hiện có: <span className="text-red">{stone}</span></h2>
                      <p className="wallet-desc">
                        Xu thể hiện mức độ tài phú của bạn. Bạn có thể dùng để mở vật phẩm,
                        unlock tính năng hoặc tham gia các hoạt động cộng đồng.
                      </p>

                      <div className="wallet-tabs">
                        <button
                          type="button"
                          className={activeTab === 'history' ? 'active' : ''}
                          onClick={() => setActiveTab('history')}
                        >
                          Lịch sử
                        </button>
                        <button
                          type="button"
                          className={activeTab === 'checkin' ? 'active' : ''}
                          onClick={() => setActiveTab('checkin')}
                        >
                          Điểm danh
                        </button>
                        <button
                          type="button"
                          className={activeTab === 'mission' ? 'active' : ''}
                          onClick={() => setActiveTab('mission')}
                        >
                          Nhiệm vụ
                        </button>
                      </div>

                      {activeTab === 'history' && (
                        <div className="wallet-table">
                          <div className="wallet-table-head">
                            <span>THỜI GIAN</span>
                            <span>LOẠI</span>
                            <span>XU</span>
                          </div>
                          {history.map((item, index) => (
                            <div className="wallet-row" key={`${item.time}-${index}`}>
                              <span>{item.time}</span>
                              <span>{item.type}</span>
                              <span className="wallet-plus">{item.amount}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'checkin' && (
                        <div className="wallet-panel">
                          <h3>Lưu ý</h3>
                          <ul>
                            <li>Mỗi ngày chỉ được điểm danh 1 lần.</li>
                            <li>Mỗi lần điểm danh nhận 100 xu.</li>
                            <li>Điểm danh liên tục sẽ giúp tăng tích lũy nhanh hơn.</li>
                          </ul>
                          <button type="button" className="wallet-action" onClick={handleCheckIn} disabled={checkedInToday}>
                            {checkedInToday ? 'Đã điểm danh hôm nay' : 'Điểm danh'}
                          </button>
                        </div>
                      )}

                      {activeTab === 'mission' && (
                        <div className="wallet-panel">
                          <p className="wallet-dev">Tính năng nhiệm vụ đang phát triển.</p>
                        </div>
                      )}
                    </section>
                  </>
                ) : section === 'doi-mat-khau' ? (
                  <>
                    <h1>ĐỔI MẬT KHẨU</h1>
                    <section className="account-box" style={{ maxWidth: 480 }}>
                      <form onSubmit={handleChangePassword} className="profile-form">
                        <label htmlFor="pw-old">Mật khẩu cũ</label>
                        <input
                          id="pw-old"
                          type="password"
                          value={pwForm.oldPassword}
                          onChange={(e) => setPwForm((p) => ({ ...p, oldPassword: e.target.value }))}
                          required
                          autoComplete="current-password"
                        />
                        <label htmlFor="pw-new">Mật khẩu mới</label>
                        <input
                          id="pw-new"
                          type="password"
                          value={pwForm.newPassword}
                          onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                          required
                          minLength={6}
                          autoComplete="new-password"
                        />
                        <label htmlFor="pw-confirm">Xác nhận mật khẩu mới</label>
                        <input
                          id="pw-confirm"
                          type="password"
                          value={pwForm.confirmPassword}
                          onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                          required
                          autoComplete="new-password"
                        />
                        {pwMessage ? (
                          <p className={`form-message ${pwMessageType === 'success' ? 'form-message--success' : 'form-message--error'}`}>
                            {pwMessage}
                          </p>
                        ) : null}
                        <div className="profile-actions">
                          <button type="submit" className="profile-save-btn" disabled={pwSaving}>
                            {pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                          </button>
                        </div>
                      </form>
                    </section>
                  </>
                ) : section === 'lich-su' ? (
                  <>
                    <h1>LỊCH SỬ ĐỌC</h1>
                    <section className="account-follow-box">
                      <div className="follow-table-head">
                        <span>TÊN TRUYỆN</span>
                        <span>CHAPTER ĐÃ ĐỌC</span>
                        <span>THỜI GIAN</span>
                      </div>
                      {libraryLoading ? <div className="follow-empty">Đang tải...</div> : null}
                      {!libraryLoading && readHistory.length === 0 ? (
                        <div className="follow-empty">Chưa có lịch sử đọc</div>
                      ) : null}
                      {!libraryLoading && readHistory.length > 0 ? (
                        <div className="follow-table-body">
                          {readHistory.map((item) => (
                            <div className="follow-row" key={`${item.comicId}-${item.chapterId}`}>
                              <span>
                                <Link to={`/chi-tiet-truyen/${item.comicSlug}`}>{item.comicTitle}</Link>
                              </span>
                              <span>
                                <Link to={`/doc-truyen/${item.comicSlug}/${item.chapterId}`}>
                                  Chap {item.chapterNo}{item.chapterTitle ? `: ${item.chapterTitle}` : ''}
                                </Link>
                              </span>
                              <span>{item.lastReadAt || '-'}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  </>
                ) : section === 'theo-doi' ? (
                  <>
                    <h1>TRUYỆN THEO DÕI</h1>
                    <section className="account-follow-box">
                      <div className="follow-tip">Truyện mới đọc gần đây sẽ hiển thị ở đầu danh sách.</div>
                      <div className="follow-table-head">
                        <span>TÊN TRUYỆN</span>
                        <span>XEM GẦN NHẤT</span>
                        <span>CHAP MỚI NHẤT</span>
                      </div>
                      {libraryLoading ? <div className="follow-empty">Đang tải...</div> : null}
                      {!libraryLoading && followedComics.length === 0 ? (
                        <div className="follow-empty">Chưa theo dõi truyện nào</div>
                      ) : null}
                      {!libraryLoading && followedComics.length > 0 ? (
                        <div className="follow-table-body">
                          {followedComics.map((item) => {
                            const lastRead = readHistory.find((h) => String(h.comicId) === String(item.comicId));
                            return (
                              <div className="follow-row" key={item.comicId}>
                                <span><Link to={`/chi-tiet-truyen/${item.slug}`}>{item.title}</Link></span>
                                <span>
                                  {lastRead?.chapterId ? (
                                    <Link to={`/doc-truyen/${item.slug}/${lastRead.chapterId}`}>
                                      Chap {lastRead.chapterNo}
                                    </Link>
                                  ) : 'Chưa đọc'}
                                </span>
                                <span>{item.latestChapterNo ? `Chap ${item.latestChapterNo}` : 'Đang cập nhật'}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  </>
                ) : (
                  <>
                    <h1>THÔNG TIN CHUNG</h1>

                    <div className="account-top-grid">
                      <section className="account-box">
                        <h2>Thông tin tài khoản</h2>
                        <div className="account-stat">
                          <span>Cấp 1</span>
                          <span>Cấp 2</span>
                        </div>
                        <div className="account-progress">
                          <div style={{ width: '0%' }} />
                        </div>
                        <ul className="account-info-list">
                          <li><span>Số xu</span><strong>{stone}</strong></li>
                          <li><span>Họ và tên</span><strong>{me.displayName}</strong></li>
                          <li><span>Email</span><strong>{me.email}</strong></li>
                          <li><span>Tài khoản</span><strong>THƯỜNG</strong></li>
                          <li><span>Loại cấp bậc</span><strong className="text-red">Bình Thường</strong></li>
                        </ul>

                        <button type="button" className="account-edit-trigger" onClick={openProfileEditor}>
                          Chỉnh sửa hồ sơ
                        </button>
                      </section>

                      <section className="account-box">
                        <h2>Ảnh đại diện</h2>
                        <div className="avatar-upload">
                          <div className="avatar-preview">
                            {avatarUrl
                              ? <img src={avatarUrl} alt="avatar" className="avatar-preview-img" />
                              : <span><FontAwesomeIcon icon={faUser} /></span>
                            }
                          </div>
                          <div>
                            <label className="avatar-btn" style={{ cursor: avatarUploading ? 'wait' : 'pointer' }}>
                              {avatarUploading ? 'Đang tải...' : 'Chọn ảnh'}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                style={{ display: 'none' }}
                                onChange={handleAvatarChange}
                                disabled={avatarUploading}
                              />
                            </label>
                            <small>jpg, jpeg, gif, png &lt;2MB</small>
                            {avatarMessage && (
                              <p className={avatarMessage.includes('thành công') ? 'form-message form-message--success' : 'form-message form-message--error'}>
                                {avatarMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      </section>
                    </div>

                    <section className="account-follow-box">
                      <h2>Truyện theo dõi</h2>
                      <div className="follow-tip">Truyện mới đọc gần đây sẽ hiển thị ở đầu danh sách.</div>
                      <div className="follow-table-head">
                        <span>TÊN TRUYỆN</span>
                        <span>XEM GẦN NHẤT</span>
                        <span>CHAP MỚI NHẤT</span>
                      </div>

                      {libraryLoading ? <div className="follow-empty">Đang tải thư viện đọc...</div> : null}

                      {!libraryLoading && followedComics.length === 0 ? (
                        <div className="follow-empty">Không có truyện theo dõi</div>
                      ) : null}

                      {!libraryLoading && followedComics.length > 0 ? (
                        <div className="follow-table-body">
                          {followedComics.map((item) => {
                            const lastRead = readHistory.find((historyItem) => String(historyItem.comicId) === String(item.comicId));
                            return (
                              <div className="follow-row" key={item.comicId}>
                                <span>
                                  <Link to={`/doc-truyen/${item.slug}`}>{item.title}</Link>
                                </span>
                                <span>
                                  {lastRead?.chapterId ? (
                                    <Link to={`/doc-truyen/${item.slug}/${lastRead.chapterId}`}>
                                      Chap {lastRead.chapterNo} - {lastRead.chapterTitle}
                                    </Link>
                                  ) : 'Chưa đọc'}
                                </span>
                                <span>{item.latestChapterNo ? `Chap ${item.latestChapterNo}` : 'Đang cập nhật'}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>

                    {isProfileEditorOpen && (
                      <div className="profile-modal-backdrop" onClick={closeProfileEditor}>
                        <div className="profile-modal" onClick={(event) => event.stopPropagation()}>
                          <div className="profile-modal-head">
                            <h3>Chỉnh sửa hồ sơ</h3>
                            <button type="button" onClick={closeProfileEditor}>×</button>
                          </div>

                          <form className="profile-form" onSubmit={handleProfileSubmit}>
                            {profileLoading ? (
                              <p className="profile-hint">Đang tải hồ sơ...</p>
                            ) : (
                              <>
                                <label htmlFor="profile-display-name">Tên hiển thị</label>
                                <input
                                  id="profile-display-name"
                                  type="text"
                                  value={profile.displayName}
                                  onChange={handleProfileChange('displayName')}
                                  maxLength={120}
                                  required
                                />

                                <label htmlFor="profile-gender">Giới tính</label>
                                <select
                                  id="profile-gender"
                                  value={profile.gender}
                                  onChange={handleProfileChange('gender')}
                                >
                                  <option value="">Chọn giới tính</option>
                                  <option value="Nam">Nam</option>
                                  <option value="Nữ">Nữ</option>
                                  <option value="Khác">Khác</option>
                                  <option value="Không muốn tiết lộ">Không muốn tiết lộ</option>
                                </select>

                                <label htmlFor="profile-bio">Giới thiệu</label>
                                <textarea
                                  id="profile-bio"
                                  value={profile.bio}
                                  onChange={handleProfileChange('bio')}
                                  maxLength={500}
                                  rows={4}
                                  placeholder="Viết vài dòng giới thiệu về bạn"
                                />
                                <small>{profile.bio.length}/500 ký tự</small>

                                {profileMessage ? (
                                  <p className={`form-message ${profileMessageType === 'success' ? 'form-message--success' : 'form-message--error'}`}>
                                    {profileMessage}
                                  </p>
                                ) : null}

                                <div className="profile-actions">
                                  <button type="button" className="profile-cancel-btn" onClick={closeProfileEditor}>
                                    Đóng
                                  </button>
                                  <button type="submit" className="profile-save-btn" disabled={profileSaving}>
                                    {profileSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                                  </button>
                                </div>
                              </>
                            )}
                          </form>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
