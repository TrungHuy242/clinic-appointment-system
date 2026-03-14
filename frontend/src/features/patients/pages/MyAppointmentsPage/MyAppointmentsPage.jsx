import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, CalendarDays, MapPin, Plus } from "lucide-react";
import { appointmentApi } from "../../services/patientApi";
import styles from "./MyAppointmentsPage.module.css";
import "./MyAppointmentsPage.css";

function DoctorAvatar({ name, avatar, stylesRef }) {
  if (avatar) {
    return <img src={avatar} alt={name} className={stylesRef["doctor-avatar"]} />;
  }

  return (
    <div
      className={stylesRef["doctor-avatar"]}
      style={{ display: "grid", placeItems: "center", background: "#e6f7fb", fontSize: "11px", fontWeight: 700 }}
    >
      {(name || "BS").slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await appointmentApi.getAppointments(activeTab);
      setAppointments(data);
    } catch (loadError) {
      setError(loadError.message || "Không tải được danh sách lịch hẹn.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const getStatusBadgeClass = (status) => {
    const baseClass = styles["appointment-status-badge"];
    const statusVariants = {
      confirmed: `${baseClass} ${styles["status-confirmed"]}`,
      pending: `${baseClass} ${styles["status-pending"]}`,
      completed: `${baseClass} ${styles["status-completed"]}`,
      cancelled: `${baseClass} ${styles["status-cancelled"]}`,
    };
    return statusVariants[status] || baseClass;
  };

  const getMonthColorClass = (date) => {
    const month = new Date(date).getMonth();
    if (month === 9) return styles["month-blue"];
    if (month === 10) return styles["month-amber"];
    return styles["month-blue"];
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const months = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
    return { month: months[date.getMonth()], day: date.getDate() };
  };

  const recentRows = useMemo(() => appointments.slice(0, 3), [appointments]);

  function openRecord(appointment) {
    if (!appointment.recordId) return;
    navigate(`/patient/records/${appointment.recordId}`);
  }

  return (
    <div className={`my-appointments-page-shell ${styles["appointment-page"]}`}>
      <header className={styles["appointment-header"]}>
        <div className={styles["appointment-header-content"]}>
          <div>
            <h1 className={styles["appointment-title"]}>Lịch hẹn của tôi</h1>
            <p className={styles["appointment-subtitle"]}>
              Quản lý và theo dõi toàn bộ lịch khám của bạn tại MediCare Clinic.
            </p>
          </div>
          <button className={`${styles["btn-primary"]} ${styles["btn-new-appointment"]}`} onClick={() => navigate("/book")} type="button">
            <Plus size={16} />
            Đặt lịch hẹn mới
          </button>
        </div>
      </header>

      <main className={styles["appointment-main"]}>
        <div className={styles["appointment-container"]}>
          <div className={styles["appointment-tabs"]}>
            {[
              { key: "upcoming", label: "Sắp tới" },
              { key: "history", label: "Lịch sử" },
              { key: "cancelled", label: "Đã hủy" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`${styles["appointment-tab"]} ${activeTab === tab.key ? styles.active : ""}`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={styles["appointment-loading"]}>Đang tải...</div>
          ) : error ? (
            <div className={styles["appointment-empty"]}>
              <h3>Không tải được lịch hẹn</h3>
              <p>{error}</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className={styles["appointment-empty"]}>
              <div className={styles["empty-icon"]}><CalendarDays size={42} /></div>
              <h3>Không có lịch hẹn</h3>
              <p>Bạn chưa có lịch hẹn nào ở trạng thái này.</p>
            </div>
          ) : (
            <div className={styles["appointments-list"]}>
              {appointments.map((appointment) => {
                const { month, day } = formatDate(appointment.date);
                return (
                  <div key={appointment.id} className={styles["appointment-card"]}>
                    <div className={`${styles["appointment-date-box"]} ${getMonthColorClass(appointment.date)}`}>
                      <div className={styles["appointment-month"]}>{month}</div>
                      <div className={styles["appointment-day"]}>{day}</div>
                    </div>

                    <div className={styles["appointment-content"]}>
                      <div className={styles["appointment-header-row"]}>
                        <div className={styles["appointment-info"]}>
                          <div className={styles["appointment-badges"]}>
                            <span className={getStatusBadgeClass(appointment.status)}>
                              {appointment.status === "pending" && <Clock3 size={14} />}
                              {appointment.statusLabel}
                            </span>
                            <span className={styles["appointment-code"]}>{appointment.code}</span>
                          </div>
                          <h3 className={`text-ellipsis ${styles["appointment-service"]}`}>{appointment.service}</h3>
                        </div>
                        <div className={styles["appointment-time-info"]}>
                          <span className={styles["appointment-time"]}>
                            {appointment.timeStart} - {appointment.timeEnd}
                          </span>
                          <span className={styles["appointment-day-name"]}>{appointment.day}</span>
                        </div>
                      </div>

                      <div className={styles["appointment-footer"]}>
                        <div className={styles["appointment-doctor"]}>
                          <DoctorAvatar name={appointment.doctor.name} avatar={appointment.doctor.avatar} stylesRef={styles} />
                          <span className={styles["doctor-name"]}>{appointment.doctor.name}</span>
                        </div>
                        <div className={styles["appointment-location"]}>
                          <MapPin size={15} />
                          <span>{appointment.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles["appointment-actions"]}>
                      {activeTab === "upcoming" && (
                        <>
                          <button className={styles["btn-secondary"]} onClick={() => navigate("/lookup")} type="button">
                            Tra cứu
                          </button>
                          <button className={`${styles["btn-primary"]} ${styles["btn-small"]}`} onClick={() => navigate(`/booking-success/${appointment.code}`)} type="button">
                            Xem mã lịch
                          </button>
                        </>
                      )}
                      {activeTab === "history" && (
                        <button
                          className={`${styles["btn-primary"]} ${styles["btn-small"]}`}
                          onClick={() => openRecord(appointment)}
                          disabled={!appointment.recordId}
                          type="button"
                        >
                          Xem chi tiết
                        </button>
                      )}
                      {activeTab === "cancelled" && (
                        <button className={`${styles["btn-primary"]} ${styles["btn-small"]}`} onClick={() => navigate("/book")} type="button">
                          Đặt lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && recentRows.length > 0 && (
            <div className={styles["recent-appointments"]}>
              <h2 className={styles["section-title"]}>Danh sách hiện tại</h2>
              <div className={styles["appointments-table-wrapper"]}>
                <table className={styles["appointments-table"]}>
                  <thead>
                    <tr>
                      <th>Mã lịch hẹn</th>
                      <th>Dịch vụ</th>
                      <th>Bác sĩ</th>
                      <th>Ngày giờ</th>
                      <th>Trạng thái</th>
                      <th className="text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRows.map((row) => (
                      <tr key={row.code}>
                        <td className="font-medium">{row.code}</td>
                        <td>{row.service}</td>
                        <td>{row.doctor.name}</td>
                        <td>{`${row.day}, ${row.date} ${row.timeStart}`}</td>
                        <td>
                          <span className={getStatusBadgeClass(row.status)}>{row.statusLabel}</span>
                        </td>
                        <td className="text-right">
                          {row.recordId ? (
                            <button className={styles["action-link"]} onClick={() => openRecord(row)} type="button">
                              Xem
                            </button>
                          ) : (
                            <button className={styles["action-link"]} onClick={() => navigate(`/booking-success/${row.code}`)} type="button">
                              Xem
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
