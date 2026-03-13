import React from "react";
import { ChevronLeft, ChevronRight, Download, RefreshCw, Search, Settings2 } from "lucide-react";
import "./UIKitPage.css";

const rows = [
  {
    date: "24/05/2024",
    time: "10:45:22",
    initials: "LT",
    initialsClass: "lt",
    employeeName: "Lê Thị Thu",
    role: "Lễ tân - CN1",
    action: "Check-in PA4",
    actionClass: "checkin",
    target: "#APT-2405-089",
    note: "Khách hàng đã đến, chờ tại sảnh A.",
  },
  {
    date: "24/05/2024",
    time: "10:30:15",
    initials: "NH",
    initialsClass: "nh",
    employeeName: "Nguyễn Hoàng",
    role: "CSKH Online",
    action: "Xác nhận PA1",
    actionClass: "confirm",
    target: "#APT-2405-092",
    note: "Đã gọi điện xác nhận lịch hẹn với khách.",
  },
  {
    date: "24/05/2024",
    time: "09:15:00",
    initials: "SYS",
    initialsClass: "sys",
    employeeName: "Hệ thống",
    role: "Tự động",
    action: "Hủy lịch",
    actionClass: "cancel",
    target: "#APT-2405-045",
    note: "Hủy tự động do quá hạn xác nhận (24h).",
  },
  {
    date: "24/05/2024",
    time: "08:45:33",
    initials: "TV",
    initialsClass: "tv",
    employeeName: "Trần Văn B",
    role: "Bác sĩ - Da liễu",
    action: "Cập nhật HSBA",
    actionClass: "update",
    target: "#PAT-00921",
    note: "Thêm ghi chú lâm sàng sau khám.",
  },
  {
    date: "23/05/2024",
    time: "16:20:11",
    initials: "PA",
    initialsClass: "pa",
    employeeName: "Phạm Anh",
    role: "Lễ tân - CN2",
    action: "Đặt lịch mới",
    actionClass: "new",
    target: "#APT-2405-101",
    note: "Đặt lịch khám tổng quát cho khách vãng lai.",
  },
];

export default function UIKitPage() {
  return (
    <div className="audit-log-body ui-kit-page">
      <main className="audit-log-main">
        <div className="main-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Nhật ký thao tác</h1>
              <p className="page-subtitle">
                Theo dõi hoạt động của nhân viên và các thay đổi trong hệ thống.
              </p>
            </div>
            <button className="export-btn" type="button">
              <Download className="mc-icon mc-icon--sm" />
              Xuất báo cáo
            </button>
          </div>

          <div className="filters-section">
            <div className="filters-left">
              <div className="search-input">
                <div className="search-icon">
                  <Search className="mc-icon mc-icon--sm" />
                </div>
                <input type="text" placeholder="Tìm kiếm mã lịch, nhân viên..." />
              </div>
              <div className="date-range">
                <div className="date-input">
                  <input type="date" />
                </div>
                <span className="date-separator">-</span>
                <div className="date-input">
                  <input type="date" />
                </div>
              </div>
              <div className="action-select">
                <select>
                  <option>Tất cả hành động</option>
                  <option>Đặt lịch mới</option>
                  <option>Xác nhận PA1</option>
                  <option>Check-in PA4</option>
                  <option>Hủy lịch</option>
                  <option>Cập nhật hồ sơ</option>
                </select>
              </div>
            </div>
            <div className="filters-right">
              <button className="filter-btn" title="Làm mới" type="button">
                <RefreshCw className="mc-icon mc-icon--sm" />
              </button>
              <button className="filter-btn" title="Cài đặt hiển thị" type="button">
                <Settings2 className="mc-icon mc-icon--sm" />
              </button>
            </div>
          </div>

          <div className="table-container">
            <div className="table-wrapper">
              <table className="audit-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell" scope="col">Thời gian</th>
                    <th className="table-cell" scope="col">Nhân viên</th>
                    <th className="table-cell" scope="col">Hành động</th>
                    <th className="table-cell" scope="col">Đối tượng tác động</th>
                    <th className="table-cell" scope="col">Ghi chú</th>
                    <th className="table-cell" scope="col">
                      <span className="sr-only">Chi tiết</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {rows.map((row) => (
                    <tr key={`${row.target}-${row.time}`} className="table-row">
                      <td className="table-cell time-cell">
                        <div className="time-date">{row.date}</div>
                        <div className="time-time">{row.time}</div>
                      </td>
                      <td className="table-cell employee-cell">
                        <div className={`employee-avatar ${row.initialsClass}`}>{row.initials}</div>
                        <div className="employee-info">
                          <div className="employee-name">{row.employeeName}</div>
                          <div className="employee-role">{row.role}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`action-badge ${row.actionClass}`}>{row.action}</span>
                      </td>
                      <td className="table-cell target-cell">
                        <span className="target-id">{row.target}</span>
                      </td>
                      <td className="table-cell note-cell">{row.note}</td>
                      <td className="table-cell ui-kit-page__actions-cell">
                        <button className="detail-link ui-kit-page__detail-link" type="button">
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-section">
              <div className="pagination-info">
                <p className="pagination-text">
                  Hiển thị <span className="page-number">1</span> đến <span className="page-number">5</span> trong số <span className="page-number">97</span> kết quả
                </p>
                <nav className="pagination-nav" aria-label="Pagination">
                  <button className="pagination-btn" type="button">
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="mc-icon mc-icon--sm" />
                  </button>
                  <button className="pagination-page" type="button">1</button>
                  <button className="pagination-page" type="button">2</button>
                  <button className="pagination-page" type="button">3</button>
                  <span className="pagination-ellipsis">...</span>
                  <button className="pagination-btn" type="button">
                    <span className="sr-only">Next</span>
                    <ChevronRight className="mc-icon mc-icon--sm" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="audit-log-footer">
        <div className="footer-content">
          <p>© 2024 MediCare Clinic Admin Portal. Bảo mật thông tin bệnh nhân là ưu tiên hàng đầu.</p>
        </div>
      </footer>
    </div>
  );
}