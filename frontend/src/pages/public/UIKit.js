import React from "react";
import "../../styles/pages/audit-log.css";

export default function UIKit() {
  return (
    <div className="audit-log-body">
      <>
        <main className="audit-log-main">
          <div className="main-content">
            <div className="page-header">
              <div>
                <h1 className="page-title">Nhật ký thao tác</h1>
                <p className="page-subtitle">Theo dõi hoạt động của nhân viên và các thay đổi trong hệ thống.</p>
              </div>
              <button className="export-btn">
                <span className="material-symbols-outlined">download</span>
                Xuất báo cáo
              </button>
            </div>
            <div className="filters-section">
              <div className="filters-left">
                <div className="search-input">
                  <div className="search-icon">
                    <span className="material-symbols-outlined">search</span>
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
                <button className="filter-btn" title="Làm mới">
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                <button className="filter-btn" title="Cài đặt hiển thị">
                  <span className="material-symbols-outlined">settings</span>
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
                    <tr className="table-row">
                      <td className="table-cell time-cell">
                        <div className="time-date">24/05/2024</div>
                        <div className="time-time">10:45:22</div>
                      </td>
                      <td className="table-cell employee-cell">
                        <div className="employee-avatar lt">LT</div>
                        <div className="employee-info">
                          <div className="employee-name">Lê Thị Thu</div>
                          <div className="employee-role">Lễ tân - CN1</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="action-badge checkin">Check-in PA4</span>
                      </td>
                      <td className="table-cell target-cell">
                        <span className="target-id">#APT-2405-089</span>
                      </td>
                      <td className="table-cell note-cell">
                        Khách hàng đã đến, chờ tại sảnh A.
                      </td>
                      <td className="table-cell" style={{textAlign: 'right'}}>
                        <a className="detail-link" href="#">Chi tiết</a>
                      </td>
                    </tr>
                    <tr className="table-row">
                      <td className="table-cell time-cell">
                        <div className="time-date">24/05/2024</div>
                        <div className="time-time">10:30:15</div>
                      </td>
                      <td className="table-cell employee-cell">
                        <div className="employee-avatar nh">NH</div>
                        <div className="employee-info">
                          <div className="employee-name">Nguyễn Hoàng</div>
                          <div className="employee-role">CSKH Online</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="action-badge confirm">Xác nhận PA1</span>
                      </td>
                      <td className="table-cell target-cell">
                        <span className="target-id">#APT-2405-092</span>
                      </td>
                      <td className="table-cell note-cell">
                        Đã gọi điện xác nhận lịch hẹn với khách.
                      </td>
                      <td className="table-cell" style={{textAlign: 'right'}}>
                        <a className="detail-link" href="#">Chi tiết</a>
                      </td>
                    </tr>
                    <tr className="table-row">
                      <td className="table-cell time-cell">
                        <div className="time-date">24/05/2024</div>
                        <div className="time-time">09:15:00</div>
                      </td>
                      <td className="table-cell employee-cell">
                        <div className="employee-avatar sys">SYS</div>
                        <div className="employee-info">
                          <div className="employee-name">Hệ thống</div>
                          <div className="employee-role">Tự động</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="action-badge cancel">Hủy lịch</span>
                      </td>
                      <td className="table-cell target-cell">
                        <span className="target-id">#APT-2405-045</span>
                      </td>
                      <td className="table-cell note-cell">
                        Hủy tự động do quá hạn xác nhận (24h).
                      </td>
                      <td className="table-cell" style={{textAlign: 'right'}}>
                        <a className="detail-link" href="#">Chi tiết</a>
                      </td>
                    </tr>
                    <tr className="table-row">
                      <td className="table-cell time-cell">
                        <div className="time-date">24/05/2024</div>
                        <div className="time-time">08:45:33</div>
                      </td>
                      <td className="table-cell employee-cell">
                        <div className="employee-avatar tv">TV</div>
                        <div className="employee-info">
                          <div className="employee-name">Trần Văn B</div>
                          <div className="employee-role">Bác sĩ - Da liễu</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="action-badge update">Cập nhật HSBA</span>
                      </td>
                      <td className="table-cell target-cell">
                        <span className="target-id">#PAT-00921</span>
                      </td>
                      <td className="table-cell note-cell">
                        Thêm ghi chú lâm sàng sau khám.
                      </td>
                      <td className="table-cell" style={{textAlign: 'right'}}>
                        <a className="detail-link" href="#">Chi tiết</a>
                      </td>
                    </tr>
                    <tr className="table-row">
                      <td className="table-cell time-cell">
                        <div className="time-date">23/05/2024</div>
                        <div className="time-time">16:20:11</div>
                      </td>
                      <td className="table-cell employee-cell">
                        <div className="employee-avatar pa">PA</div>
                        <div className="employee-info">
                          <div className="employee-name">Phạm Anh</div>
                          <div className="employee-role">Lễ tân - CN2</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="action-badge new">Đặt lịch mới</span>
                      </td>
                      <td className="table-cell target-cell">
                        <span className="target-id">#APT-2405-101</span>
                      </td>
                      <td className="table-cell note-cell">
                        Đặt lịch khám tổng quát cho khách vãng lai.
                      </td>
                      <td className="table-cell" style={{textAlign: 'right'}}>
                        <a className="detail-link" href="#">Chi tiết</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="pagination-section">
                <div className="pagination-info">
                  <p className="pagination-text">
                    Hiển thị <span className="page-number">1</span> đến <span className="page-number">5</span> trong số <span className="page-number">97</span> kết quả
                  </p>
                  <nav className="pagination-nav" aria-label="Pagination">
                    <button className="pagination-btn">
                      <span className="sr-only">Previous</span>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="pagination-page active">1</button>
                    <button className="pagination-page">2</button>
                    <button className="pagination-page">3</button>
                    <span className="pagination-ellipsis">...</span>
                    <button className="pagination-btn">
                      <span className="sr-only">Next</span>
                      <span className="material-symbols-outlined">chevron_right</span>
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
      </>
    </div>
  );
}
