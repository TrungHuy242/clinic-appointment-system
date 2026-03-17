import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Clock, Play } from "lucide-react";
import { doctorApi } from "../../../services/doctorApi";
import "./QueuePage.css";

export default function QueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const data = await doctorApi.getQueue();
      // Backend returns array directly
      setQueue(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load queue:", error);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }

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
          <div className="loading">Đang tải...</div>
        ) : queue.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>Không có bệnh nhân trong hàng đợi</p>
          </div>
        ) : (
          <div className="queue-list">
            {queue.map((item, index) => (
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
        )}
      </div>
    </div>
  );
}

