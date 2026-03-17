import { apiClient } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

const SLOT_BLOCK_MINUTES = 25;

function formatTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildSlotLabel(startValue, endValue) {
  return `${formatTime(startValue)} - ${formatTime(endValue)}`;
}

function toOffsetDateTime(dateValue, timeValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  const offsetMinutes = -localDate.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetMins = String(absoluteOffset % 60).padStart(2, "0");
  return `${dateValue}T${timeValue}:00${sign}${offsetHours}:${offsetMins}`;
}

function mapAppointmentToBooking(appointment) {
  return {
    id: appointment.id,
    code: appointment.code,
    patientName: appointment.patient_full_name,
    patientPhone: appointment.patient_phone,
    specialty: appointment.specialty_name,
    specialtyName: appointment.specialty_name,
    doctor: appointment.doctor_name,
    doctorName: appointment.doctor_name,
    date: appointment.scheduled_start.slice(0, 10),
    slot: buildSlotLabel(appointment.scheduled_start, appointment.scheduled_end),
    status: appointment.status,
    createdAt: appointment.created_at,
    expiresAt: appointment.expires_at || null,
    visitType: appointment.visit_type,
    visitTypeLabel: appointment.visit_type_label,
    visitBlocks: appointment.visit_blocks,
    qrText: appointment.qr_text,
  };
}

export async function getSpecialties() {
  const data = await apiClient.get(ENDPOINTS.catalog.specialties, {
    params: { is_active: "true" },
  });

  return data.map((specialty) => ({
    id: specialty.id,
    name: specialty.name,
    description: specialty.description,
  }));
}

export async function getDoctorsBySpecialty(specialtyId) {
  const data = await apiClient.get(ENDPOINTS.catalog.doctors, {
    params: {
      specialty_id: specialtyId,
      is_active: "true",
    },
  });

  return data.map((doctor) => ({
    id: doctor.id,
    name: doctor.full_name,
    phone: doctor.phone,
    specialtyId: doctor.specialty,
    specialtyName: doctor.specialty_name,
    slotDuration: SLOT_BLOCK_MINUTES,
  }));
}

export function getSlots(doctorId, date, visitType) {
  return apiClient.get(ENDPOINTS.appointments.slots(doctorId), {
    params: { date, visit_type: visitType },
  });
}

export async function createGuestBooking(payload) {
  const [slotStart, slotEnd] = payload.slot.split(" - ");
  const data = await apiClient.post(ENDPOINTS.appointments.guest, {
    patient_full_name: payload.patientName,
    patient_phone: payload.patientPhone,
    specialty: payload.specialtyId,
    doctor: payload.doctorId,
    scheduled_start: toOffsetDateTime(payload.date, slotStart),
    scheduled_end: toOffsetDateTime(payload.date, slotEnd),
    visit_type: payload.visitType,
  });

  return mapAppointmentToBooking(data);
}

export async function getBookingByCode(code) {
  const data = await apiClient.get(ENDPOINTS.appointments.detail(code.trim().toUpperCase()));
  return mapAppointmentToBooking(data);
}

export async function expirePA1(code) {
  const data = await apiClient.patch(ENDPOINTS.appointments.status(code.trim().toUpperCase()), {
    status: "CANCELLED",
  });
  return mapAppointmentToBooking(data);
}

export async function confirmPA1(code) {
  try {
    const data = await apiClient.patch(ENDPOINTS.appointments.status(code.trim().toUpperCase()), {
      status: "CONFIRMED",
    });
    return mapAppointmentToBooking(data);
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      const wrapped = new Error("PA1_EXPIRED");
      wrapped.cause = error;
      throw wrapped;
    }

    throw error;
  }
}

export async function lookupAppointment(code, phone) {
  try {
    const data = await apiClient.get(ENDPOINTS.appointments.lookup, {
      params: {
        code: code.trim().toUpperCase(),
        phone: phone.trim(),
      },
    });

    return mapAppointmentToBooking(data);
  } catch (error) {
    if (error.status === 404) {
      const wrapped = new Error("NOT_FOUND");
      wrapped.cause = error;
      throw wrapped;
    }

    throw error;
  }
}

export async function lookupAppointmentsByPhone(phone, code) {
  try {
    const params = { phone: phone.trim() };

    if (code && code.trim()) {
      params.code = code.trim().toUpperCase();
    }

    const data = await apiClient.get(ENDPOINTS.appointments.lookupByPhone, {
      params,
    });

    return Array.isArray(data) ? data.map(mapAppointmentToBooking) : [];
  } catch (error) {
    if (error.status === 404) {
      return [];
    }

    throw error;
  }
}
