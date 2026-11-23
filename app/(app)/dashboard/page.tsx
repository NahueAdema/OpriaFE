'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Inbox,
  Link2,
  Scissors,
  Users,
} from 'lucide-react';
import { Badge, ErrorBanner, Spinner, WakingUpHint } from '@/components/ui';
import { api } from '@/lib/api';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
} from '@/lib/appointments';
import { formatMoney, formatTimeInZone } from '@/lib/utils';

export default function DashboardPage() {
  const [todayLabel, setTodayLabel] = useState('');

  const businessQuery = useQuery({
    queryKey: ['business'],
    queryFn: () => api.business.get(),
  });
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => api.services.list(),
  });
  const staffQuery = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.staff.list(),
  });
  const pendingQuery = useQuery({
    queryKey: ['appointments', 'pending-count'],
    queryFn: () => api.appointments.list({ status: 'pending', limit: 1 }),
  });
  const upcomingQuery = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: () =>
      api.appointments.list({
        status: 'confirmed',
        from: new Date().toISOString(),
        limit: 4,
      }),
  });

  useEffect(() => {
    if (!businessQuery.data || todayLabel) {
      return;
    }

    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayLabel(
      format(now, "EEEE, d 'de' MMMM", { locale: es }).toUpperCase(),
    );
  }, [businessQuery.data, todayLabel]);

  const isLoading =
    businessQuery.isLoading || servicesQuery.isLoading || staffQuery.isLoading;
  const error = businessQuery.error ?? servicesQuery.error ?? staffQuery.error;

  const business = businessQuery.data;
  const services = servicesQuery.data ?? [];
  const staff = staffQuery.data ?? [];
  const pendingTotal = pendingQuery.data?.total ?? 0;
  const upcoming = upcomingQuery.data?.items ?? [];
  const timezone = business?.timezone ?? 'America/Argentina/Buenos_Aires';

  const activeServices = services.filter((service) => service.active);
  const activeStaff = staff.filter((member) => member.active);
  const assignedStaff = activeStaff.filter(
    (member) => member.services.length > 0,
  );
  const averageDuration = activeServices.length
    ? Math.round(
        activeServices.reduce(
          (total, service) => total + service.durationMinutes,
          0,
        ) / activeServices.length,
      )
    : 0;
  const averagePrice = activeServices.length
    ? Math.round(
        activeServices.reduce(
          (total, service) => total + service.priceCents,
          0,
        ) / activeServices.length,
      )
    : 0;

  const steps = [
    {
      label: 'Completá el perfil del negocio',
      description: 'Nombre, timezone y políticas de reserva.',
      done: Boolean(business),
      href: '/business',
    },
    {
      label: 'Creá tu primer servicio',
      description: 'Duración, precio, buffer y seña.',
      done: activeServices.length > 0,
      href: '/services',
    },
    {
      label: 'Sumá a tu equipo',
      description: 'Profesionales que reciben turnos.',
      done: activeStaff.length > 0,
      href: '/staff',
    },
    {
      label: 'Asigná servicios al equipo',
      description: 'Cada persona atiende los servicios que sabe hacer.',
      done: assignedStaff.length > 0,
      href: '/staff',
    },
  ];

  if (isLoading) {
    return (
      <div className="form-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, color: 'var(--text-secondary)', fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Spinner /> Cargando resumen…
        </div>
        <WakingUpHint />
      </div>
    );
  }

  return (
    <>
      <div className="section-title-row">
        <div>
          <div className="eyebrow">{todayLabel || 'HOY'}</div>
          <h1>¡Buen día{business ? `, ${business.name}` : ''}!</h1>
          <p>Este es el estado de la configuración de tu negocio.</p>
        </div>
        <div className="title-action">
          <Link href="/agenda" className="button button-primary">
            <CalendarDays size={17} /> Nueva cita
          </Link>
        </div>
      </div>

      {pendingTotal > 0 ? (
        <Link
          href="/agenda"
          className="insight-card"
          style={{ textDecoration: 'none', color: 'inherit', marginBottom: 15 }}
        >
          <div className="insight-spark" style={{ background: 'color-mix(in srgb, var(--warning) 16%, transparent)', color: 'var(--warning)' }}>
            <Inbox size={19} />
          </div>
          <div>
            <strong>
              {pendingTotal === 1
                ? '1 solicitud pendiente'
                : `${pendingTotal} solicitudes pendientes`}
            </strong>
            <p>Confirmá o rechazá los turnos para liberar u ocupar la agenda.</p>
          </div>
        </Link>
      ) : null}

      {error ? (
        <ErrorBanner
          message={error instanceof Error ? error.message : 'No pudimos cargar el resumen.'}
        />
      ) : null}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Servicios activos</span>
            <span className="stat-icon purple">
              <Scissors size={18} />
            </span>
          </div>
          <div className="stat-value">{activeServices.length}</div>
          <div className="stat-foot">
            <span className="trend">{services.length} en total</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span>Equipo activo</span>
            <span className="stat-icon green">
              <Users size={18} />
            </span>
          </div>
          <div className="stat-value">{activeStaff.length}</div>
          <div className="stat-foot">
            <span className="trend">{staff.length} en total</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span>Turno promedio</span>
            <span className="stat-icon peach">
              <Clock3 size={18} />
            </span>
          </div>
          <div className="stat-value">{averageDuration} min</div>
          <div className="stat-foot">
            <span>Duración de servicios activos</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span>Ticket promedio</span>
            <span className="stat-icon blue">
              <Building2 size={18} />
            </span>
          </div>
          <div className="stat-value">$ {formatMoney(averagePrice)}</div>
          <div className="stat-foot">
            <span>Precio de servicios activos</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <div className="form-card">
          <div className="card-heading">
            <div>
              <h2>Puesta en marcha</h2>
              <p>Completá estos pasos para empezar a recibir turnos.</p>
            </div>
            <span className="nav-count" style={{ background: 'color-mix(in srgb, var(--success) 14%, transparent)', color: 'var(--success)', border: 'none' }}>
              {steps.filter((s) => s.done).length}/{steps.length}
            </span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
            {steps.map((step) => (
              <li key={step.label} style={{ borderTop: '1px solid var(--border)' }}>
                <Link
                  href={step.href}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', textDecoration: 'none', color: 'inherit' }}
                >
                  {step.done ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  ) : (
                    <Circle size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{step.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{step.description}</p>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="form-card">
          <div className="card-heading">
            <div>
              <h2>Configuración actual</h2>
              <p>Datos que usa el motor de disponibilidad.</p>
            </div>
          </div>
          {business ? (
            <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0 0', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <dt style={{ color: 'var(--text-secondary)' }}>Negocio</dt>
                <dd style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{business.name}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <dt style={{ color: 'var(--text-secondary)' }}>Slug</dt>
                <dd style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{business.slug}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <dt style={{ color: 'var(--text-secondary)' }}>Timezone</dt>
                <dd style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{business.timezone}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <dt style={{ color: 'var(--text-secondary)' }}>Anticipación mínima</dt>
                <dd style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{business.bookingMinAdvanceMinutes} min</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <dt style={{ color: 'var(--text-secondary)' }}>Ventana de reserva</dt>
                <dd style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{business.bookingMaxAdvanceDays} días</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <dt style={{ color: 'var(--text-secondary)' }}>Cancelación</dt>
                <dd style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                  {business.cancellationHours} h · {business.cancellationDepositPolicy === 'retain' ? 'retiene seña' : 'devuelve seña'}
                </dd>
              </div>
            </dl>
          ) : (
            <p style={{ padding: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Todavía no pudimos cargar el negocio.</p>
          )}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
            <Link href="/business" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--primary-hover)', textDecoration: 'none' }}>
              Editar configuración <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="today-card">
          <div className="card-heading">
            <div>
              <h2>Próximos turnos</h2>
              <p>Lo que viene en tu agenda.</p>
            </div>
            <Link href="/agenda" className="text-link">
              Ver agenda
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p style={{ padding: '16px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              No hay turnos confirmados por ahora.
            </p>
          ) : (
            <div className="appointment-list">
              {upcoming.map((appointment) => (
                <div key={appointment.id} className="appointment-row">
                  <span className="appointment-time">
                    {formatTimeInZone(appointment.startsAt, timezone)}
                  </span>
                  <span
                    className={`appointment-avatar ${
                      APPOINTMENT_STATUS_TONES[appointment.status] === 'success'
                        ? 'avatar-mint'
                        : 'avatar-lilac'
                    }`}
                  >
                    {appointment.customerName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="appointment-info">
                    <strong>{appointment.customerName}</strong>
                    <span>
                      {appointment.serviceName} · {appointment.staffName}
                    </span>
                  </span>
                  <Badge tone={APPOINTMENT_STATUS_TONES[appointment.status]}>
                    {APPOINTMENT_STATUS_LABELS[appointment.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bottom-grid">
        <div className="insight-card">
          <div className="insight-spark">
            <CalendarDays size={19} />
          </div>
          <div>
            <strong>Tu semana empieza muy bien</strong>
            <p>Tenés {activeServices.length} servicios activos y {activeStaff.length} profesionales en el equipo.</p>
          </div>
        </div>
        <div className="booking-card">
          <div className="booking-icon">
            <Link2 size={17} />
          </div>
          <div>
            <strong>Tu agenda online está activa</strong>
            <p>Compartí tu enlace para recibir reservas.</p>
          </div>
          {business ? (
            <Link href={`/reservar/${business.slug}`} target="_blank" rel="noreferrer" aria-label="Abrir página pública" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, cursor: 'pointer' }}>
              <ArrowRight size={16} />
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}


