import React, { useCallback, useEffect, useState } from "react";
import { Plus, Save, Stethoscope, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Badge from "../../../components/Badge/Badge";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import LoadingSpinner from "../../../components/LoadingSpinner/LoadingSpinner";
import Toast from "../../../components/Toast/Toast";
import {
  completeVisit,
  getVisitDetail,
  getVisitQueue,
  saveDraft,
} from "../../../services/doctorApi";
import "./VisitPage.css";

const QUEUE_STATUS = {
  waiting: { label: "Chờ", variant: "warning" },
  in_progress: { label: "Đang khám", variant: "info" },
  done: { label: "Xong", variant: "neutral" },
};

const UNITS = ["viên", "ml", "gói", "ống", "lọ"];
const FREQUENCIES = ["1 lần/ngày", "2 lần/ngày", "3 lần/ngày", "Sáng - Tối", "Theo chỉ định"];

const RX_HEADER_CONFIG = [
  { key: "drug", label: "Tên thuốc", className: "visit-page__rx-head--drug" },
  { key: "dose", label: "Liều", className: "visit-page__rx-head--dose" },
  { key: "unit", label: "Đơn vị", className: "visit-page__rx-head--unit" },
  { key: "freq", label: "Cách dùng", className: "visit-page__rx-head--freq" },
  { key: "days", label: "Ngày", className: "visit-page__rx-head--days" },
  { key: "note", label: "Ghi chú", className: "visit-page__rx-head--note" },
  { key: "actions", label: "", className: "visit-page__rx-head--actions" },
];

function emptyRx() {
  return { drug: "", dose: "", unit: "viên", freq: "2 lần/ngày", days: "5", note: "" };
}

export default function VisitPage() {
  const { code: routeCode } = useParams();
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [activeCode, setActiveCode] = useState(routeCode ?? null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  useEffect(() => {
    getVisitQueue().then(setQueue);
  }, []);

  const loadDetail = useCallback(async (code) => {
    if (!code) return;
    setLoadingDetail(true);
    setDetail(null);
    try {
      const result = await getVisitDetail(code);
      setDetail(result);
      if (result.draft) {
        setDiagnosis(result.draft.diagnosis ?? "");
        setNotes(result.draft.notes ?? "");
        setPrescription(result.draft.prescription ?? [emptyRx()]);
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

  function selectPatient(code) {
    setActiveCode(code);
    navigate(`/app/doctor/visit/${code}`, { replace: true });
  }

  function addRx() {
    setPrescription((current) => [...current, emptyRx()]);
  }

  function removeRx(index) {
    setPrescription((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateRx(index, field, value) {
    setPrescription((current) =>
      current.map((row, itemIndex) => (itemIndex === index ? { ...row, [field]: value } : row))
    );
  }

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
      const nextQueue = await getVisitQueue();
      setQueue(nextQueue);
    } catch {
      showToast("Hoàn tất thất bại.", "danger");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="vt-layout visit-page">
      <Toast message={toast?.message} variant={toast?.variant} />

      <aside className="vt-queue">
        <div className="vt-queue__title">Hàng đợi hôm nay</div>
        {queue.length === 0 && (
          <div className="visit-page__queue-empty">
            <div className="visit-page__queue-empty-icon"><UserRound size={20} /></div>
            <p>Chưa có bệnh nhân nào được check-in hôm nay.</p>
            <p>Lễ tân sẽ check-in bệnh nhân để họ xuất hiện tại đây.</p>
          </div>
        )}
        {queue.map((item) => (
          <div
            key={item.code}
            className={`vt-queue-item${activeCode === item.code ? " active" : ""}${item.status === "done" ? " done" : ""}`}
            onClick={() => selectPatient(item.code)}
          >
            <div className="vt-queue-item__name">{item.patientName}</div>
            <div className="vt-queue-item__slot">{item.slot}</div>
            <div className="vt-queue-item__badge">
              <Badge variant={QUEUE_STATUS[item.status]?.variant ?? "neutral"}>
                {QUEUE_STATUS[item.status]?.label ?? item.status}
              </Badge>
            </div>
          </div>
        ))}
      </aside>

      <main className="vt-main">
        {loadingDetail && (
          <div className="visit-page__loading">
            <LoadingSpinner />
          </div>
        )}

        {!activeCode && !loadingDetail && (
          <div className="visit-page__empty-state">
            <div className="visit-page__empty-icon"><Stethoscope size={28} /></div>
            <div className="visit-page__empty-title">Chưa chọn bệnh nhân</div>
            <div className="visit-page__empty-hint">
              Chọn bệnh nhân từ danh sách bên trái để bắt đầu khám.<br />
              Nếu chưa có ai trong danh sách, hãy chờ lễ tân check-in bệnh nhân.
            </div>
          </div>
        )}

        {detail && !loadingDetail && (
          <>
            <div className="vt-patient-card">
              <div className="vt-patient-avatar"><UserRound size={26} /></div>
              <div className="visit-page__patient-main">
                <div className="vt-patient-name">{detail.patientName}</div>
                <div className="vt-patient-meta">
                  {detail.dob && `${detail.dob} · `}
                  {detail.gender} · {detail.phone}
                </div>
                <div className="vt-patient-meta visit-page__patient-meta-extra">
                  {detail.specialty} · {detail.slot}
                </div>
                {detail.chiefComplaint && (
                  <div className="visit-page__complaint">
                    <Stethoscope size={16} /> {detail.chiefComplaint}
                  </div>
                )}
              </div>
            </div>

            {detail.history?.length > 0 && (
              <div className="vt-section">
                <div className="vt-section__title">Lịch sử khám</div>
                {detail.history.map((item, index) => (
                  <div key={`${item.date}-${index}`} className="vt-history-item">
                    <div className="vt-history-date">{item.date}</div>
                    <div>
                      <strong>{item.diagnosis}</strong>
                      <div className="visit-page__history-doctor">{item.doctor}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="vt-section">
              <div className="vt-section__title">Chẩn đoán và ghi chú</div>
              <div className="mc-stack-md">
                <Input
                  label="Chẩn đoán *"
                  placeholder="Viêm da dị ứng, mã ICD J30.1..."
                  value={diagnosis}
                  onChange={(event) => setDiagnosis(event.target.value)}
                />
                <div>
                  <label className="mc-field-label">Ghi chú lâm sàng</label>
                  <textarea
                    className="mc-input visit-page__notes-input"
                    rows={3}
                    placeholder="Mô tả thêm tình trạng, hướng điều trị..."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="vt-section">
              <div className="vt-section__title">Đơn thuốc</div>
              <table className="vt-rx-table">
                <thead>
                  <tr>
                    {RX_HEADER_CONFIG.map((item) => (
                      <th key={item.key} className={item.className}>
                        {item.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prescription.map((rx, index) => (
                    <tr key={`rx-${index}`}>
                      <td>
                        <input
                          value={rx.drug}
                          placeholder="Paracetamol 500mg"
                          onChange={(event) => updateRx(index, "drug", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={rx.dose}
                          placeholder="1"
                          onChange={(event) => updateRx(index, "dose", event.target.value)}
                        />
                      </td>
                      <td>
                        <select value={rx.unit} onChange={(event) => updateRx(index, "unit", event.target.value)}>
                          {UNITS.map((unit) => (
                            <option key={unit}>{unit}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select value={rx.freq} onChange={(event) => updateRx(index, "freq", event.target.value)}>
                          {FREQUENCIES.map((frequency) => (
                            <option key={frequency}>{frequency}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          value={rx.days}
                          placeholder="5"
                          onChange={(event) => updateRx(index, "days", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={rx.note}
                          placeholder="Uống sau ăn"
                          onChange={(event) => updateRx(index, "note", event.target.value)}
                        />
                      </td>
                      <td>
                        <button className="vt-rx-del" onClick={() => removeRx(index)} title="Xóa dòng" type="button">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button className="visit-page__add-rx" variant="ghost" onClick={addRx} type="button">
                <Plus className="mc-icon mc-icon--sm" />
                Thêm thuốc
              </Button>
            </div>

            <div className="vt-action-bar">
              <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
                <Save className="mc-icon mc-icon--sm" />
                {saving ? "Đang lưu..." : "Lưu nháp"}
              </Button>
              <Button onClick={handleComplete} disabled={completing}>
                <Stethoscope className="mc-icon mc-icon--sm" />
                {completing ? "Đang hoàn tất..." : "Hoàn tất khám"}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

