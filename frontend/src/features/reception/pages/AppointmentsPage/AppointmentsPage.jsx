import React from "react";
import { Calendar } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <div>
      <h1>Quản lý lịch hẹn</h1>
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        <Calendar size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p>Trang quản lý lịch hẹn đang được phát triển</p>
      </div>
    </div>
  );
}
