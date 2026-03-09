import React, { useState, useEffect, useCallback } from "react";
import { appointmentApi } from "../../../services/patientApi";
import styles from "./styles.module.css";

export default function MyAppointments() {
    const [activeTab, setActiveTab] = useState("upcoming");
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAppointments = useCallback(async () => {
        setLoading(true);
        const data = await appointmentApi.getAppointments(activeTab);
        setAppointments(data);
        setLoading(false);
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
        if (month === 9) return styles["month-blue"]; // October
        if (month === 10) return styles["month-amber"]; // November
        return styles["month-blue"];
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const months = [
            "Th1", "Th2", "Th3", "Th4", "Th5", "Th6",
            "Th7", "Th8", "Th9", "Tháng 10", "Tháng 11", "Th12",
        ];
        const day = date.getDate();
        const month = months[date.getMonth()];
        return { month, day };
    };

    return (
        <div className={styles["appointment-page"]}>
            <header className={styles["appointment-header"]}>
                <div className={styles["appointment-header-content"]}>
                    <div>
                        <h1 className={styles["appointment-title"]}>Lịch hẹn của tôi</h1>
                        <p className={styles["appointment-subtitle"]}>
                            Quản lý và theo dõi quá trình khám chữa bệnh của bạn.
                        </p>
                    </div>
                    <button className={`${styles["btn-primary"]} ${styles["btn-new-appointment"]}`}>
                        <span className="material-symbols-rounded">add</span>
                        Đặt lịch hẹn mới
                    </button>
                </div>
            </header>

            <main className={styles["appointment-main"]}>
                <div className={styles["appointment-container"]}>
                    {/* Tabs */}
                    <div className={styles["appointment-tabs"]}>
                        {["upcoming", "history", "cancelled"].map((tab) => {
                            const labels = {
                                upcoming: "Sắp tới",
                                history: "Lịch sử",
                                cancelled: "Đã hủy",
                            };
                            const counts = {
                                upcoming: appointments.length || 0,
                                history: 1,
                                cancelled: 1,
                            };
                            return (
                                <button
                                    key={tab}
                                    className={`${styles["appointment-tab"]} ${activeTab === tab ? styles.active : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {labels[tab]}
                                    {activeTab === tab && (
                                        <span className={styles["tab-count"]}>{counts[tab]}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Appointments List */}
                    {loading ? (
                        <div className={styles["appointment-loading"]}>Đang tải...</div>
                    ) : appointments.length === 0 ? (
                        <div className={styles["appointment-empty"]}>
                            <div className={styles["empty-icon"]}>📅</div>
                            <h3>Không có lịch hẹn</h3>
                            <p>Bạn chưa có lịch hẹn nào ở trạng thái này.</p>
                        </div>
                    ) : (
                        <div className={styles["appointments-list"]}>
                            {appointments.map((apt) => {
                                const { month, day } = formatDate(apt.date);
                                return (
                                    <div key={apt.id} className={styles["appointment-card"]}>
                                        <div className={`${styles["appointment-date-box"]} ${getMonthColorClass(apt.date)}`}>
                                            <div className={styles["appointment-month"]}>{month}</div>
                                            <div className={styles["appointment-day"]}>{day}</div>
                                        </div>

                                        <div className={styles["appointment-content"]}>
                                            <div className={styles["appointment-header-row"]}>
                                                <div className={styles["appointment-info"]}>
                                                    <div className={styles["appointment-badges"]}>
                                                        <span className={getStatusBadgeClass(apt.status)}>
                                                            {apt.status === "pending" && (
                                                                <span className="material-symbols-rounded">
                                                                    schedule
                                                                </span>
                                                            )}
                                                            {apt.statusLabel}
                                                        </span>
                                                        <span className={styles["appointment-code"]}>{apt.code}</span>
                                                    </div>
                                                    <h3 className={`text-ellipsis ${styles["appointment-service"]}`}>{apt.service}</h3>
                                                </div>
                                                <div className={styles["appointment-time-info"]}>
                                                    <span className={styles["appointment-time"]}>
                                                        {apt.timeStart} - {apt.timeEnd}
                                                    </span>
                                                    <span className={styles["appointment-day-name"]}>{apt.day}</span>
                                                </div>
                                            </div>

                                            <div className={styles["appointment-footer"]}>
                                                <div className={styles["appointment-doctor"]}>
                                                    <img
                                                        src={apt.doctor.avatar}
                                                        alt={apt.doctor.name}
                                                        className={styles["doctor-avatar"]}
                                                    />
                                                    <span className={styles["doctor-name"]}>{apt.doctor.name}</span>
                                                </div>
                                                <div className={styles["appointment-location"]}>
                                                    <span className="material-symbols-rounded">
                                                        location_on
                                                    </span>
                                                    <span>{apt.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles["appointment-actions"]}>
                                            {activeTab === "upcoming" && (
                                                <>
                                                    <button className={styles["btn-secondary"]}>Dời lịch</button>
                                                    <button className={`${styles["btn-primary"]} ${styles["btn-small"]}`}>
                                                        Xem chi tiết
                                                    </button>
                                                </>
                                            )}
                                            {activeTab === "history" && (
                                                <button className={`${styles["btn-primary"]} ${styles["btn-small"]}`}>
                                                    Xem chi tiết
                                                </button>
                                            )}
                                            {activeTab === "cancelled" && (
                                                <button className={`${styles["btn-primary"]} ${styles["btn-small"]}`}>
                                                    Đặt lại
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Recent Appointments Table */}
                    {activeTab === "upcoming" && (
                        <div className={styles["recent-appointments"]}>
                            <h2 className={styles["section-title"]}>Lịch hẹn gần đây</h2>
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
                                        {[
                                            {
                                                code: "MC-2023-552",
                                                service: "Khám tổng quát",
                                                doctor: "BS. Nguyễn Văn A",
                                                date: "15/12/2023, 10:00",
                                                status: "completed",
                                            },
                                            {
                                                code: "MC-2023-451",
                                                service: "Tái khám phổi",
                                                doctor: "BS. Trần Thị C",
                                                date: "10/11/2023, 14:30",
                                                status: "completed",
                                            },
                                        ].map((row) => (
                                            <tr key={row.code}>
                                                <td className="font-medium">{row.code}</td>
                                                <td>{row.service}</td>
                                                <td>{row.doctor}</td>
                                                <td>{row.date}</td>
                                                <td>
                                                    <span className={`${styles["appointment-status-badge"]} ${styles["status-completed"]}`}>
                                                        {row.status === "completed" && "Đã hoàn tất"}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <button className={styles["action-link"]}>Xem</button>
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
