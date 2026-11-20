'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  UserRound,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { AvailabilitySlot } from '@/lib/types';
import {
  addDaysToKey,
  formatDateKeyLong,
  formatTimeInZone,
  hourInZone,
  todayKeyInZone,
} from '@/lib/utils';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
} from '@/components/ui';

const PERIODS = ['Mañana', 'Tarde', 'Noche'] as const;
type Period = (typeof PERIODS)[number];

export default function AvailabilityPage() {
  const [date, setDate] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');

  const businessQuery = useQuery({
    queryKey: ['business'],
    queryFn: () => api.business.get(),
  });
  const servicesQuery = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => api.services.list(true),
  });
  const staffQuery = useQuery({
    queryKey: ['staff', 'active'],
    queryFn: () => api.staff.list(true),
  });

  const timezone =
    businessQuery.data?.timezone ?? 'America/Argentina/Buenos_Aires';
  const services = useMemo(
    () => servicesQuery.data ?? [],
    [servicesQuery.data],
  );
  const staff = useMemo(() => staffQuery.data ?? [], [staffQuery.data]);
  useEffect(() => {
    if (!date && businessQuery.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(todayKeyInZone(businessQuery.data.timezone));
    }
  }, [businessQuery.data, date]);

  const effectiveDate = date;
  const effectiveServiceId = serviceId || services[0]?.id || '';
  const service =
    services.find((item) => item.id === effectiveServiceId) ?? null;

  const availabilityQuery = useQuery({
    queryKey: ['availability', effectiveServiceId, effectiveDate, staffId],
    queryFn: () =>
      api.availability.get({
        serviceId: effectiveServiceId,
        date: effectiveDate,
        staffId: staffId || undefined,
      }),
    enabled: Boolean(effectiveServiceId && effectiveDate),
  });

  const staffName = useMemo(() => {
    const map = new Map<string, string>();

    for (const member of staff) {
      map.set(member.id, member.name);
    }

    return map;
  }, [staff]);

  const groups = useMemo(() => {
    const buckets: Record<Period, AvailabilitySlot[]> = {
      Mañana: [],
      Tarde: [],
      Noche: [],
    };

    for (const slot of availabilityQuery.data?.slots ?? []) {
      const hour = hourInZone(slot.startsAt, timezone);
      const period: Period =
        hour < 12 ? 'Mañana' : hour < 19 ? 'Tarde' : 'Noche';

      buckets[period].push(slot);
    }

    return buckets;
  }, [availabilityQuery.data, timezone]);

  const totalSlots = availabilityQuery.data?.slots.length ?? 0;

  return (
    <>
      <PageHeader
        title="Disponibilidad"
        description="Consultá las horas reservables de un servicio en una fecha concreta."
      />

      <Card>
        <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <Field
            label="Servicio"
            htmlFor="availability-service"
            error={
              servicesQuery.error
                ? 'No pudimos cargar los servicios.'
                : undefined
            }
          >
            <Select
              id="availability-service"
              value={effectiveServiceId}
              onChange={(event) => setServiceId(event.target.value)}
            >
              {services.length === 0 ? (
                <option value="">Sin servicios activos</option>
              ) : null}
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.durationMinutes} min
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Profesional"
            htmlFor="availability-staff"
            hint="Dejalo en blanco para ver todo el equipo."
          >
            <Select
              id="availability-staff"
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
            >
              <option value="">Todo el equipo</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Fecha" htmlFor="availability-date">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  effectiveDate && setDate(addDaysToKey(effectiveDate, -1))
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-subtle-foreground shadow-sm transition hover:bg-background hover:text-foreground"
                aria-label="Día anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <Input
                id="availability-date"
                type="date"
                value={effectiveDate}
                onChange={(event) => setDate(event.target.value)}
              />
              <button
                type="button"
                onClick={() =>
                  effectiveDate && setDate(addDaysToKey(effectiveDate, 1))
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-subtle-foreground shadow-sm transition hover:bg-background hover:text-foreground"
                aria-label="Día siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </Field>
        </div>
      </Card>

      {services.length === 0 && !servicesQuery.isLoading ? (
        <EmptyState
          icon={CalendarClock}
          title="No hay servicios activos"
          description="Activá al menos un servicio para poder calcular disponibilidad."
        />
      ) : null}

      {service ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge tone="info">
            <Clock3 className="h-3.5 w-3.5" />
            {service.durationMinutes} min
            {service.bufferMinutes > 0
              ? ` + ${service.bufferMinutes} min buffer`
              : ''}
          </Badge>
          <Badge tone="neutral">{timezone}</Badge>
          {effectiveDate ? (
            <span className="text-subtle-foreground capitalize">
              {formatDateKeyLong(effectiveDate)}
            </span>
          ) : null}
        </div>
      ) : null}

      {availabilityQuery.error ? (
        <ErrorBanner
          message={
            availabilityQuery.error instanceof Error
              ? availabilityQuery.error.message
              : 'No pudimos calcular la disponibilidad.'
          }
        />
      ) : null}

      {availabilityQuery.isFetching ? (
        <Card className="flex items-center justify-center gap-3 p-8 text-sm text-subtle-foreground">
          <Spinner />
          Calculando disponibilidad…
        </Card>
      ) : availabilityQuery.data ? (
        totalSlots === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No hay horarios disponibles"
            description="Probá con otra fecha, otro servicio u otro profesional. Puede ser un día sin horario cargado o fuera de la ventana de reserva."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-subtle-foreground">
              <CalendarClock className="h-4 w-4" />
              {totalSlots} horarios disponibles
            </div>

            {PERIODS.map((period) => {
              const slots = groups[period];

              if (slots.length === 0) {
                return null;
              }

              return (
                <Card key={period} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      {period}
                    </h2>
                    <span className="text-xs text-subtle-foreground">
                      {slots.length} horarios
                    </span>
                  </div>
                  <div className="grid gap-2 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {slots.map((slot) => {
                      const names = slot.staffIds
                        .map((id) => staffName.get(id))
                        .filter((name): name is string => Boolean(name));

                      return (
                        <div
                          key={slot.startsAt}
                          className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {formatTimeInZone(slot.startsAt, timezone)}
                            </p>
                            <p className="text-xs text-subtle-foreground">
                              hasta {formatTimeInZone(slot.endsAt, timezone)}
                            </p>
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-subtle-foreground">
                            {staffId ? (
                              <>
                                <UserRound className="h-3.5 w-3.5" />
                                {names[0] ?? 'Profesional'}
                              </>
                            ) : (
                              <>
                                <Users className="h-3.5 w-3.5" />
                                {names.length > 0
                                  ? names.join(' · ')
                                  : `${slot.staffIds.length} disponibles`}
                              </>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : null}
    </>
  );
}
