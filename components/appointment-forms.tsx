'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Clock3 } from 'lucide-react';
import { ApiError, api } from '@/lib/api';
import type {
  Appointment,
  AppointmentCreateInput,
  AppointmentRescheduleInput,
} from '@/lib/types';
import {
  appointmentCreateFormSchema,
  appointmentRescheduleFormSchema,
  type AppointmentCreateFormValues,
  type AppointmentRescheduleFormValues,
} from '@/lib/schemas';
import {
  dateKeyInZone,
  formatDateTimeInZone,
  formatTimeInZone,
  todayKeyInZone,
} from '@/lib/utils';
import {
  Badge,
  Button,
  ErrorBanner,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
  WakingUpHint,
} from '@/components/ui';

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Panel booking form. Slots come from the same availability endpoint used by
 * the public flow, so the professional is either chosen explicitly or assigned
 * by the backend from the eligible staff returned by each slot.
 */
export function CreateAppointmentModal({
  open,
  initialDate,
  onClose,
  onCreated,
}: {
  open: boolean;
  initialDate: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const businessQuery = useQuery({
    queryKey: ['business'],
    queryFn: () => api.business.get(),
    enabled: open,
  });
  const servicesQuery = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => api.services.list(true),
    enabled: open,
  });
  const staffQuery = useQuery({
    queryKey: ['staff', 'active'],
    queryFn: () => api.staff.list(true),
    enabled: open,
  });

  const timezone = businessQuery.data?.timezone ?? DEFAULT_TIMEZONE;
  const services = servicesQuery.data ?? [];
  const staff = staffQuery.data ?? [];

  const form = useForm<AppointmentCreateFormValues>({
    resolver: zodResolver(appointmentCreateFormSchema),
    defaultValues: {
      serviceId: '',
      staffId: '',
      date: initialDate,
      startsAt: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      notes: '',
      status: 'pending',
      consent: false,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const serviceId = form.watch('serviceId');
  const staffId = form.watch('staffId');
  const date = form.watch('date');

  const availabilityQuery = useQuery({
    queryKey: ['availability', serviceId, date, staffId],
    queryFn: () =>
      api.availability.get({
        serviceId,
        date,
        staffId: staffId || undefined,
      }),
    enabled: open && Boolean(serviceId && date),
  });

  const slotOptions = useMemo(
    () => availabilityQuery.data?.slots ?? [],
    [availabilityQuery.data],
  );

  const createMutation = useMutationForCreate(onCreated);

  async function submit(values: AppointmentCreateFormValues) {
    const input: AppointmentCreateInput = {
      serviceId: values.serviceId,
      staffId: values.staffId || undefined,
      startsAt: values.startsAt,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail || undefined,
      notes: values.notes || undefined,
      status: values.status,
      // The panel collects consent explicitly, never implicitly.
      consent: values.consent,
    };

    createMutation.mutate(input);
  }

  const errorMessage =
    createMutation.error instanceof ApiError
      ? createMutation.error.message
      : null;

  return (
    <Modal
      open={open}
      title="Nuevo turno"
      description="Cargá un turno manualmente; validamos el horario antes de guardarlo."
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-appointment-form"
            loading={createMutation.isPending}
          >
            Crear turno
          </Button>
        </>
      }
    >
      {businessQuery.isLoading || servicesQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-subtle-foreground">
          <Spinner className="h-4 w-4" />
          Cargando opciones…
          <WakingUpHint />
        </div>
      ) : (
        <form
          id="create-appointment-form"
          onSubmit={form.handleSubmit(submit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Servicio" error={form.formState.errors.serviceId?.message}>
              <Select
                {...form.register('serviceId')}
                aria-required="true"
                disabled={services.length === 0}
              >
                <option value="">Elegí un servicio</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.durationMinutes} min
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Profesional"
              hint="Opcional: si no elegís uno, se asigna automáticamente."
              error={form.formState.errors.staffId?.message}
            >
              <Select {...form.register('staffId')}>
                <option value="">Autoasignar</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha" error={form.formState.errors.date?.message}>
              <Input type="date" {...form.register('date')} min={todayKeyInZone(timezone)} />
            </Field>
            <Field
              label="Horario"
              error={form.formState.errors.startsAt?.message}
              hint={availabilityQuery.isLoading ? 'Buscando horarios…' : undefined}
            >
              <Controller
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <Select {...field} aria-required="true">
                    <option value="">Elegí un horario</option>
                    {slotOptions.map((slot) => {
                      const available = staffId
                        ? slot.staffIds.includes(staffId)
                        : slot.staffIds.length > 0;

                      return (
                        <option
                          key={slot.startsAt}
                          value={slot.startsAt}
                          disabled={!available}
                        >
                          {formatTimeInZone(slot.startsAt, timezone)}
                        </option>
                      );
                    })}
                  </Select>
                )}
              />
            </Field>
          </div>

          {availabilityQuery.isError ? (
            <ErrorBanner message="No pudimos cargar los horarios disponibles." />
          ) : null}
          {availabilityQuery.data && slotOptions.length === 0 ? (
            <p className="rounded-xl bg-background px-3 py-2 text-xs text-subtle-foreground">
              No hay horarios libres para esa fecha. Probá con otro día o servicio.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del cliente" error={form.formState.errors.customerName?.message}>
              <Input
                {...form.register('customerName')}
                placeholder="Nombre y apellido"
                autoComplete="name"
              />
            </Field>
            <Field label="Teléfono" error={form.formState.errors.customerPhone?.message}>
              <Input
                type="tel"
                {...form.register('customerPhone')}
                placeholder="+54 11 5555 5555"
                autoComplete="tel"
              />
            </Field>
            <Field label="Email" hint="Opcional" error={form.formState.errors.customerEmail?.message}>
              <Input
                type="email"
                {...form.register('customerEmail')}
                placeholder="cliente@example.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Estado del turno" error={form.formState.errors.status?.message}>
              <Select {...form.register('status')}>
                <option value="pending">Pendiente de confirmación</option>
                <option value="confirmed">Confirmado</option>
              </Select>
            </Field>
          </div>

          <Field label="Comentarios internos" hint="Opcional" error={form.formState.errors.notes?.message}>
            <Textarea {...form.register('notes')} rows={2} />
          </Field>

          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              {...form.register('consent')}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            El cliente autorizó recibir recordatorios y novedades del turno.
          </label>

          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
        </form>
      )}
    </Modal>
  );
}

/** Uses a stable idempotency key per modal session to make retries safe. */
function useMutationForCreate(onCreated: () => void) {
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AppointmentCreateInput) =>
      api.appointments.create(input, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['public-calendar'] }),
        queryClient.invalidateQueries({ queryKey: ['public-availability'] }),
        queryClient.invalidateQueries({ queryKey: ['availability'] }),
      ]);
      onCreated();
    },
  });
}

