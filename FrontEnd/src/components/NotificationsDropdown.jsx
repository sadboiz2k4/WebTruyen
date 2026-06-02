import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faBook, faCommentDots, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { faStar, faHeart } from '@fortawesome/free-regular-svg-icons';
import { getNotificationsApi, getUnreadCountApi, markNotificationAsReadApi, markAllNotificationsAsReadApi } from '../services/notificationApi';

const TYPE_ICONS = {
  NEW_COMIC: faStar,
  NEW_CHAPTER: faBook,
  FOLLOW_COMIC: faHeart,
  COMMENT_REPLY: faCommentDots,
  COMMENT_ON_CHAPTER: faCommentDots,
  REPORT: faExclamationTriangle,
  APPEAL_APPROVED: faExclamationTriangle,
  CONTENT_DELETED: faExclamationTriangle,
};

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getUnreadCountApi()
      .then((data) => setUnreadCount(data?.unreadCount ?? data ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotificationsApi(20);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsReadApi(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (error) {}
    }
    if (notif.type === 'REPORT') {
      setIsOpen(false);
      navigate(`/appeal/${notif.relatedId}`, { state: { notifTitle: notif.title, notifMessage: notif.message, notifCreatedAt: notif.createdAt } });
    } else if (notif.relatedUrl) {
      setIsOpen(false);
      navigate(notif.relatedUrl);
    } else {
      // Không có URL → toggle expand để đọc full message
      setExpandedId((prev) => (prev === notif.id ? null : notif.id));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <div className="notifications-menu">
      <button
        className="notifications-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo"
        style={{ color: '#ffd700' }}
      >
        <FontAwesomeIcon icon={faBell} style={{ color: '#ffd700' }} />
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                Đánh dấu hết
              </button>
            )}
          </div>

          {loading ? (
            <div className="notifications-loading">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">Không có thông báo</div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.isRead ? 'read' : 'unread'} clickable`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon">
                    <FontAwesomeIcon icon={TYPE_ICONS[notif.type] || faBell} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div
                      className="notification-message"
                      style={expandedId === notif.id ? { WebkitLineClamp: 'unset', overflow: 'visible', display: 'block' } : {}}
                    >
                      {notif.message && notif.message.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                    {!notif.relatedUrl && notif.type !== 'REPORT' && (
                      <div style={{ fontSize: 11, color: '#1976d2', marginTop: 2 }}>
                        {expandedId === notif.id ? '▲ Thu gọn' : '▼ Xem thêm'}
                      </div>
                    )}
                    <div className="notification-time">{notif.createdAt}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {!notif.isRead && <div className="notification-unread-dot"></div>}
                    {notif.type === 'REPORT' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); navigate(`/appeal/${notif.relatedId}`, { state: { notifTitle: notif.title, notifMessage: notif.message, notifCreatedAt: notif.createdAt } }); }}
                        style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer' }}
                      >
                        Gửi kháng nghị
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
