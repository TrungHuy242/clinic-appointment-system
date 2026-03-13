import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  Download,
  FileText,
  Pill,
  ShieldCheck,
  Stethoscope,
  TimerReset,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { appointmentApi } from "../../../patients/services/patientApi";
import styles from "./EHealthRecordDetailPage.module.css";
import "./EHealthRecordDetailPage.css";

const TIMELINE_ICONS = {
  schedule: TimerReset,
  check_circle: ShieldCheck,
  where_to_vote: ClipboardCheck,
  assignment_turned_in: CalendarDays,
};

function TimelineIcon({ name }) {
  const Icon = TIMELINE_ICONS[name] || CalendarDays;
  return <Icon size={16} />;
}

export default function EHealthRecordDetailPage() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("diagnosis");

  const loadRecord = useCallback(async () => {
    setLoading(true);
    const data = await appointmentApi.getRecordDetail(id || "REC-001");
    setRecord(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  if (loading) {
    return (
      <div className={`medical-record-page-shell ${styles["ehealth-page"]}`}>
        <div className={styles["ehealth-loading"]}>Đang tải...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className={`medical-record-page-shell ${styles["ehealth-page"]}`}>
        <div className={styles["ehealth-error"]}>Không tìm thấy bản ghi</div>
      </div>
    );
  }

  return (
    <div className={`medical-record-page-shell ${styles["ehealth-page"]}`}>
      <div className={styles["ehealth-header"]}>
        <div className={styles["ehealth-header-top"]}>
          <div>
            <h1 className={`${styles["ehealth-title"]} text-ellipsis`}>Sổ khám điện tử</h1>
            <p className={styles["ehealth-subtitle"]}>
              Theo dõi lịch hẹn, kết quả khám và đơn thuốc tại Cơ sở Hải Châu.
            </p>
          </div>
          <span className={styles["ehealth-branch-badge"]}>Cơ sở Hải Châu</span>
        </div>

        <div className={styles["ehealth-tabs"]}>
          <button className={`${styles["ehealth-tab"]} ${activeTab === "diagnosis" ? styles.active : ""}`} onClick={() => setActiveTab("diagnosis")}>
            <CalendarDays size={16} />
            Lịch hẹn và tiến trình
          </button>
          <button className={`${styles["ehealth-tab"]} ${activeTab === "detail" ? styles.active : ""}`} onClick={() => setActiveTab("detail")}>
            <FileText size={16} />
            Hồ sơ khám bệnh
          </button>
          <button className={`${styles["ehealth-tab"]} ${activeTab === "medicines" ? styles.active : ""}`} onClick={() => setActiveTab("medicines")}>
            <Pill size={16} />
            Đơn thuốc và dặn dò
          </button>
        </div>
      </div>

      <main className={styles["ehealth-main"]}>
        <div className={styles["ehealth-container"]}>
          <div className={styles["ehealth-grid"]}>
            <aside className={styles["ehealth-sidebar"]}>
              <div className={styles["ehealth-card"]}>
                <h3 className={styles["ehealth-card-title"]}>Trạng thái phiếu khám</h3>
                <div className={styles.timeline}>
                  {record.timeline.map((item, index) => (
                    <div key={index} className={styles["timeline-item"]}>
                      <div className={styles["timeline-wrapper"]}>
                        <div className={`${styles["timeline-dot"]} ${item.isCompleted ? styles.completed : ""}`}>
                          <TimelineIcon name={item.icon} />
                        </div>
                        {index < record.timeline.length - 1 && <div className={styles["timeline-line"]}></div>}
                      </div>
                      <div className={styles["timeline-content"]}>
                        <p className={styles["timeline-label"]}>{item.label}</p>
                        <p className={styles["timeline-date"]}>{item.dateTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles["ehealth-card"]}>
                <h3 className={styles["ehealth-card-title"]}>Bác sĩ điều trị</h3>
                <div className={styles["doctor-card"]}>
                  <div className={styles["doctor-avatar-large"]}>
                    <img src={record.doctor.avatar} alt={record.doctor.name} />
                  </div>
                  <h4 className={styles["doctor-name"]}>{record.doctor.name}</h4>
                  <p className={styles["doctor-department"]}>{record.doctor.department}</p>
                  <p className={styles["doctor-branch"]}>{record.doctor.branch}</p>
                  <button className={`${styles["btn-primary"]} ${styles["btn-block"]}`}>Đặt tái khám</button>
                </div>
              </div>
            </aside>

            <div className={styles["ehealth-content"]}>
              {(activeTab === "diagnosis" || activeTab === "detail") && (
                <div className={styles["ehealth-section"]}>
                  <div className={styles["ehealth-card"]}>
                    <div className={styles["ehealth-card-header"]}>
                      <div>
                        <h2 className={`${styles["ehealth-card-title"]} ${styles.large}`}>Chi tiết lần khám</h2>
                        <p className={styles["ehealth-card-subtitle"]}>Tại: {record.location}</p>
                      </div>
                      <div className={styles["ehealth-card-actions"]}>
                        <button className={`${styles["btn-secondary"]} ${styles["btn-small"]}`}>
                          <Download size={16} />
                          Tải PDF
                        </button>
                        <span className={`${styles["status-badge"]} ${styles["status-completed"]}`}>{record.statusLabel}</span>
                      </div>
                    </div>

                    <div className={styles["ehealth-info-section"]}>
                      <h3 className={styles["ehealth-info-title"]}>Chẩn đoán</h3>
                      <div className={styles["diagnosis-box"]}>
                        <div className={styles["diagnosis-icon"]}>
                          <Stethoscope size={22} />
                        </div>
                        <div className={styles["diagnosis-content"]}>
                          <p className={styles["diagnosis-name"]}>{record.diagnosis.name}</p>
                          <span className={styles["diagnosis-code"]}>ICD-10: {record.diagnosis.icdCode}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles["ehealth-info-section"]}>
                      <h3 className={styles["ehealth-info-title"]}>Ghi chú lâm sàng</h3>
                      <div className={styles["clinical-notes"]}>
                        {record.clinicalNotes.split("\n").map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                        <div className={styles["notes-signature"]}>
                          <ShieldCheck size={16} />
                          <span>Ký bởi BS. {record.doctor.name} tại {record.doctor.branch} lúc 09:45</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "medicines" && <MedicinesTable medicines={record.medicines} styles={styles} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MedicinesTable({ medicines, styles }) {
  return (
    <div className={styles["ehealth-section"]}>
      <div className={styles["ehealth-card"]}>
        <div className={`${styles["ehealth-card-header"]} ${styles["medicines-header"]}`}>
          <div>
            <h2 className={`${styles["ehealth-card-title"]} ${styles.large}`}>Đơn thuốc</h2>
          </div>
          <button className={`${styles["btn-secondary"]} ${styles["btn-small"]}`}>
            <Download size={16} />
            Tải PDF
          </button>
        </div>

        <div className={styles["medicines-table-wrapper"]}>
          <table className={styles["medicines-table"]}>
            <thead>
              <tr>
                <th>Tên thuốc</th>
                <th>Liều dùng</th>
                <th>Thời gian</th>
                <th>Cách dùng</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => (
                <tr key={medicine.id}>
                  <td className={styles["medicine-name"]}>{medicine.name}</td>
                  <td>{medicine.dosage}</td>
                  <td>{medicine.duration}</td>
                  <td className={styles["medicine-usage"]}>{medicine.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}