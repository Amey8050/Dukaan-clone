import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import './Notifications.css';

const Notifications = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        offset: 0
      };
      
      if (filter === 'unread') {
        params.unread_only = true;
      }

      const result = await notificationService.getNotifications(params);
      if (result.success) {
        setNotifications(result.data.notifications || []);
        setUnreadCount(result.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    return '';
  };

  if (!isAuthenticated) {
    return (
      <div className="notifications-container">
        <div className="error-message">Please login to view notifications</div>
      </div>
    );
  }

  const filteredNotifications = filter === 'read'
    ? notifications.filter(n => n.is_read)
    : filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button className="mark-all-read-button" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>

      <div className="notifications-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={filter === 'unread' ? 'active' : ''}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={filter === 'read' ? 'active' : ''}
          onClick={() => setFilter('read')}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="notifications-empty">
          <h2>No notifications</h2>
          <p>
            {filter === 'unread'
              ? "You're all caught up! No unread notifications."
              : filter === 'read'
              ? 'No read notifications yet.'
              : "You don't have any notifications yet."}
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-card-header">
                <div className="notification-icon-large">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-card-content">
                  <h3 className="notification-card-title">{notification.title}</h3>
                  <p className="notification-card-message">{notification.message}</p>
                  <div className="notification-card-meta">
                    <span className="notification-time">{formatDate(notification.created_at)}</span>
                    {notification.store_id && (
                      <span className="notification-store">Store ID: {notification.store_id.substring(0, 8)}</span>
                    )}
                  </div>
                </div>
                <div className="notification-card-actions">
                  {!notification.is_read && (
                    <button
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as read"
                    >
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(notification.id)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
              {notification.link && (
                <button
                  className="notification-link-button"
                  onClick={() => handleNotificationClick(notification)}
                >
                  View Details →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

