import React, { useState, useEffect } from "react";
import { appointmentApi } from "../../services/patientApi";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await appointmentApi.getNotifications();
    setNotifications(
      data.map((n) => ({
        ...n,
        read: false, // mock: all unread initially
      }))
    );
    setLoading(false);
  };

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="ehealth-page">
        <div className="ehealth-loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="ehealth-page">
      <div className="ehealth-header">
        <div className="ehealth-header-top">
          <div>
            <h1 className="ehealth-title">Thông báo</h1>
            <p className="ehealth-subtitle">
              Quản lý thông báo về lịch hẹn, kết quả khám và cập nhật từ phòng
              khám.
            </p>
          </div>
          <span className="ehealth-branch-badge">MediCare Hải Châu</span>
        </div>
      </div>

      <main className="ehealth-main">
        <div className="ehealth-container">
          {/* Notifications Header */}
          <div className="notifications-header">
            <div>
              <h2 className="notifications-count">
                Bạn có {unreadCount} thông báo chưa đọc
              </h2>
            </div>
            {unreadCount > 0 && (
              <button
                className="btn-secondary btn-small"
                onClick={handleMarkAllAsRead}
              >
                Đánh dấu tất cả là đã đọc
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="notification-filters">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              className={`filter-btn ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="notifications-empty">
              <div className="empty-icon">
                <span className="material-symbols-rounded">
                  notifications_none
                </span>
              </div>
              <h3 className="empty-title">
                {filter === "unread"
                  ? "Không có thông báo chưa đọc"
                  : "Không có thông báo"}
              </h3>
              <p className="empty-desc">
                {filter === "unread"
                  ? "Bạn đã đọc tất cả thông báo."
                  : "Bạn sẽ nhận được thông báo về lịch hẹn và cập nhật từ phòng khám."}
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-card ${n.read ? "" : "unread"}`}
                >
                  <div className="notification-left">
                    {!n.read && (
                      <span className="notification-badge">Mới</span>
                    )}
                  </div>

                  <div className="notification-content">
                    <h3 className="notification-title">{n.message}</h3>
                    <p className="notification-date">{formatDate(n.date)}</p>
                  </div>

                  <div className="notification-actions">
                    {!n.read && (
                      <button
                        className="notification-btn"
                        onClick={() => handleMarkAsRead(n.id)}
                        title="Đánh dấu là đã đọc"
                      >
                        <span className="material-symbols-rounded">
                          done_outline
                        </span>
                      </button>
                    )}
                    <button
                      className="notification-btn delete"
                      onClick={() => handleDelete(n.id)}
                      title="Xóa"
                    >
                      <span className="material-symbols-rounded">
                        delete_outline
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hôm nay";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Hôm qua";
  } else {
    return date.toLocaleDateString("vi-VN");
  }
}
