import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="mc-stack-lg" style={{ paddingTop: 32 }}>
      <div className="mc-surface" style={{ padding: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <Badge>Lỗi 404</Badge>
        </div>
        <h1 className="home-hero-title" style={{ fontSize: 24 }}>
          Không tìm thấy trang
        </h1>
        <p className="home-hero-sub" style={{ marginTop: 8 }}>
          Xin lỗi, đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển.
          Vui lòng quay lại Trang chủ Hải Châu hoặc tra cứu lịch hẹn của bạn.
        </p>
        <div className="mc-row-gap-md" style={{ marginTop: 16 }}>
          <Button onClick={() => navigate("/")}>Về Trang chủ Hải Châu</Button>
          <Button variant="secondary" onClick={() => navigate("/lookup")}>
            Tra cứu lịch hẹn
          </Button>
        </div>
      </div>
    </div>
  );
}
