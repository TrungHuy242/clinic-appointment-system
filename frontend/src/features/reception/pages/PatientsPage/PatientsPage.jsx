import React from "react";
import { Users } from "lucide-react";

export default function PatientsPage() {
  return (
    <div>
      <h1>Quản lý bệnh nhân</h1>
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        <Users size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p>Trang quản lý bệnh nhân đang được phát triển</p>
      </div>
    </div>
  );
}
