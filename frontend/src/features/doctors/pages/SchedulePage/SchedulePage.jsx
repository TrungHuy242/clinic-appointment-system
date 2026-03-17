import React, { useState, useEffect } from "react";
import { Calendar, Clock, User } from "lucide-react";
import { useAuth } from "../../../../shared/services/AuthContext";
import { doctorApi } from "../../services/doctorApi";
import "./SchedulePage.css";

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  async function loadSchedule() {
    setLoading(true);
    try {
      const data = await doctorApi.getSchedule(selectedDate);
      // Backend returns { items: [...], doctorName, specialtyName, date }
      setSchedule(data?.items || []);
    } catch (error) {
      console.error("Failed to load schedule:", error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h1>Lịch làm việc</h1>
        <div className="date-picker">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      <div className="schedule-content">
        {loading ? (
          <div className="loading">Đang tải lịch...</div>
        ) : schedule.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <p>Không có lịch hẹn nào trong ngày này</p>
          </div>
        ) : (
          <div className="schedule-list">
            {schedule.map((slot) => (
              <div key={slot.code} className={`schedule-item ${slot.status}`}>
                <div className="slot-time">
                  <Clock size={16} />
                  {slot.time}
                </div>
                <div className="slot-patient">
                  <User size={16} />
                  {slot.patientName}
                </div>
                <div className="slot-status">
                  {slot.status === 'waiting' ? 'Chờ khám' : 
                   slot.status === 'in_progress' ? 'Đang khám' :
                   slot.status === 'completed' ? 'Hoàn thành' : slot.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
