import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar, faUsers, faBookOpen, faBook, faCommentDots, faFlag,
  faCreditCard, faLandmark, faShield, faCoins, faChartLine, faChartPie,
  faTrophy, faLock, faHourglass, faCircleCheck, faCircleXmark,
  faArrowUp, faArrowDown, faArrowsLeftRight,
} from '@fortawesome/free-solid-svg-icons';
const TABS = [
  { key: 'dashboard', icon: faChartBar, label: 'Tổng quan' },
  { key: 'users', icon: faUsers, label: 'Người dùng' },
  { key: 'comics', icon: faBookOpen, label: 'Truyện' },
  { key: 'chapters', icon: faBook, label: 'Chapter' },
  { key: 'moderation', icon: faHourglass, label: 'Kiểm duyệt' },
  { key: 'comments', icon: faCommentDots, label: 'Bình luận' },
  { key: 'reports', icon: faFlag, label: 'Báo cáo' },
  { key: 'appeals', icon: faShield, label: 'Kháng nghị' },
  { key: 'transactions', icon: faCreditCard, label: 'Giao dịch' },
  { key: 'withdrawals', icon: faLandmark, label: 'Rút tiền' },
];
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdminNoteModal from '../components/AdminNoteModal';
import { meApi } from '../services/authApi';
import {
  deleteAdminChapterApi,
  deleteAdminComicApi,
  deleteAdminCommentApi,
  getAdminChaptersApi,
  getAdminComicsApi,
  getAdminCommentsApi,
  getAdminReportsApi,
  getAdminAppealsApi,
  getAdminRevenueApi,
  getAdminMonthlyRevenueApi,
  getAdminStatsApi,
  getAdminTransactionsApi,
  getAdminUsersApi,
  getAdminWithdrawalRequestsApi,
  processWithdrawalApi,
  resolveReportApi,
  resolveAppealApi,
  getAdminReportDetailApi,
  setComicFeaturedApi,
  setComicStatusApi,
  setUserStatusApi,
  setAdminRoleApi,
  getPendingChaptersAdminApi,
  approveChapterApi,
  rejectChapterApi,
  recheckChapterApi,
  getChapterContentAdminApi,
} from '../services/adminApi';
import { faStar as faStarRegular, faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/free-regular-svg-icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

// Chart color palette used by Pie/Bar series
const CHART_COLORS = ['#58b947', '#4a90d9', '#f17922', '#9b59b6', '#e74c3c', '#95a5a6', '#f1c40f', '#2ecc71'];
function CustomTooltipXu({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="chart-tooltip-row">
          {p.name}: <strong>{Number(p.value).toLocaleString()} xu</strong>
        </div>
      ))}
    </div>
  );
}

// Helper: translate backend enum to Vietnamese labels
function getStatusLabel(s) {
  if (!s) return '—';
  return s === 'PENDING' ? 'Chờ xử lý'
    : s === 'FLAGGED' ? 'Tự động gắn cờ'
    : s === 'RESOLVED' ? 'Đã xử lý'
    : s === 'DISMISSED' ? 'Bỏ qua'
    : s === 'APPROVED' ? 'Đã chấp nhận'
    : s === 'REJECTED' ? 'Từ chối'
    : s;
}

function getTypeLabel(t) {
  if (!t) return '—';
  return t === 'COMIC' ? 'Truyện'
    : t === 'COMMENT' ? 'Bình luận'
    : t === 'CHAPTER' ? 'Chương'
    : t;
}

function StatCard({ label, value, color }) {
  return (
    <div className="admin-stat-card" style={{ borderTop: `3px solid ${color || '#4a90d9'}` }}>
      <div className="admin-stat-value">{Number(value || 0).toLocaleString()}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  );
}

