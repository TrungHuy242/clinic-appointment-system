import React, { useState, useEffect } from "react";
import { BellOff, CheckCheck, Trash2 } from "lucide-react";
import { appointmentApi } from "../../services/patientApi";
import "./NotificationsPage.css";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await appointmentApi.getNotifications();
    setNotifications(data.map((notification) => ({ ...notification, read: false })));
    setLoading(false);
  };

  const handleMarkAsRead = (id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredNotifications = filter === "unread" ? notifications.filter((item) => !item.read) : notifications;
  const unreadCount = notifications.filter((item) => !item.read).length;

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
              Quản lý thông báo về lịch hẹn, kết quả khám và cập nhật từ phòng khám.
            </p>
          </div>
          <span className="ehealth-branch-badge">Cơ sở Hải Châu</span>
        </div>
      </div>

      <main className="ehealth-main">
        <div className="ehealth-container">
          <div className="notifications-header">
            <div>
              <h2 className="notifications-count">Bạn có {unreadCount} thông báo chưa đọc</h2>
            </div>
            {unreadCount > 0 && (
              <button className="btn-secondary btn-small" onClick={handleMarkAllAsRead}>
                Đánh dấu tất cả là đã đọc
              </button>
            )}
          </div>

          <div className="notification-filters">
            <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              Tất cả ({notifications.length})
            </button>
            <button className={`filter-btn ${filter === "unread" ? "active" : ""}`} onClick={() => setFilter("unread")}>
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="notifications-empty">
              <div className="empty-icon">
                <BellOff size={34} />
              </div>
              <h3 className="empty-title">{filter === "unread" ? "Không có thông báo chưa đọc" : "Không có thông báo"}</h3>
              <p className="empty-desc">
                {filter === "unread"
                  ? "Bạn đã đọc tất cả thông báo."
                  : "Bạn sẽ nhận được thông báo về lịch hẹn và cập nhật từ phòng khám."}
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => (
                <div key={notification.id} className={`notification-card ${notification.read ? "" : "unread"}`}>
                  <div className="notification-left">
                    {!notification.read && <span className="notification-badge">Mới</span>}
                  </div>

                  <div className="notification-content">
                    <h3 className="notification-title">{notification.message}</h3>
                    <p className="notification-date">{formatDate(notification.date)}</p>
                  </div>

                  <div className="notification-actions">
                    {!notification.read && (
                      <button className="notification-btn" onClick={() => handleMarkAsRead(notification.id)} title="Đánh dấu là đã đọc">
                        <CheckCheck size={18} />
                      </button>
                    )}
                    <button className="notification-btn delete" onClick={() => handleDelete(notification.id)} title="Xóa">
                      <Trash2 size={18} />
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
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Hôm qua";
  }
  return date.toLocaleDateString("vi-VN");
}