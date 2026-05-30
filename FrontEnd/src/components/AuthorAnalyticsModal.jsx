import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faChartBar, faTriangleExclamation, faUsers,
  faCommentDots, faStar, faBook, faUser, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { getComicStatsApi, getReportedCommentsApi, dismissReportApi } from '../services/authorAnalyticsApi';

export default function AuthorAnalyticsModal({ comicId, onClose }) {
  const [stats, setStats] = useState(null);
  const [reportedComments, setReportedComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stats'); // 'stats' or 'reports'
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [comicId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, reportsData] = await Promise.all([
        getComicStatsApi(comicId),
        getReportedCommentsApi(comicId),
      ]);
      setStats(statsData);
      setReportedComments(reportsData || []);
    } catch (error) {
      setMessage('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await dismissReportApi(reportId);
      setReportedComments(reportedComments.filter(r => r.reportId !== reportId));
      setMessage('Đã hủy báo cáo');
    } catch (error) {
      setMessage('Lỗi: ' + error.message);
    }
  };

  return (
    <div className="analytics-modal-backdrop" onClick={onClose}>
      <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="analytics-modal-head">
          <h2>Thống kê truyện</h2>
          <button className="close-btn" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <div className="analytics-tabs">
          <button
            className={tab === 'stats' ? 'active' : ''}
            onClick={() => setTab('stats')}
          >
            <FontAwesomeIcon icon={faChartBar} /> Thống kê
          </button>
          <button
            className={tab === 'reports' ? 'active' : ''}
            onClick={() => setTab('reports')}
          >
            <FontAwesomeIcon icon={faTriangleExclamation} /> Báo cáo ({reportedComments.length})
          </button>
        </div>

        {message && (
          <div className="analytics-message">{message}</div>
        )}

        {loading ? (
          <div className="analytics-loading">Đang tải...</div>
        ) : (
          <>
            {tab === 'stats' && stats && (
              <div className="analytics-content">
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-label"><FontAwesomeIcon icon={faUsers} /> Theo dõi</div>
                    <div className="stat-value">{stats.totalFollows.toLocaleString()}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label"><FontAwesomeIcon icon={faCommentDots} /> Bình luận</div>
                    <div className="stat-value">{stats.totalComments.toLocaleString()}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label"><FontAwesomeIcon icon={faStar} /> Đánh giá</div>
                    <div className="stat-value">{stats.totalRatings.toLocaleString()}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label"><FontAwesomeIcon icon={faStar} /> Điểm trung bình</div>
                    <div className="stat-value">{stats.averageRating.toFixed(1)}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label"><FontAwesomeIcon icon={faBook} /> Chương</div>
                    <div className="stat-value">{stats.totalChapters}</div>
                  </div>
                </div>

                <div className="chapters-stats">
                  <h3>Thống kê từng chương</h3>
                  <div className="chapters-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Chương</th>
                          <th>Tiêu đề</th>
                          <th>Bình luận</th>
                          <th>Trả lời</th>
                          <th>Báo cáo</th>
                          <th>Ngày đăng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.chapterStats.map((ch) => (
                          <tr key={ch.chapterId}>
                            <td>#{ch.chapterNo}</td>
                            <td>{ch.title}</td>
                            <td>{ch.totalComments}</td>
                            <td>{ch.totalReplies}</td>
                            <td className="text-warning">{ch.reportsReceived}</td>
                            <td className="date">{ch.publishedAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'reports' && (
              <div className="analytics-content">
                {reportedComments.length === 0 ? (
                  <div className="no-reports"><FontAwesomeIcon icon={faCircleCheck} /> Không có báo cáo nào</div>
                ) : (
                  <div className="reports-list">
                    {reportedComments.map((report) => (
                      <div key={report.reportId} className="report-item">
                        <div className="report-header">
                          <span className="report-user"><FontAwesomeIcon icon={faUser} /> {report.reportedByUser}</span>
                          <span className="report-date">{report.createdAt}</span>
                          <button
                            className="dismiss-btn"
                            onClick={() => handleDismissReport(report.reportId)}
                          >
                            Hủy
                          </button>
                        </div>
                        <div className="report-reason">
                          <strong>Lý do:</strong> {report.reportReason}
                        </div>
                        <div className="report-comment">
                          <strong>Bình luận:</strong> {report.commentContent}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