export function RescheduleAppointmentModal({
  appointment,
  onClose,
  onRescheduled,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onRescheduled: (updated: Appointment) => void;
}) {
  const businessQuery = useQuery({
    queryKey: ['business'],
    queryFn: () => api.business.get(),
    enabled: Boolean(appointment),
  });
  const timezone = businessQuery.data?.timezone ?? DEFAULT_TIMEZONE;

  const form = useForm<AppointmentRescheduleFormValues>({
    resolver: zodResolver(appointmentRescheduleFormSchema),
    defaultValues: { startsAt: appointment?.startsAt ?? '', reason: '' },
  });

  useEffect(() => {
    if (appointment) {
      form.reset({ startsAt: appointment.startsAt, reason: '' });
    }
  }, [appointment, form]);

  const date = appointment ? dateKeyInZone(appointment.startsAt, timezone) : '';
  const selectedStartsAt = form.watch('startsAt');

  const availabilityQuery = useQuery({
    queryKey: [
      'availability',
      appointment?.serviceId,
      date,
      appointment?.staffId,
    ],
    queryFn: () =>
      api.availability.get({
        serviceId: appointment!.serviceId,
        date,
        staffId: appointment!.staffId,
      }),
    enabled: Boolean(appointment && date),
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: AppointmentRescheduleInput) =>
      api.appointments.reschedule(appointment!.id, input),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['public-calendar'] }),
        queryClient.invalidateQueries({ queryKey: ['public-availability'] }),
        queryClient.invalidateQueries({ queryKey: ['availability'] }),
      ]);
      onRescheduled(updated);
    },
  });

  async function submit(values: AppointmentRescheduleFormValues) {
    mutation.mutate({
      startsAt: values.startsAt,
      reason: values.reason.trim() || undefined,
    });
  }

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  if (!appointment) {
    return null;
  }

  return (
    <Modal
      open
      title="Reprogramar turno"
      description={`${appointment.customerName} · ${formatDateTimeInZone(appointment.startsAt, timezone)}`}
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="reschedule-appointment-form"
            loading={mutation.isPending}
            disabled={selectedStartsAt === appointment.startsAt}
          >
            Guardar nuevo horario
          </Button>
        </>
      }
    >
      <form
        id="reschedule-appointment-form"
        onSubmit={form.handleSubmit(submit)}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-2 rounded-xl bg-background px-3 py-2 text-xs text-subtle-foreground">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {appointment.serviceName} · {appointment.staffName}
          </p>
          <p className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            Horario actual: {formatDateTimeInZone(appointment.startsAt, timezone)}
          </p>
        </div>

        <Field
          label="Nuevo horario"
          error={form.formState.errors.startsAt?.message}
          hint="Solo se muestran horarios disponibles para el mismo profesional."
        >
          <Controller
            control={form.control}
            name="startsAt"
            render={({ field }) => (
              <Select {...field} aria-required="true">
                <option value="">Elegí un horario</option>
                {(availabilityQuery.data?.slots ?? []).map((slot) => (
                  <option key={slot.startsAt} value={slot.startsAt}>
                    {formatDateTimeInZone(slot.startsAt, timezone)}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>

        <Field
          label="Motivo"
          hint="Opcional; se incluye en la notificación al cliente."
          error={form.formState.errors.reason?.message}
        >
          <Textarea {...form.register('reason')} rows={2} />
        </Field>

        {availabilityQuery.isError ? (
          <ErrorBanner message="No pudimos cargar los horarios disponibles." />
        ) : null}

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <p className="text-xs text-subtle-foreground">
          <Badge tone="warning">Importante</Badge> La reprogramación respeta el
          plazo de cancelación configurado en el negocio.
        </p>
      </form>
    </Modal>
  );
}
