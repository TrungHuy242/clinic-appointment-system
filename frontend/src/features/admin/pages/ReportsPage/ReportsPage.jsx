import React from "react";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div>
      <h1>Báo cáo thống kê</h1>
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        <BarChart3 size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p>Trang báo cáo đang được phát triển</p>
      </div>
    </div>
  );
}
