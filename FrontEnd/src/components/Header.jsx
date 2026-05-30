import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faCoins, faUser, faShield, faPen,
  faBookOpen, faBook, faRightFromBracket, faUserPlus, faCaretDown,
  faTrophy, faEye, faStar, faHeart, faFire, faChartBar, faCalendarDay, faCalendarWeek, faCalendar, faCheckCircle,
  faHouse, faBolt, faClockRotateLeft, faBookmark, faLayerGroup, faMagnifyingGlassChart,
} from '@fortawesome/free-solid-svg-icons';
import { logoutApi, meApi } from '../services/authApi';
import { getWalletBalanceApi } from '../services/walletApi';
import NotificationsDropdown from './NotificationsDropdown';

const categoryColumns = [
  [
    { name: 'Tất cả', hot: true },
    { name: 'Action' },
    { name: 'Adventure' },
    { name: 'Anime' },
    { name: 'Chuyển Sinh', hot: true },
    { name: 'Comedy' },
    { name: 'Comic' },
    { name: 'Cooking' },
    { name: 'Cổ Đại', hot: true },
    { name: 'Doujinshi' },
    { name: 'Drama' },
    { name: 'Đam Mỹ', hot: true },
    { name: 'Fantasy' },
    { name: 'Gender Bender' },
  ],
  [
    { name: 'Historical' },
    { name: 'Horror' },
    { name: 'Live action' },
    { name: 'Manga' },
    { name: 'Manhua', hot: true },
    { name: 'Manhwa', hot: true },
    { name: 'Martial Arts' },
    { name: 'Mecha' },
    { name: 'Mystery' },
    { name: 'Ngôn Tình', hot: true },
    { name: 'Psychological' },
    { name: 'Romance', hot: true },
    { name: 'School Life' },
    { name: 'Sci-fi' },
  ],
  [
    { name: 'Shoujo' },
    { name: 'Shoujo Ai' },
    { name: 'Shounen' },
    { name: 'Shounen Ai' },
    { name: 'Slice of Life' },
    { name: 'Sports' },
    { name: 'Supernatural' },
    { name: 'Thiếu Nhi' },
    { name: 'Tragedy' },
    { name: 'Trinh Thám' },
    { name: 'Truyện scan' },
    { name: 'Truyện Màu' },
    { name: 'Webtoon' },
    { name: 'Xuyên Không', hot: true },
  ],
  [
    { name: 'Tu Tiên', hot: true },
    { name: 'TruyenQQ' },
    { name: 'BlogTruyen' },
    { name: 'TeamLanhLung' },
    { name: 'Tủ Sách Xinh Xinh' },
    { name: 'TruyenGiHot' },
    { name: 'Tu Tiên Truyện' },
    { name: 'UngtyComics' },
    { name: 'VyComycs' },
    { name: 'Bảo Tàng Truyện' },
    { name: 'Dưa Leo Truyện' },
    { name: 'Fastscan' },
    { name: 'CManga' },
    { name: 'FuHu' },
  ],
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/tim-truyen?q=${encodeURIComponent(q)}` : '/tim-truyen');
  }, [searchQuery, navigate]);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  const refreshWalletBalance = useCallback(() => {
    getWalletBalanceApi()
      .then((bal) => setWalletBalance(typeof bal === 'number' ? bal : (bal?.balance ?? 0)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    meApi()
      .then((data) => {
        if (!mounted) return;
        if (data?.authenticated) {
          setCurrentUser(data);
          getWalletBalanceApi()
            .then((bal) => {
              if (!mounted) return;
              setWalletBalance(typeof bal === 'number' ? bal : (bal?.balance ?? 0));
            })
            .catch(() => {});
        } else {
          setCurrentUser(null);
          setWalletBalance(null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setCurrentUser(null);
        setWalletBalance(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    window.addEventListener('wallet:updated', refreshWalletBalance);
    return () => window.removeEventListener('wallet:updated', refreshWalletBalance);
  }, [refreshWalletBalance]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (_) {
      // Keep UX simple even when logout API fails.
    } finally {
      setCurrentUser(null);
      setMenuOpen(false);
      navigate('/');
    }
  };

  return (
    <header className="header-wrap">
      <div className="header-top">
        <Link to="/" className="logo" aria-label="TopTruyen">
          <span className="logo-net">Top</span>
          <span className="logo-truyen">Truyen</span>
        </Link>
        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Tìm truyện, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" aria-label="Tìm kiếm"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
        </form>
        <div className="header-right">
          {currentUser && walletBalance !== null && (
            <Link className="header-balance" to="/vi-xu" aria-label="Ví xu">
              <FontAwesomeIcon icon={faCoins} /> {walletBalance.toLocaleString()}
            </Link>
          )}
          {currentUser && <NotificationsDropdown />}
          <div className="account-menu" ref={accountMenuRef}>
            <button
              className="account-link account-trigger"
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
            >
              <FontAwesomeIcon icon={faUser} /> {currentUser?.displayName || 'Tài khoản'} <FontAwesomeIcon icon={faCaretDown} />
            </button>

            {menuOpen && (
              <div className="account-dropdown">
                {currentUser ? (
                  <>
                    {currentUser.isAdmin && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faShield} /> Trang quản trị</Link>
                    )}
                    <Link to="/tai-khoan" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faUser} /> Trang cá nhân</Link>
                    <Link to="/sang-tac" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faPen} /> Sáng tác</Link>
                    <Link to="/theo-doi" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faBookOpen} /> Tủ truyện</Link>
                    <Link to="/lich-su" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faBook} /> Lịch sử đọc</Link>
                    <Link to="/linh-thach" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faCoins} /> Xu</Link>
                    <button type="button" className="menu-action" onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Thoát</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faUser} /> Đăng nhập</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)}><FontAwesomeIcon icon={faUserPlus} /> Đăng ký</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="main-nav">
        <Link className="active" to="/"><FontAwesomeIcon icon={faHouse} /> Trang chủ</Link>
        <Link to="/tim-truyen"><FontAwesomeIcon icon={faBolt} /> Hot</Link>
        <Link to="/lich-su"><FontAwesomeIcon icon={faClockRotateLeft} /> Lịch sử</Link>
        <Link to="/theo-doi"><FontAwesomeIcon icon={faBookmark} /> Theo dõi</Link>

        <div className="main-nav-item category-item">
          <Link to="/tim-truyen" className="category-link">
            <FontAwesomeIcon icon={faLayerGroup} /> Thể loại <FontAwesomeIcon icon={faCaretDown} />
          </Link>
          <div className="category-mega">
            {categoryColumns.map((column, index) => (
              <ul key={`col-${index}`}>
                {column.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.name === 'Tất cả' ? '/tim-truyen' : `/tim-truyen?category=${encodeURIComponent(item.name)}`}
                      className={item.hot ? 'hot' : ''}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <div className="main-nav-item ranking-item">
          <Link to="/xep-hang" className="ranking-link">
            <FontAwesomeIcon icon={faTrophy} /> Xếp hạng <FontAwesomeIcon icon={faCaretDown} />
          </Link>
          <div className="ranking-mega">
            <div className="ranking-mega-col">
              <Link to="/xep-hang?type=top-all"><FontAwesomeIcon icon={faEye} /> Top all</Link>
              <Link to="/xep-hang?type=top-thang"><FontAwesomeIcon icon={faCalendar} /> Top tháng</Link>
              <Link to="/xep-hang?type=top-tuan"><FontAwesomeIcon icon={faCalendarWeek} /> Top tuần</Link>
              <Link to="/xep-hang?type=top-ngay"><FontAwesomeIcon icon={faCalendarDay} /> Top ngày</Link>
              <Link to="/xep-hang?type=top-follow"><FontAwesomeIcon icon={faHeart} /> Top Follow</Link>
            </div>
            <div className="ranking-mega-col">
              <Link to="/xep-hang?type=truyen-full" className="ranking-hot"><FontAwesomeIcon icon={faCheckCircle} /> Truyện full</Link>
              <Link to="/xep-hang?type=yeu-thich"><FontAwesomeIcon icon={faStar} /> Yêu Thích</Link>
              <Link to="/xep-hang?type=moi-cap-nhat"><FontAwesomeIcon icon={faFire} /> Mới cập nhật</Link>
              <Link to="/xep-hang?type=truyen-moi"><FontAwesomeIcon icon={faBook} /> Truyện mới</Link>
              <Link to="/xep-hang?type=so-chapter"><FontAwesomeIcon icon={faChartBar} /> Số chapter</Link>
            </div>
          </div>
        </div>
        <Link to="/tim-truyen"><FontAwesomeIcon icon={faMagnifyingGlassChart} /> Tìm truyện</Link>
      </nav>
    </header>
  );
}
