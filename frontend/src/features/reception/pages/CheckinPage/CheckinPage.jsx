import React from "react";
import { ClipboardCheck } from "lucide-react";

export default function CheckinPage() {
  return (
    <div>
      <h1>Check-in bệnh nhân</h1>
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        <ClipboardCheck size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p>Trang check-in đang được phát triển</p>
      </div>
    </div>
  );
}
