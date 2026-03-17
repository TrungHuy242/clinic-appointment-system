import React from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="mc-stack-lg not-found-page">
      <div className="mc-surface not-found-page__card">
        <div className="not-found-page__badge">
          <Badge>Lỗi 404</Badge>
        </div>
        <h1 className="home-hero-title not-found-page__title">Không tìm thấy trang</h1>
        <p className="home-hero-sub not-found-page__copy">
          Xin lỗi, đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển. Vui lòng quay
          lại Trang chủ Cơ sở Hải Châu hoặc tra cứu lịch hẹn của bạn.
        </p>
        <div className="mc-row-gap-md not-found-page__actions">
          <Button onClick={() => navigate("/")}>Về Trang chủ Cơ sở Hải Châu</Button>
          <Button variant="secondary" onClick={() => navigate("/lookup")}>
            Tra cứu lịch hẹn
          </Button>
        </div>
      </div>
    </div>
  );
}

