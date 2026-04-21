import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Play, RefreshCw, Users, ChevronDown, CheckCircle } from "lucide-react";
import { doctorApi } from "../../../services/doctorApi";
import "./QueuePage.css";

function stripHtml(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Đã xảy ra lỗi.";
}

const WAITING_STATUSES = new Set(["waiting", "in_progress"]);

export default function QueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDone, setShowDone] = useState(false);
  const navigate = useNavigate();

  const activeQueue = queue.filter((item) => WAITING_STATUSES.has(item.status));
  const doneQueue = queue.filter((item) => !WAITING_STATUSES.has(item.status));

  const location = useLocation();

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await doctorApi.getQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load queue:", error);
      setError(stripHtml(error.message) || "Không tải được hàng đợi.");
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, [location.key, loadQueue]);

  function handleStartVisit(code) {
    navigate(`/app/doctor/visit/${code}`);
  }

  return (
    <div className="queue-page">
      <div className="page-header">
        <h1>Hàng đợi khám</h1>
        <button className="refresh-btn" onClick={loadQueue}>Làm mới</button>
      </div>

      <div className="queue-content">
        {loading ? (
          <div className="loading">
            <RefreshCw size={20} className="queue-loading-icon" />
            Đang tải hàng đợi...
          </div>
        ) : error ? (
          <div className="queue-error-state">
            <div className="queue-empty-icon"><Users size={40} /></div>
            <p className="queue-empty-title">Không tải được hàng đợi</p>
            <p className="queue-empty-hint">{error}</p>
            <button className="refresh-btn" onClick={loadQueue}>Thử lại</button>
          </div>
        ) : (
          <div className="queue-content-body">
            {activeQueue.length === 0 && doneQueue.length === 0 ? (
              <div className="queue-empty-state">
                <div className="queue-empty-icon"><Users size={40} /></div>
                <p className="queue-empty-title">Chưa có bệnh nhân trong hàng đợi</p>
                <p className="queue-empty-hint">
                  Hàng đợi sẽ tự động cập nhật khi lễ tân check-in bệnh nhân.<br />
                  Bạn cũng có thể xem <button type="button" className="queue-empty-link" onClick={() => navigate("/app/doctor/schedule")}>lịch làm việc</button> để biết lịch hẹn hôm nay.
                </p>
                <button className="refresh-btn" onClick={loadQueue}>
                  <RefreshCw size={13} /> Làm mới
                </button>
              </div>
            ) : (
              <>
                <div className="queue-list">
                  {activeQueue.map((item, index) => (
                    <div key={item.code} className="queue-item">
                      <div className="queue-number">{index + 1}</div>
                      <div className="queue-info">
                        <div className="patient-name">{item.patientName}</div>
                        <div className="appointment-time">
                          <Clock size={14} /> {item.slot}
                        </div>
                      </div>
                      <button className="start-btn" onClick={() => handleStartVisit(item.code)}>
                        <Play size={16} /> Khám
                      </button>
                    </div>
                  ))}
                </div>

                {doneQueue.length > 0 && (
                  <div className="done-queue-section">
                    <button
                      type="button"
                      className="done-queue-toggle"
                      onClick={() => setShowDone((v) => !v)}
                    >
                      <CheckCircle size={16} />
                      <span>Đã khám ({doneQueue.length})</span>
                      <ChevronDown
                        size={16}
                        className={`done-toggle-icon${showDone ? " rotated" : ""}`}
                      />
                    </button>
                    {showDone && (
                      <div className="queue-list done-list">
                        {doneQueue.map((item) => (
                          <div key={item.code} className="queue-item done-item">
                            <div className="queue-number done-number">
                              <CheckCircle size={18} />
                            </div>
                            <div className="queue-info">
                              <div className="patient-name">{item.patientName}</div>
                              <div className="appointment-time">
                                <Clock size={14} /> {item.slot}
                              </div>
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
        )}
      </div>
    </div>
  );
}
