import React from "react";
import { ClipboardList } from "lucide-react";

export default function AuditPage() {
  return (
    <div>
      <h1>Nhật ký hoạt động</h1>
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        <ClipboardList size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p>Trang nhật ký hoạt động đang được phát triển</p>
      </div>
    </div>
  );
}
