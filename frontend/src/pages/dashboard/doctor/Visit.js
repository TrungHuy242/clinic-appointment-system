import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import Input from "../../../components/common/Input";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Toast from "../../../components/common/Toast";
import {
    getVisitQueue,
    getVisitDetail,
    saveDraft,
    completeVisit,
} from "../../../services/visitsApi";
import "../../../styles/pages/dashboard.css";

const QUEUE_STATUS = {
    waiting: { label: "Chờ", variant: "warning" },
    in_progress: { label: "Đang khám", variant: "info" },
    done: { label: "Xong", variant: "neutral" },
};

const UNITS = ["viên", "ml", "gói", "ống", "lọ"];
const FREQUENCIES = ["1 lần/ngày", "2 lần/ngày", "3 lần/ngày", "Sáng – Tối", "Theo chỉ định"];

function emptyRx() {
    return { drug: "", dose: "", unit: "viên", freq: "2 lần/ngày", days: "5", note: "" };
}

export default function Visit() {
    const { code: routeCode } = useParams();
    const navigate = useNavigate();

    const [queue, setQueue] = useState([]);
    const [activeCode, setActiveCode] = useState(routeCode ?? null);
    const [detail, setDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Form chẩn đoán
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    const [prescription, setPrescription] = useState([emptyRx()]);

    const [saving, setSaving] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [toast, setToast] = useState(null);

    function showToast(message, variant = "success") {
        setToast({ message, variant });
        setTimeout(() => setToast(null), 2500);
    }

    // Load queue
    useEffect(() => {
        getVisitQueue().then(setQueue);
    }, []);

    // Load detail khi chọn bệnh nhân
    const loadDetail = useCallback(async (code) => {
        if (!code) return;
        setLoadingDetail(true);
        setDetail(null);
        try {
            const d = await getVisitDetail(code);
            setDetail(d);
            // Khôi phục draft nếu có
            if (d.draft) {
                setDiagnosis(d.draft.diagnosis ?? "");
                setNotes(d.draft.notes ?? "");
                setPrescription(d.draft.prescription ?? [emptyRx()]);
            } else {
                setDiagnosis("");
                setNotes("");
                setPrescription([emptyRx()]);
            }
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    useEffect(() => {
        loadDetail(activeCode);
    }, [activeCode, loadDetail]);

    // Đổi bệnh nhân từ queue
    function selectPatient(code) {
        setActiveCode(code);
        navigate(`/app/doctor/visit/${code}`, { replace: true });
    }

    /* Prescription handlers */
    function addRx() { setPrescription((p) => [...p, emptyRx()]); }
    function removeRx(i) { setPrescription((p) => p.filter((_, idx) => idx !== i)); }
    function updateRx(i, field, val) {
        setPrescription((p) => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
    }

    /* Save draft */
    async function handleSaveDraft() {
        if (!activeCode) return;
        setSaving(true);
        try {
            await saveDraft(activeCode, { diagnosis, notes, prescription });
            showToast("Đã lưu nháp thành công.");
        } catch {
            showToast("Lưu nháp thất bại.", "danger");
        } finally {
            setSaving(false);
        }
    }

    /* Complete visit */
    async function handleComplete() {
        if (!activeCode) return;
        if (!diagnosis.trim()) {
            showToast("Vui lòng nhập chẩn đoán trước khi hoàn tất.", "warning");
            return;
        }
        setCompleting(true);
        try {
            await completeVisit(activeCode, { diagnosis, notes, prescription });
            showToast("Đã hoàn tất khám bệnh!");
            // Refresh queue
            const q = await getVisitQueue();
            setQueue(q);
        } catch {
            showToast("Hoàn tất thất bại.", "danger");
        } finally {
            setCompleting(false);
        }
    }

    return (
        <div className="vt-layout">
            <Toast message={toast?.message} variant={toast?.variant} />

            {/* Sidebar queue */}
            <aside className="vt-queue">
                <div className="vt-queue__title">Hàng đợi hôm nay</div>
                {queue.length === 0 && (
                    <div style={{ padding: "0 16px", fontSize: 13, color: "var(--color-text-muted)" }}>
                        Chưa có bệnh nhân.
                    </div>
                )}
                {queue.map((q) => (
                    <div
                        key={q.code}
                        className={`vt-queue-item${activeCode === q.code ? " active" : ""}${q.status === "done" ? " done" : ""}`}
                        onClick={() => selectPatient(q.code)}
                    >
                        <div className="vt-queue-item__name">{q.patientName}</div>
                        <div className="vt-queue-item__slot">{q.slot}</div>
                        <div className="vt-queue-item__badge">
                            <Badge variant={QUEUE_STATUS[q.status]?.variant ?? "neutral"}>
                                {QUEUE_STATUS[q.status]?.label ?? q.status}
                            </Badge>
                        </div>
                    </div>
                ))}
            </aside>

            {/* Main content */}
            <main className="vt-main">
                {loadingDetail && (
                    <div style={{ textAlign: "center", paddingTop: 60 }}>
                        <LoadingSpinner />
                    </div>
                )}

                {!activeCode && !loadingDetail && (
                    <div style={{ textAlign: "center", paddingTop: 80, color: "var(--color-text-muted)" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
                        <div>Chọn bệnh nhân từ danh sách bên trái để bắt đầu khám.</div>
                    </div>
                )}

                {detail && !loadingDetail && (
                    <>
                        {/* Patient card */}
                        <div className="vt-patient-card">
                            <div className="vt-patient-avatar">👤</div>
                            <div style={{ flex: 1 }}>
                                <div className="vt-patient-name">{detail.patientName}</div>
                                <div className="vt-patient-meta">
                                    {detail.dob && `${detail.dob} · `}
                                    {detail.gender} · {detail.phone}
                                </div>
                                <div className="vt-patient-meta" style={{ marginTop: 4 }}>
                                    {detail.specialty} · {detail.slot}
                                </div>
                                {detail.chiefComplaint && (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            padding: "8px 12px",
                                            background: "var(--color-warning-soft)",
                                            borderRadius: "var(--radius-md)",
                                            fontSize: 13,
                                            color: "var(--color-warning)",
                                            fontWeight: 600,
                                        }}
                                    >
                                        🗒 {detail.chiefComplaint}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lịch sử khám */}
                        {detail.history?.length > 0 && (
                            <div className="vt-section">
                                <div className="vt-section__title">Lịch sử khám</div>
                                {detail.history.map((h, i) => (
                                    <div key={i} className="vt-history-item">
                                        <div className="vt-history-date">{h.date}</div>
                                        <div>
                                            <strong>{h.diagnosis}</strong>
                                            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                                                {h.doctor}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Form chẩn đoán */}
                        <div className="vt-section">
                            <div className="vt-section__title">Chẩn đoán & Ghi chú</div>
                            <div className="mc-stack-md">
                                <Input
                                    label="Chẩn đoán *"
                                    placeholder="Viêm da dị ứng, mã ICD J30.1…"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                                <div>
                                    <label className="mc-field-label">Ghi chú lâm sàng</label>
                                    <textarea
                                        className="mc-input"
                                        rows={3}
                                        placeholder="Mô tả thêm tình trạng, hướng điều trị..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Đơn thuốc */}
                        <div className="vt-section">
                            <div className="vt-section__title">Đơn thuốc</div>
                            <table className="vt-rx-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "25%" }}>Tên thuốc</th>
                                        <th style={{ width: "12%" }}>Liều</th>
                                        <th style={{ width: "10%" }}>Đơn vị</th>
                                        <th style={{ width: "18%" }}>Cách dùng</th>
                                        <th style={{ width: "8%" }}>Ngày</th>
                                        <th style={{ width: "20%" }}>Ghi chú</th>
                                        <th style={{ width: "7%" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prescription.map((rx, i) => (
                                        <tr key={i}>
                                            <td>
                                                <input
                                                    value={rx.drug}
                                                    placeholder="Paracetamol 500mg"
                                                    onChange={(e) => updateRx(i, "drug", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    value={rx.dose}
                                                    placeholder="1"
                                                    onChange={(e) => updateRx(i, "dose", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={rx.unit}
                                                    onChange={(e) => updateRx(i, "unit", e.target.value)}
                                                >
                                                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <select
                                                    value={rx.freq}
                                                    onChange={(e) => updateRx(i, "freq", e.target.value)}
                                                >
                                                    {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    value={rx.days}
                                                    placeholder="5"
                                                    onChange={(e) => updateRx(i, "days", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    value={rx.note}
                                                    placeholder="Uống sau ăn"
                                                    onChange={(e) => updateRx(i, "note", e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    className="vt-rx-del"
                                                    onClick={() => removeRx(i)}
                                                    title="Xóa dòng"
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Button variant="ghost" onClick={addRx} style={{ fontSize: 13 }}>
                                + Thêm thuốc
                            </Button>
                        </div>

                        {/* Action bar */}
                        <div className="vt-action-bar">
                            <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
                                {saving ? "Đang lưu…" : "💾 Lưu nháp"}
                            </Button>
                            <Button onClick={handleComplete} disabled={completing}>
                                {completing ? "Đang hoàn tất…" : "✅ Hoàn tất khám"}
                            </Button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
