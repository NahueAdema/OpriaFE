'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
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
      <div className="section-title-row">
        <div>
          <div className="eyebrow">RESERVAS ONLINE</div>
          <h1>Disponibilidad</h1>
          <p>Consultá las horas reservables para un servicio y una fecha.</p>
        </div>
      </div>

      <div className="availability-layout">
        <div className="form-card availability-form">
          <div className="form-card-heading">
            <h2>Buscá horarios disponibles</h2>
            <p>Elegí un servicio y una fecha para ver las opciones.</p>
          </div>
          <label className="form-field">
            Servicio
            <select
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
            </select>
          </label>
          <label className="form-field">
            Fecha
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className="square-control"
                aria-label="Día anterior"
                onClick={() => effectiveDate && setDate(addDaysToKey(effectiveDate, -1))}
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={effectiveDate}
                onChange={(event) => setDate(event.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="square-control"
                aria-label="Día siguiente"
                onClick={() => effectiveDate && setDate(addDaysToKey(effectiveDate, 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </label>
          <label className="form-field">
            Profesional
            <select
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
            >
              <option value="">Cualquier profesional</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="button button-primary"
            onClick={() => {}}
          >
            <Search size={16} /> Consultar horarios
          </button>
          <div className="availability-helper">
            <span>🔒</span> Los horarios se actualizan en tiempo real.
          </div>
        </div>

        <div className="form-card slots-card">
          <div className="slots-heading">
            <div>
              <span className="slots-date-icon">
                <CalendarClock size={17} />
              </span>
              <div>
                <h2>Horarios disponibles</h2>
                <p>{effectiveDate ? formatDateKeyLong(effectiveDate) : '—'}</p>
              </div>
            </div>
            <span className="slots-count">{totalSlots} horarios</span>
          </div>

          {service ? (
            <div className="slots-service">
              <span className="service-symbol" style={{ background: 'var(--accent-soft)', color: 'var(--primary)' }}>
                <Clock3 size={17} />
              </span>
              <div>
                <strong>{service.name}</strong>
                <span>
                  {service.durationMinutes} min
                  {service.bufferMinutes > 0 ? ` + ${service.bufferMinutes} min buffer` : ''}
                  {' · '}
                  $ {service.priceCents / 100}
                </span>
              </div>
              <ChevronRight size={16} />
            </div>
          ) : null}

          {services.length === 0 && !servicesQuery.isLoading ? (
            <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
              No hay servicios activos.
            </div>
          ) : null}

          {availabilityQuery.isFetching ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
              Calculando disponibilidad…
            </div>
          ) : availabilityQuery.data ? (
            totalSlots === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                No hay horarios disponibles.
              </div>
            ) : (
              <>
                {PERIODS.map((period) => {
                  const slots = groups[period];
                  if (slots.length === 0) return null;
                  return (
                    <div className="slot-section" key={period}>
                      <span className="slot-label">{period.toUpperCase()}</span>
                      <div className="slot-list">
                        {slots.map((slot) => (
                          <button key={slot.startsAt} type="button">
                            {formatTimeInZone(slot.startsAt, timezone)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="slots-footer">
                  <span>
                    <i /> {totalSlots} horarios disponibles
                  </span>
                  <span>{timezone}</span>
                </div>
              </>
            )
          ) : null}
        </div>
      </div>
    </>
  );
}
