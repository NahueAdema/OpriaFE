import type { Appointment, AppointmentStatus } from './types';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  completed: 'Completado',
  no_show: 'No asistió',
};

export const APPOINTMENT_STATUS_TONES: Record<AppointmentStatus, BadgeTone> = {
  pending: 'warning',
  confirmed: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
  completed: 'info',
  no_show: 'danger',
};

/** Actions the business can take from the agenda, per current status. */
export const APPOINTMENT_ACTIONS: Record<
  AppointmentStatus,
  Array<{ status: AppointmentStatus; label: string }>
> = {
  pending: [
    { status: 'confirmed', label: 'Confirmar' },
    { status: 'rejected', label: 'Rechazar' },
  ],
  confirmed: [
    { status: 'completed', label: 'Completar' },
    { status: 'no_show', label: 'No asistió' },
    { status: 'cancelled', label: 'Cancelar' },
  ],
  rejected: [],
  cancelled: [],
  completed: [],
  no_show: [],
};

export function isPending(status: AppointmentStatus): boolean {
  return status === 'pending';
}

/**
 * Groups appointments by calendar day in the tenant timezone, so the month
 * grid can show how many requests each day has.
 */
export function groupByDateKey(
  appointments: Appointment[],
  timeZone: string,
): Map<string, Appointment[]> {
  const groups = new Map<string, Appointment[]>();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  for (const appointment of appointments) {
    const parts = formatter.formatToParts(new Date(appointment.startsAt));
    const year = parts.find((part) => part.type === 'year')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    const dateKey = `${year}-${month}-${day}`;
    const entries = groups.get(dateKey) ?? [];
    entries.push(appointment);
    groups.set(dateKey, entries);
  }

  return groups;
}
