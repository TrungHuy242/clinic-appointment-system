import React from "react";
import { Users as UsersIcon } from "lucide-react";

export default function UsersPage() {
  return (
    <div>
      <h1>Quản lý người dùng</h1>
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        <UsersIcon size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p>Trang quản lý người dùng đang được phát triển</p>
      </div>
    </div>
  );
}
