import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, FileText, RefreshCw } from "lucide-react";
import { doctorApi } from "../../../services/doctorApi";
import "./VisitsPage.css";

export default function VisitsPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let mounted = true;

    async function loadVisits() {
      setLoading(true);
      try {
        const data = await doctorApi.getVisits(filter);
        if (mounted) {
          setVisits(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load visits:", error);
        if (mounted) {
          setVisits([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadVisits();
    return () => {
      mounted = false;
    };
  }, [filter]);

  return (
    <div className="visits-page">
      <div className="page-header">
        <h1>Lịch sử khám</h1>
        <div className="filter-tabs">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Tất cả</button>
          <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Hoàn thành</button>
          <button className={filter === "draft" ? "active" : ""} onClick={() => setFilter("draft")}>Nháp</button>
        </div>
      </div>

      <div className="visits-content">
        {loading ? (
          <div className="visits-loading">
            <RefreshCw size={18} className="visits-spin" /> Đang tải lịch sử khám...
          </div>
        ) : visits.length === 0 ? (
          <div className="visits-empty-state">
            <div className="visits-empty-icon"><FileText size={36} /></div>
            <p className="visits-empty-title">
              {filter === "all"
                ? "Chưa có phiếu khám nào"
                : filter === "completed"
                ? "Chưa có phiếu khám hoàn thành"
                : "Chưa có phiếu khám nháp"}
            </p>
            <p className="visits-empty-hint">
              {filter === "all"
                ? "Phiếu khám sẽ xuất hiện sau khi bạn hoàn tất khám bệnh nhân từ Lịch làm việc."
                : "Thử chọn tab khác để xem các phiếu khám khác."}
            </p>
          </div>
        ) : (
          <div className="visits-list">
            {visits.map((visit) => (
              <div key={visit.id} className="visit-item">
                <div className="visit-icon">
                  {visit.status === "completed" ? <CheckCircle size={20} /> : <Clock size={20} />}
                </div>
                <div className="visit-info">
                  <div className="patient-name">{visit.patientName}</div>
                  <div className="visit-date">{visit.date}</div>
                  <div className="visit-diagnosis">{visit.diagnosis || "Chưa có chẩn đoán"}</div>
                </div>
                <Link to={`/app/doctor/visit/${visit.code}`} className="view-btn">Xem</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