function DashboardTab({ stats }) {
  const outlet = useOutletContext?.() || {};
  const effectiveStats = stats || outlet.stats;
  const [revenue, setRevenue] = useState(null);
  const [revLoading, setRevLoading] = useState(true);
  const [monthly, setMonthly] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  useEffect(() => {
    getAdminRevenueApi()
      .then(setRevenue)
      .catch(() => setRevenue({ totalRevenue: 0, totalDeposit: 0, topAuthors: [], recentTransactions: [] }))
      .finally(() => setRevLoading(false));

    getAdminMonthlyRevenueApi()
      .then((data) => setMonthly(Array.isArray(data) ? data.map((d) => ({
        month: d.month,
        revenue: Number(d.revenue),
        deposits: Number(d.deposits),
      })) : []))
      .catch(() => setMonthly([]))
      .finally(() => setMonthlyLoading(false));
  }, []);

  if (!effectiveStats) return <div className="empty-preview">Đang tải...</div>;

  const pieData = revenue && (Number(revenue.totalRevenue) > 0 || Number(revenue.totalDeposit) > 0)
    ? [
        { name: 'Doanh thu chapter', value: Number(revenue.totalRevenue ?? 0) },
        { name: 'Xu đã nạp', value: Number(revenue.totalDeposit ?? 0) },
      ]
    : null;

  const topAuthorsChart = (revenue?.topAuthors ?? [])
    .slice(0, 8)
    .map((a) => ({ name: a.author_name, value: Number(a.total_earned) }));

  return (
    <div>
      <div className="admin-stats-grid">
        <StatCard label="Người dùng" value={effectiveStats.totalUsers} color="#4a90d9" />
        <StatCard label="Truyện" value={effectiveStats.totalComics} color="#58b947" />
        <StatCard label="Chapter" value={effectiveStats.totalChapters} color="#f17922" />
        <StatCard label="Bình luận" value={effectiveStats.totalComments} color="#9b59b6" />
        <StatCard label="Báo cáo chờ xử lý" value={effectiveStats.pendingReports} color="#e74c3c" />
        <StatCard label="Tổng báo cáo" value={effectiveStats.totalReports} color="#95a5a6" />
      </div>

      <div className="admin-revenue-section">
        <h3 className="admin-section-title"><FontAwesomeIcon icon={faCoins} /> Doanh Thu Hệ Thống</h3>

        {revLoading ? (
          <p className="admin-loading">Đang tải dữ liệu doanh thu...</p>
        ) : (
          <>
            <div className="admin-revenue-cards">
              <div className="admin-revenue-card">
                <div className="admin-revenue-card-value">{Number(revenue?.totalRevenue ?? 0).toLocaleString()} xu</div>
                <div className="admin-revenue-card-label">Tổng doanh thu chapter</div>
              </div>
              <div className="admin-revenue-card">
                <div className="admin-revenue-card-value">{Number(revenue?.totalDeposit ?? 0).toLocaleString()} xu</div>
                <div className="admin-revenue-card-label">Tổng xu đã nạp</div>
              </div>
              <div className="admin-revenue-card">
                <div className="admin-revenue-card-value">{revenue?.topAuthors?.length ?? 0}</div>
                <div className="admin-revenue-card-label">Tác giả có doanh thu</div>
              </div>
            </div>

            <div className="admin-charts-row">
              {monthly.length > 0 && (
                <div className="admin-chart-card admin-chart-card--wide">
                  <h4 className="admin-chart-title"><FontAwesomeIcon icon={faChartLine} /> Xu theo tháng (12 tháng gần nhất)</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={monthly} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip content={<CustomTooltipXu />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#58b947" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="deposits" name="Nạp xu" stroke="#4a90d9" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {pieData && (
                <div className="admin-chart-card">
                  <h4 className="admin-chart-title"><FontAwesomeIcon icon={faChartPie} /> Tỷ lệ doanh thu</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${Number(v).toLocaleString()} xu`} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {topAuthorsChart.length > 0 && (
              <div className="admin-chart-card admin-chart-card--full">
                <h4 className="admin-chart-title"><FontAwesomeIcon icon={faTrophy} /> Top tác giả theo doanh thu</h4>
                <ResponsiveContainer width="100%" height={Math.max(200, topAuthorsChart.length * 42)}>
                  <BarChart data={topAuthorsChart} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: 'var(--text)' }} />
                    <Tooltip content={<CustomTooltipXu />} />
                    <Bar dataKey="value" name="Tổng xu" radius={[0, 4, 4, 0]}>
                      {topAuthorsChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {revenue?.recentTransactions?.length > 0 && (
              <>
                <h4 className="admin-revenue-subtitle">Giao dịch doanh thu gần nhất</h4>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Tác giả</th>
                        <th>Chapter</th>
                        <th>Xu nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.recentTransactions.map((t, i) => (
                        <tr key={i}>
                          <td>{t.tx_date}</td>
                          <td>{t.author_name}</td>
                          <td>{t.chapter_ref}</td>
                          <td>{Number(t.amount).toLocaleString()} xu</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!revenue?.topAuthors?.length && !revenue?.recentTransactions?.length && (
              <p className="admin-loading">Chưa có dữ liệu doanh thu.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const data = await getAdminUsersApi(p);
      setUsers(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(0); }, []);

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    try {
      await setUserStatusApi(userId, newStatus);
      setActionMsg(`Đã cập nhật trạng thái → ${newStatus}`);
      load(page);
    } catch (e) { setActionMsg(e.message); }
  };

  const toggleAdminRole = async (userId, currentIsAdmin) => {
    const grant = !currentIsAdmin;
    const confirmMsg = grant
      ? 'Bạn có chắc muốn cấp quyền Admin cho người dùng này?'
      : 'Bạn có chắc muốn thu hồi quyền Admin của người dùng này?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await setAdminRoleApi(userId, grant);
      setActionMsg(grant ? 'Đã cấp quyền Admin thành công' : 'Đã thu hồi quyền Admin');
      load(page);
    } catch (e) { setActionMsg(e.message); }
  };

  return (
    <div className="admin-tab-content">
      {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}
      {loading ? <div className="empty-preview">Đang tải...</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Email</th><th>Tên</th><th>Truyện</th>
                  <th>Số dư xu</th><th>Ngày tạo</th><th>Trạng thái</th><th>Quyền</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.status === 'BANNED' ? 'admin-row--banned' : ''}>
                    <td>{u.id}</td>
                    <td className="admin-cell-email">{u.email}</td>
                    <td>{u.displayName}</td>
                    <td>{u.comicCount}</td>
                    <td>{Number(u.walletBalance).toLocaleString()}</td>
                    <td>{u.createdAt}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${u.status === 'ACTIVE' ? 'green' : 'red'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {u.isAdmin
                        ? <span className="admin-badge admin-badge--purple">Admin</span>
                        : <span className="admin-badge admin-badge--gray">User</span>}
                    </td>
                    <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`admin-btn admin-btn--sm ${u.status === 'ACTIVE' ? 'admin-btn--danger' : 'admin-btn--success'}`}
                        onClick={() => toggleStatus(u.id, u.status)}
                      >
                        {u.status === 'ACTIVE' ? 'Cấm' : 'Bỏ cấm'}
                      </button>
                      <button
                        type="button"
                        className={`admin-btn admin-btn--sm ${u.isAdmin ? 'admin-btn--warning' : 'admin-btn--primary'}`}
                        onClick={() => toggleAdminRole(u.id, u.isAdmin)}
                      >
                        {u.isAdmin ? 'Thu Admin' : 'Cấp Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={page === 0} onClick={() => load(page - 1)}>‹</button>
              <span>{page + 1} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ComicsTab() {
  const [comics, setComics] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const data = await getAdminComicsApi(p);
      setComics(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(0); }, []);

  const toggleStatus = async (comicId, currentStatus) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    try {
      await setComicStatusApi(comicId, newStatus);
      setActionMsg(`Đã cập nhật trạng thái → ${newStatus}`);
      load(page);
    } catch (e) { setActionMsg(e.message); }
  };

  const handleDelete = async (comicId, title) => {
    if (!window.confirm(`Xóa truyện "${title}"? Không thể hoàn tác!`)) return;
    try {
      await deleteAdminComicApi(comicId);
      setActionMsg('Đã xóa truyện');
      load(page);
    } catch (e) { setActionMsg(e.message); }
  };

  const toggleFeatured = async (comicId, currentFeatured) => {
    try {
      await setComicFeaturedApi(comicId, !currentFeatured);
      setActionMsg(currentFeatured ? 'Đã bỏ đề cử' : 'Đã đề cử truyện');
      load(page);
    } catch (e) { setActionMsg(e.message); }
  };

  return (
    <div className="admin-tab-content">
      {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}
      {loading ? <div className="empty-preview">Đang tải...</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Tên truyện</th><th>Tác giả</th>
                  <th>Chapter</th><th>Lượt đọc</th><th>Ngày đăng</th>
                  <th>Trạng thái</th><th>Đề cử</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {comics.map((c) => (
                  <tr key={c.id} className={c.status !== 'PUBLISHED' ? 'admin-row--hidden' : ''}>
                    <td>{c.id}</td>
                    <td>
                      <Link to={`/chi-tiet-truyen/${c.slug}`} className="admin-link">{c.title}</Link>
                    </td>
                    <td>{c.authorName}</td>
                    <td>{c.chapterCount}</td>
                    <td>{Number(c.totalViews).toLocaleString()}</td>
                    <td>{c.publishedAt}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${c.status === 'PUBLISHED' ? 'green' : 'gray'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-btn admin-btn--sm ${c.isFeatured ? 'admin-btn--featured' : 'admin-btn--ghost'}`}
                        title={c.isFeatured ? 'Bỏ đề cử' : 'Đề cử truyện này'}
                        onClick={() => toggleFeatured(c.id, c.isFeatured)}
                      >
                        {c.isFeatured ? <><FontAwesomeIcon icon={faStar} /> Đề cử</> : <><FontAwesomeIcon icon={faStarOutline} /> Đề cử</>}
                      </button>
                    </td>
                    <td className="admin-actions-cell">
                      <button
                        type="button"
                        className={`admin-btn admin-btn--sm ${c.status === 'PUBLISHED' ? 'admin-btn--warning' : 'admin-btn--success'}`}
                        onClick={() => toggleStatus(c.id, c.status)}
                      >
                        {c.status === 'PUBLISHED' ? 'Ẩn' : 'Hiện'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        onClick={() => handleDelete(c.id, c.title)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={page === 0} onClick={() => load(page - 1)}>‹</button>
              <span>{page + 1} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChaptersTab() {
  const [chapters, setChapters] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [filterSlug, setFilterSlug] = useState('');
  const [slugInput, setSlugInput] = useState('');

  const load = async (p = 0, slug = filterSlug) => {
    setLoading(true);
    try {
      const data = await getAdminChaptersApi(p, 20, slug);
      setChapters(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(0); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    setFilterSlug(slugInput);
    load(0, slugInput);
  };

  const clearFilter = () => {
    setSlugInput('');
    setFilterSlug('');
    load(0, '');
  };

  const handleDelete = async (chapterId, comicTitle, chapterNo) => {
    if (!window.confirm(`Xóa Chapter ${chapterNo} của "${comicTitle}"? Không thể hoàn tác!`)) return;
    try {
      await deleteAdminChapterApi(chapterId);
      setActionMsg('Đã xóa chapter');
      load(page, filterSlug);
    } catch (e) { setActionMsg(e.message); }
  };

  return (
    <div className="admin-tab-content">
      <form className="admin-filter-row" onSubmit={handleFilter}>
        <input
          type="text"
          placeholder="Lọc theo slug truyện..."
          value={slugInput}
          onChange={(e) => setSlugInput(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)', minWidth: 220 }}
        />
        <button type="submit" className="admin-btn admin-btn--sm">Lọc</button>
        {filterSlug && (
          <button type="button" className="admin-btn admin-btn--sm" onClick={clearFilter}>Xóa lọc</button>
        )}
      </form>
      {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}
      {loading ? <div className="empty-preview">Đang tải...</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Truyện</th><th>Chap</th><th>Tiêu đề</th>
                  <th>Giá (xu)</th><th>Lượt đọc</th><th>Ngày đăng</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((ch) => (
                  <tr key={ch.id}>
                    <td>{ch.id}</td>
                    <td>
                      <Link to={`/chi-tiet-truyen/${ch.comicSlug}`} className="admin-link">{ch.comicTitle}</Link>
                    </td>
                    <td>{ch.chapterNo}</td>
                    <td>{ch.title}</td>
                    <td>
                      {ch.price > 0
                        ? <span className="admin-badge admin-badge--orange"><FontAwesomeIcon icon={faLock} /> {Number(ch.price).toLocaleString()}</span>
                        : <span className="admin-badge admin-badge--green">Miễn phí</span>}
                    </td>
                    <td>{Number(ch.viewCount).toLocaleString()}</td>
                    <td>{ch.publishedAt}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        onClick={() => handleDelete(ch.id, ch.comicTitle, ch.chapterNo)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {chapters.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: '16px' }}>Không có chapter nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={page === 0} onClick={() => load(page - 1, filterSlug)}>‹</button>
              <span>{page + 1} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => load(page + 1, filterSlug)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ModerationTab() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [preview, setPreview] = useState(null);
  const [rechecking, setRechecking] = useState(false);

  useEffect(() => {
    getPendingChaptersAdminApi()
      .then((data) => setChapters(Array.isArray(data) ? data : []))
      .catch((e) => setActionMsg(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (chapterId) => {
    try {
      await approveChapterApi(chapterId);
      setChapters((prev) => prev.filter((c) => c.id !== chapterId));
      setPreview(null);
      setActionMsg('✅ Đã duyệt và xuất bản chương.');
    } catch (e) { setActionMsg(e.message); }
  };

  const handleReject = async (chapterId) => {
    const reason = window.prompt('Lý do từ chối (sẽ gửi thông báo cho tác giả):');
    if (reason === null) return;
    try {
      await rejectChapterApi(chapterId, reason || 'Vi phạm nội dung');
      setChapters((prev) => prev.filter((c) => c.id !== chapterId));
      setPreview(null);
      setActionMsg('❌ Đã từ chối và xóa chương.');
    } catch (e) { setActionMsg(e.message); }
  };

  const handlePreview = async (chapterId) => {
    try {
      const data = await getChapterContentAdminApi(chapterId);
      setPreview(data);
    } catch (e) { setActionMsg(e.message); }
  };

  const handleRecheck = async (chapterId) => {
    setRechecking(true);
    setActionMsg('⏳ AI đang kiểm tra lại nội dung...');
    try {
      const result = await recheckChapterApi(chapterId);
      if (result.status === 'PUBLISHED') {
        setChapters((prev) => prev.filter((c) => c.id !== chapterId));
        setPreview(null);
        setActionMsg('✅ AI đã duyệt — chapter được xuất bản.');
      } else if (result.status === 'AI_UNAVAILABLE') {
        setActionMsg('⚠️ AI chưa sẵn sàng, thử lại sau ít phút.');
      } else if (result.status === 'REJECTED') {
        setChapters((prev) => prev.filter((c) => c.id !== chapterId));
        setPreview(null);
        setActionMsg('❌ AI xác nhận vi phạm — chapter bị từ chối.');
      } else {
        setActionMsg('⏳ AI vẫn chưa chắc chắn — chapter tiếp tục chờ duyệt. Lý do: ' + (result.reason || ''));
        const fresh = await getChapterContentAdminApi(chapterId);
        setPreview(fresh);
      }
    } catch (e) { setActionMsg(e.message); }
    finally { setRechecking(false); }
  };

  return (
    <div className="admin-tab-content">
      <h3 style={{ marginBottom: 12 }}>Chương chờ xét duyệt ({chapters.length})</h3>
      {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}

      {/* Modal xem nội dung — so sánh 2 cột */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '96%', maxWidth: 1200, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setPreview(null)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>

            <h3 style={{ margin: '0 0 4px' }}>{preview.comic_title} — Chương {preview.chapter_no}: {preview.title}</h3>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: '#b45309', fontWeight: 600 }}>
              ⚠️ {preview.moderation_reason || 'AI nghi ngờ nội dung'}
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6b7280' }}>Tác giả: {preview.author_name}</p>

            <div style={{ display: 'grid', gridTemplateColumns: preview.matchedChapter ? '1fr 1fr' : '1fr', gap: 16 }}>
              {/* Cột trái: bản bị nghi ngờ */}
              <div>
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '8px 14px', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>
                  📄 Bản đang xét duyệt
                </div>
                {preview.pages && preview.pages.length > 0 ? (
                  <div style={{ maxHeight: 480, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafaf8' }}>
                    {preview.pages.map((url, i) => (
                      <img key={i} src={url} alt={`Trang ${i + 1}`} style={{ width: '100%', display: 'block', borderBottom: '2px solid #fde047' }} loading="lazy" />
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#fafaf8', borderRadius: 8, padding: '14px 18px', fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 480, overflowY: 'auto', border: '1px solid #e5e7eb' }}>
                    {preview.content || '(Không có nội dung)'}
                  </div>
                )}
              </div>

              {/* Cột phải: bản gốc bị trùng */}
              {preview.matchedChapter && (
                <div>
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 14px', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#dc2626' }}>
                    🔍 Truyện gốc bị trùng: {preview.matchedChapter.comic_title} — Chương {preview.matchedChapter.chapter_no}: {preview.matchedChapter.title}
                  </div>
                  {preview.matchedChapter.pages && preview.matchedChapter.pages.length > 0 ? (
                    <div style={{ maxHeight: 480, overflowY: 'auto', border: '1px solid #fca5a5', borderRadius: 8, background: '#fff5f5' }}>
                      {preview.matchedChapter.pages.map((url, i) => (
                        <img key={i} src={url} alt={`Trang ${i + 1}`} style={{ width: '100%', display: 'block', borderBottom: '2px solid #fca5a5' }} loading="lazy" />
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: '#fff5f5', borderRadius: 8, padding: '14px 18px', fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 480, overflowY: 'auto', border: '1px solid #fca5a5' }}>
                      {preview.matchedChapter.content || '(Không có nội dung)'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {actionMsg && (
              <div style={{ margin: '12px 0 0', padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 13, color: '#0369a1' }}>
                {actionMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="admin-btn" style={{ background: '#6366f1', color: '#fff', borderColor: '#6366f1', opacity: rechecking ? 0.7 : 1 }}
                onClick={() => handleRecheck(preview.id)} disabled={rechecking}>
                {rechecking ? '⏳ AI đang kiểm tra...' : '🤖 Kiểm tra lại AI'}
              </button>
              <button className="admin-btn" style={{ background: '#16a34a', color: '#fff', borderColor: '#16a34a' }}
                onClick={() => handleApprove(preview.id)}>
                <FontAwesomeIcon icon={faCircleCheck} /> Duyệt xuất bản
              </button>
              <button className="admin-btn admin-btn--danger"
                onClick={() => handleReject(preview.id)}>
                <FontAwesomeIcon icon={faCircleXmark} /> Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="empty-preview">Đang tải...</div> : chapters.length === 0 ? (
        <div className="empty-preview" style={{ color: '#16a34a' }}>✅ Không có chương nào cần xét duyệt.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Truyện</th><th>Chap</th><th>Tiêu đề</th>
                <th>Tác giả</th><th>Lý do AI nghi ngờ</th><th>Ngày đăng</th><th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((ch) => (
                <tr key={ch.id}>
                  <td>{ch.id}</td>
                  <td>{ch.comic_title}</td>
                  <td>{ch.chapter_no}</td>
                  <td>
                    <button className="admin-btn admin-btn--sm" style={{ background: '#392f68', color: '#fff', borderColor: '#392f68' }}
                      onClick={() => handlePreview(ch.id)}>
                      👁 Xem nội dung
                    </button>
                  </td>
                  <td>{ch.author_name}</td>
                  <td style={{ fontSize: 12, color: '#b45309', maxWidth: 220 }}>{ch.moderation_reason || '—'}</td>
                  <td>{ch.published_at?.slice(0, 16)}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="admin-btn admin-btn--sm" style={{ background: '#16a34a', color: '#fff', borderColor: '#16a34a' }}
                      onClick={() => handleApprove(ch.id)}>
                      <FontAwesomeIcon icon={faCircleCheck} /> Duyệt
                    </button>
                    <button className="admin-btn admin-btn--sm admin-btn--danger"
                      onClick={() => handleReject(ch.id)}>
                      <FontAwesomeIcon icon={faCircleXmark} /> Từ chối
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportsTab() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = async (p = 0, st = filterStatus) => {
    setLoading(true);
    try {
      const data = await getAdminReportsApi(p, 20, st);
      setReports(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(0, filterStatus); }, [filterStatus]);

  const resolve = async (reportId, newStatus) => {
    try {
      const report = reports.find((item) => item.id === reportId);
      const scope = report?.reportScope || 'CONTENT';
      // Use existing reviewerNote if present (entered in detail), otherwise send empty note.
      const note = report?.reviewerNote || '';
      await resolveReportApi(reportId, newStatus, scope, note);
      setActionMsg(`Đã đánh dấu ${newStatus}`);
      load(page, filterStatus);
    } catch (e) { setActionMsg(e.message); }
  };

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const openDetail = async (id, scope = 'CONTENT') => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const d = await getAdminReportDetailApi(id, scope);
      setDetailData(d);
    } catch (e) { setDetailData({ error: e.message }); }
    finally { setDetailLoading(false); }
  };

  const closeDetail = () => { setDetailOpen(false); setDetailData(null); };

  const deleteComment = async (commentId, reportId, reportScope) => {
    if (!window.confirm('Xóa bình luận bị báo cáo?')) return;
    try {
      await deleteAdminCommentApi(commentId);
      await resolveReportApi(reportId, 'RESOLVED', reportScope || 'COMMENT');
      setActionMsg('Đã xóa bình luận');
      load(page, filterStatus);
    } catch (e) { setActionMsg(e.message); }
  };


  return (
    <div className="admin-tab-content">
      <div className="admin-filter-row">
        {['PENDING', 'FLAGGED', 'RESOLVED', 'DISMISSED', ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className={`admin-btn admin-btn--sm ${filterStatus === s ? 'admin-btn--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s ? getStatusLabel(s) : 'Tất cả'}
          </button>
        ))}
      </div>
      {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}
      {loading ? <div className="empty-preview">Đang tải...</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Người báo cáo</th><th>Loại</th><th>Đích báo cáo</th>
                  <th>Preview</th><th>Lý do</th><th>Ngày</th><th>Trạng thái</th><th>Ghi chú</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className={(r.status === 'PENDING' || r.status === 'FLAGGED') ? 'admin-row--pending' : ''}>
                    <td>{r.id}</td>
                    <td>{r.reporterName || r.userId}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${r.targetType === 'COMIC' ? 'blue' : r.targetType === 'COMMENT' ? 'gray' : 'gray'}`}>
                        {r.targetType === 'COMIC' ? 'Truyện' : r.targetType === 'COMMENT' ? 'Bình luận' : r.targetType}
                      </span>
                    </td>
                    <td>
                      {r.targetType === 'COMIC' && r.targetSlug ? (
                        <a href={`/chi-tiet-truyen/${r.targetSlug}`} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 500 }}>
                          {r.targetTitle || `Truyện #${r.targetId}`}
                        </a>
                      ) : r.targetType === 'CHAPTER' && r.targetSlug ? (
                        <a href={`/chi-tiet-truyen/${r.targetSlug}`} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 500 }}>
                          {r.targetTitle || `Chapter #${r.targetId}`}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                          {r.targetType === 'COMMENT' ? `Bình luận #${r.targetId}` : `#${r.targetId}`}
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-sub)' }}>
                      {r.targetPreview || '—'}
                    </td>
                    <td className="admin-cell-reason">{r.reason}</td>
                    <td>{r.createdAt}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${
                        r.status === 'PENDING' ? 'orange' : r.status === 'FLAGGED' ? 'blue' : r.status === 'RESOLVED' ? 'green' : 'gray'
                      }`}>
                        {r.status === 'PENDING' ? 'Chờ xử lý' : r.status === 'FLAGGED' ? 'Tự động gắn cờ' : r.status === 'RESOLVED' ? 'Đã xử lý' : 'Bỏ qua'}
                      </span>
                    </td>
                    <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-sub)' }}>
                      {r.reviewerNote || '—'}
                    </td>
                    <td className="admin-actions-cell">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {r.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button type="button" className="admin-btn admin-btn--sm admin-btn--success"
                              onClick={() => resolve(r.id, 'RESOLVED')}>Xử lý</button>
                            <button type="button" className="admin-btn admin-btn--sm admin-btn--ghost"
                              onClick={() => resolve(r.id, 'DISMISSED')}>Bỏ qua</button>
                          </div>
                        )}
                        {r.targetType === 'COMMENT' && (
                          <button type="button" className="admin-btn admin-btn--sm admin-btn--danger"
                            onClick={() => deleteComment(r.targetId, r.id, r.reportScope)}>Xóa bình luận</button>
                        )}
                        <button type="button" className="admin-btn admin-btn--sm" onClick={() => navigate(`/admin/reports/${r.id}`)}>Chi tiết</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: 'center', color: '#888', padding: '16px' }}>Không có báo cáo nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={page === 0} onClick={() => load(page - 1, filterStatus)}>‹</button>
              <span>{page + 1} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => load(page + 1, filterStatus)}>›</button>
            </div>
          )}
          {detailOpen && (
            <div className="admin-modal-backdrop" onClick={closeDetail}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                  <h3>Chi tiết báo cáo #{detailData?.id || ''}</h3>
                  <button className="admin-btn admin-btn--sm" onClick={closeDetail}>Đóng</button>
                </div>
                <div className="admin-modal-body">
                  {detailLoading ? <div>Đang tải...</div> : (
                    detailData?.error ? <div style={{ color: 'red' }}>{detailData.error}</div> : (
                      <div>
                        <p><strong>Người gửi:</strong> {detailData.reporter_name || detailData.reporterId}</p>
                        <p><strong>Loại:</strong> {getTypeLabel(detailData.target_type || detailData.targetType)}</p>
                        <p><strong>Đích:</strong> {detailData.target_title || detailData.targetTitle || detailData.target_slug}</p>
                        <p><strong>Lý do:</strong> {detailData.reason}</p>
                        <p><strong>Trạng thái:</strong> {getStatusLabel(detailData.status)}</p>
                        <p><strong>Ghi chú:</strong> {detailData.reviewer_note || detailData.admin_note || '—'}</p>
                        <h4>Lịch sử xử lý</h4>
                        <div style={{ maxHeight: 220, overflow: 'auto', borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                          {(detailData.auditLogs || []).map((l, i) => (
                            <div key={i} style={{ padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
                              <div style={{ fontSize: 13 }}><strong>{l.action}</strong> — <span style={{ color: 'var(--text-sub)' }}>bởi {l.actor_user_id || l.actorUserId}</span></div>
                              <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{l.ts || l.created_at} {l.note ? `· ${l.note}` : ''}</div>
                            </div>
                          ))}
                          {!detailData.auditLogs?.length && <div style={{ color: 'var(--text-sub)' }}>Không có lịch sử</div>}
                        </div>
                        {((detailData.target_slug || detailData.targetSlug) || detailData.target_id) && (
                          <div style={{ marginTop: 10 }}>
                            <button type="button" className="admin-btn admin-btn--sm" onClick={() => {
                              try {
                                const slug = detailData.target_slug || detailData.targetSlug;
                                const chapterId = detailData.chapter_id || detailData.chapterId || detailData.target_id;
                                const commentId = detailData.target_id;
                                if ((detailData.target_type || detailData.targetType) === 'COMIC') {
                                  window.open(`/chi-tiet-truyen/${slug}`, '_blank');
                                } else if ((detailData.target_type || detailData.targetType) === 'CHAPTER') {
                                  window.open(`/chi-tiet-truyen/${slug}/${chapterId}`, '_blank');
                                } else if ((detailData.target_type || detailData.targetType) === 'COMMENT') {
                                  if (chapterId) window.open(`/chi-tiet-truyen/${slug}/${chapterId}#comment-${commentId}`, '_blank');
                                  else window.open(`/chi-tiet-truyen/${slug}#comment-${commentId}`, '_blank');
                                } else {
                                  window.open(`/chi-tiet-truyen/${slug}`, '_blank');
                                }
                              } catch (e) { window.open('/', '_blank'); }
                            }}>Mở nội dung gốc</button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AppealsTab() {
  const [appeals, setAppeals] = useState([]);
  const outlet = useOutletContext();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = async (p = 0, st = filterStatus) => {
    setLoading(true);
    try {
      const data = await getAdminAppealsApi(p, 20, st);
      setAppeals(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(0, filterStatus); }, [filterStatus]);

  const resolve = async (appealId, newStatus) => {
    try {
      const appeal = appeals.find((item) => item.id === appealId);
      console.log('[Admin][AppealsTab] resolve clicked', { appealId, newStatus, appeal });
      console.log('[Admin][AppealsTab] calling resolveAppealApi (no admin note)', { appealId, newStatus });
      const resp = await resolveAppealApi(appealId, newStatus, '');
      console.log('[Admin][AppealsTab] resolveAppealApi response', resp);
      setActionMsg(`Đã đánh dấu kháng nghị ${newStatus}`);
      await load(page, filterStatus);
    } catch (e) { setActionMsg(e.message); }
  };

  const [detailOpenA, setDetailOpenA] = useState(false);
  const [detailLoadingA, setDetailLoadingA] = useState(false);
  const [detailDataA, setDetailDataA] = useState(null);

  const openDetailA = async (id, scope = 'CONTENT') => {
    setDetailOpenA(true);
    setDetailLoadingA(true);
    try {
      const d = await getAdminReportDetailApi(id, scope);
      setDetailDataA(d);
    } catch (e) { setDetailDataA({ error: e.message }); }
    finally { setDetailLoadingA(false); }
  };
  const closeDetailA = () => { setDetailOpenA(false); setDetailDataA(null); };

  return (
    <div className="admin-tab-content">
      <div className="admin-filter-row">
        {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className={`admin-btn admin-btn--sm ${filterStatus === s ? 'admin-btn--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s || 'Tất cả'}
          </button>
        ))}
      </div>
      {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}
      {loading ? <div className="empty-preview">Đang tải...</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Người gửi</th><th>Kháng nghị cho</th><th>Loại</th>
                  <th>Nội dung</th><th>Ngày</th><th>Trạng thái</th><th>Ghi chú</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {appeals.map((a) => (
                  <tr key={a.id} className={a.status === 'PENDING' ? 'admin-row--pending' : ''}>
                    <td>{a.id}</td>
                    <td>{a.reporterName || a.reporterUserId}</td>
                    <td>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        #{a.reportId} · {a.reportScope}
                      </span>
                      <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{a.targetTitle || `#${a.targetId}`}</div>
                    </td>
                    <td>{a.targetType || '—'}</td>
                    <td style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-sub)' }}>
                      {a.message}
                    </td>
                    <td>{a.createdAt}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${a.status === 'PENDING' ? 'orange' : a.status === 'APPROVED' ? 'green' : 'gray'}`}>
                        {a.status === 'PENDING' ? 'Chờ xử lý' : a.status === 'APPROVED' ? 'Đã chấp nhận' : 'Từ chối'}
                      </span>
                    </td>
                    <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-sub)' }}>
                      {a.adminNote || '—'}
                    </td>
                    <td className="admin-actions-cell">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button type="button" className="admin-btn admin-btn--sm" onClick={() => { console.log('[Admin][AppealsTab] open detail clicked', { reportId: a.reportId }); navigate(`/admin/reports/${a.reportId}`); }}>Chi tiết</button>
                        {Array.isArray(a.allowedActions) && a.allowedActions.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {a.allowedActions.map((act) => (
                              <button
                                key={act}
                                type="button"
                                className={`admin-btn admin-btn--sm ${act === 'APPROVED' ? 'admin-btn--success' : act === 'REJECTED' ? 'admin-btn--ghost' : ''}`}
                                onClick={() => resolve(a.id, act)}
                              >
                                {act === 'APPROVED' ? 'Chấp nhận' : act === 'REJECTED' ? 'Từ chối' : act}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Đã xử lý</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {appeals.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: '16px' }}>Không có kháng nghị nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={page === 0} onClick={() => load(page - 1, filterStatus)}>‹</button>
              <span>{page + 1} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => load(page + 1, filterStatus)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TransactionsTab() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (p = 0, type = filterType) => {
    setLoading(true);
    try {
      const data = await getAdminTransactionsApi(p, 30, type);
      setRows(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(0); }, []);

  const TYPE_LABELS = {
    DEPOSIT: <><FontAwesomeIcon icon={faArrowUp} /> Nạp</>,
    WITHDRAW: <><FontAwesomeIcon icon={faArrowDown} /> Rút</>,
    TRANSFER: <><FontAwesomeIcon icon={faArrowsLeftRight} /> Chuyển</>,
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-filter-row">
        {['', 'DEPOSIT', 'WITHDRAW', 'TRANSFER'].map((t) => (
          <button key={t} type="button"
            className={`admin-filter-btn${filterType === t ? ' active' : ''}`}
            onClick={() => { setFilterType(t); load(0, t); }}>
            {t === '' ? 'Tất cả' : TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>
      {loading ? <div className="empty-preview">Đang tải...</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Người dùng</th><th>Loại</th>
                  <th>Số xu</th><th>Lý do</th><th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.user_name}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${r.type === 'DEPOSIT' ? 'green' : r.type === 'WITHDRAW' ? 'orange' : 'blue'}`}>
                        {TYPE_LABELS[r.type] || r.type}
                      </span>
                    </td>
                    <td className="revenue-cell-value">{Number(r.amount).toLocaleString()} xu</td>
                    <td>{r.reason}</td>
                    <td>{r.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={page === 0} onClick={() => load(page - 1)}>‹</button>
              <span>{page + 1} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CommentsTab() {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [filterSlug, setFilterSlug] = useState('');

  const load = async (p = 0, slug = filterSlug) => {
    setLoading(true);
    try {
      const data = await getAdminCommentsApi(p, 20, slug);
      setComments(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(0); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    setFilterSlug(slugInput);
    load(0, slugInput);
  };

  const clearFilter = () => {
    setSlugInput('');
    setFilterSlug('');
    load(0, '');
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Xóa bình luận này?')) return;
    try {
      await deleteAdminCommentApi(commentId);
      setActionMsg('Đã xóa bình luận');
      load(page, filterSlug);
    } catch (e) { setActionMsg(e.message); }
  };

  return (
    <div className="admin-tab-content">
      <form className="admin-filter-row" onSubmit={handleFilter}>
        <input
          type="text"
          placeholder="Lọc theo slug truyện..."
          value={slugInput}
          onChange={(e) => setSlugInput(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)', minWidth: 220 }}
        />
        <button type="submit" className="admin-btn admin-btn--sm">Lọc</button>
        {filterSlug && (
          <button type="button" className="admin-btn admin-btn--sm" onClick={clearFilter}>Xóa lọc</button>
        )}
      </form>
      {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}
      {loading ? <div className="empty-preview">Đang tải...</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Người dùng</th><th>Truyện</th><th>Chap</th>
                  <th>Nội dung</th><th>Thời gian</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.userName || c.userId}</td>
                    <td>
                      <Link to={`/chi-tiet-truyen/${c.comicSlug}`} className="admin-link">{c.comicTitle}</Link>
                    </td>
                    <td>{c.chapterNo}</td>
                    <td className="admin-cell-comment">{c.content}</td>
                    <td>{c.createdAt}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        onClick={() => handleDelete(c.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {comments.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '16px' }}>Không có bình luận nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={page === 0} onClick={() => load(page - 1, filterSlug)}>‹</button>
              <span>{page + 1} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => load(page + 1, filterSlug)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WithdrawalsTab() {
  const [rows, setRows] = useState([]);
  const outlet = useOutletContext();
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = async (p = 0, status = filterStatus) => {
    setLoading(true);
    try {
      const data = await getAdminWithdrawalRequestsApi(p, 20, status);
      setRows(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(0); }, []);

  const [rejectNote, setRejectNote] = useState({});

  const handleProcess = async (requestId, newStatus, note = '') => {
    try {
      await processWithdrawalApi(requestId, newStatus, note);
      setActionMsg(newStatus === 'APPROVED' ? 'Đã duyệt thành công' : 'Đã từ chối, tiền đã hoàn lại cho tác giả');
      setRejectNote(prev => { const n = { ...prev }; delete n[requestId]; return n; });
      load(page, filterStatus);
    } catch (e) { setActionMsg(e.message || 'Có lỗi xảy ra'); }
  };

  const STATUS_LABELS = {
    PENDING: <><FontAwesomeIcon icon={faHourglass} /> Chờ duyệt</>,
    APPROVED: <><FontAwesomeIcon icon={faCircleCheck} /> Đã duyệt</>,
    REJECTED: <><FontAwesomeIcon icon={faCircleXmark} /> Từ chối</>,
  };
  const STATUS_BADGE = { PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' };

  return (
    <div className="admin-tab-content">
      {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}
      <div className="admin-filter-row">
        {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
          <button key={s} type="button"
            className={`admin-filter-btn${filterStatus === s ? ' active' : ''}`}
            onClick={() => { setFilterStatus(s); load(0, s); }}>
            {s === '' ? 'Tất cả' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {loading ? <div className="empty-preview">Đang tải...</div> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Tác giả</th><th>Số xu</th>
                  <th>Thông tin NH</th><th>Ghi chú</th>
                  <th>Ngày gửi</th><th>Trạng thái</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.user_name}</td>
                    <td className="revenue-cell-value">{Number(r.amount).toLocaleString()} xu</td>
                    <td className="withdraw-bank-cell">{r.bank_info}</td>
                    <td>{r.note || '—'}</td>
                    <td>{r.created_at}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${STATUS_BADGE[r.status] || 'gray'}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="admin-actions-cell">
                      {r.status === 'PENDING' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                          <input
                            type="text"
                            placeholder="Ghi chú (tuỳ chọn)..."
                            value={rejectNote[r.id] || ''}
                            onChange={e => setRejectNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                            style={{ fontSize: 12, padding: '3px 7px', border: '1px solid #ddd', borderRadius: 4, width: '100%' }}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" className="admin-btn admin-btn--sm admin-btn--success"
                              onClick={() => handleProcess(r.id, 'APPROVED', rejectNote[r.id] || '')}>Duyệt</button>
                            <button type="button" className="admin-btn admin-btn--sm admin-btn--danger"
                              onClick={() => handleProcess(r.id, 'REJECTED', rejectNote[r.id] || '')}>Từ chối</button>
                          </div>
                        </div>
                      )}
                      {r.status !== 'PENDING' && (
                        <span className="admin-processed-note">{r.admin_note || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={page === 0} onClick={() => load(page - 1, filterStatus)}>‹</button>
              <span>{page + 1} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages - 1} onClick={() => load(page + 1, filterStatus)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// export tab components so router can reference them
export { DashboardTab, UsersTab, ComicsTab, ChaptersTab, ModerationTab, CommentsTab, ReportsTab, AppealsTab, TransactionsTab, WithdrawalsTab };

export default function AdminPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteInitial, setNoteInitial] = useState('');
  const [notePromiseResolve, setNotePromiseResolve] = useState(() => null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    meApi()
      .then((data) => {
        if (!data?.authenticated) { navigate('/login'); return; }
        getAdminStatsApi()
          .then((s) => { setStats(s); setIsAdmin(true); setAuthChecked(true); })
          .catch(() => { setIsAdmin(false); setAuthChecked(true); });
      })
      .catch(() => { navigate('/login'); });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const load = () => getPendingChaptersAdminApi()
      .then((data) => setPendingCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
    load();
    const interval = setInterval(load, 60000); // refresh mỗi 1 phút
    return () => clearInterval(interval);
  }, [isAdmin]);

  const openAdminNote = (initial = '') => {
    return new Promise((resolve) => {
      setNoteInitial(initial || '');
      setNoteModalOpen(true);
      setNotePromiseResolve(() => resolve);
    });
  };

  const handleNoteSubmit = (val) => {
    try { notePromiseResolve?.(val ?? ''); } catch (e) {}
    setNoteModalOpen(false);
    setNoteInitial('');
    setNotePromiseResolve(() => null);
  };

  const handleNoteClose = () => {
    try { notePromiseResolve?.(''); } catch (e) {}
    setNoteModalOpen(false);
    setNoteInitial('');
    setNotePromiseResolve(() => null);
  };

  if (!authChecked) return <div className="page"><Header /><div className="container"><div className="empty-preview">Đang kiểm tra quyền...</div></div></div>;

  if (!isAdmin) return (
    <div className="page">
      <Header />
      <div className="container">
        <main style={{ padding: '40px 0', textAlign: 'center' }}>
          <h2>Bạn không có quyền truy cập trang này</h2>
          <Link to="/" className="chitiet-btn chitiet-btn--primary">Về trang chủ</Link>
        </main>
        <AdminNoteModal
          isOpen={noteModalOpen}
          initialValue={noteInitial}
          onClose={handleNoteClose}
          onSubmit={handleNoteSubmit}
        />
        <Footer />
      </div>
    </div>
  );

  return (
    <div className="page admin-page">
      <Header />
      <div className="container">

        <main className="admin-main">
          <div className="breadcrumb breadcrumb--small">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            <span>Quản trị</span>
          </div>

          <h1 className="admin-title"><FontAwesomeIcon icon={faShield} /> Trang Quản Trị</h1>

          <div className="admin-layout">
            <nav className="admin-sidebar">
              {TABS.map((t) => (
                <NavLink
                  key={t.key}
                  to={`/admin${t.key === 'dashboard' ? '' : `/${t.key}`}`}
                  className={({ isActive }) => `admin-nav-btn ${isActive ? 'active' : ''}`}
                >
                  <FontAwesomeIcon icon={t.icon} /> {t.label}
                  {t.key === 'moderation' && pendingCount > 0 && (
                    <span style={{
                      marginLeft: 6, background: '#dc2626', color: '#fff',
                      borderRadius: 10, padding: '1px 7px', fontSize: 11,
                      fontWeight: 700, lineHeight: 1.6
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="admin-content">
              <Outlet context={{ stats, openAdminNote }} />
            </div>
          </div>
        </main>

        <Footer />
        <AdminNoteModal
          isOpen={noteModalOpen}
          initialValue={noteInitial}
          onClose={handleNoteClose}
          onSubmit={handleNoteSubmit}
        />
      </div>
    </div>
  );
}
