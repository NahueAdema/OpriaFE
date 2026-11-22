'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Building2,
  ChevronRight,
  Clock3,
  Menu,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

const features = [
  {
    icon: MessageCircle,
    title: 'La IA atiende por vos',
    description:
      'Responde consultas, comparte precios y transforma conversaciones en reservas, incluso cuando estás ocupado.',
  },
  {
    icon: CalendarCheck,
    title: 'Tu agenda, siempre clara',
    description:
      'Organizá cada turno, disponibilidad y servicio en una vista simple que todo tu equipo entiende.',
  },
  {
    icon: Clock3,
    title: 'Más tiempo para crecer',
    description:
      'Automatizá recordatorios y confirmaciones para reducir ausencias y recuperar horas perdidas.',
  },
];

export default function Page() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    if (!demoOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDemoOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [demoOpen]);

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--text-primary)] selection:bg-[var(--accent-soft)]">
      <div className="absolute inset-x-0 top-0 -z-0 h-[680px] bg-[radial-gradient(circle_at_72%_7%,rgba(205,196,255,.5),transparent_34%),radial-gradient(circle_at_18%_4%,rgba(255,224,192,.42),transparent_30%)]" />
      <nav className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6 lg:px-8">
        <a href="#inicio" className="flex items-center" aria-label="Opria">
          <BrandLogo variant="full" className="h-9" priority />
        </a>
        <div className="hidden items-center gap-8 text-[13px] font-semibold text-[var(--text-secondary)] md:flex">
          <a href="#producto" className="transition hover:text-[var(--primary-hover)]">
            Producto
          </a>
          <a href="#como-funciona" className="transition hover:text-[var(--primary-hover)]">
            Cómo funciona
          </a>
          <a href="#resultados" className="transition hover:text-[var(--primary-hover)]">
            Resultados
          </a>
          <a href="#precios" className="transition hover:text-[var(--primary-hover)]">
            Precios
          </a>
        </div>
        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--primary-hover)]"
          >
            <Building2 size={15} strokeWidth={1.8} />
            <span>Negocios</span>
          </Link>
          <span aria-hidden="true" className="h-4 w-px bg-[var(--border)]" />
          <Link
            href="/cliente"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--primary-hover)]"
          >
            <UserRound size={15} strokeWidth={1.8} />
            <span>Clientes</span>
          </Link>
        </div>
        <button
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="grid size-10 place-items-center rounded-full border border-foreground/10 md:hidden"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>
      {mobileOpen && (
        <div
          id="landing-mobile-menu"
          className="relative z-10 mx-6 flex flex-col gap-4 rounded-2xl border border-foreground/5 bg-surface p-5 shadow-xl md:hidden"
        >
          <a href="#producto" onClick={() => setMobileOpen(false)}>
            Producto
          </a>
          <a href="#como-funciona" onClick={() => setMobileOpen(false)}>
            Cómo funciona
          </a>
          <a href="#resultados" onClick={() => setMobileOpen(false)}>
            Resultados
          </a>
          <a href="#precios" onClick={() => setMobileOpen(false)}>
            Precios
          </a>
          <div className="mt-1 border-t border-[var(--border)] pt-3">
            <p className="mb-2 text-[10px] font-semibold tracking-[.14em] text-[var(--text-muted)] uppercase">
              Ingresar a Opria
            </p>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-semibold text-[var(--primary-hover)] transition hover:bg-[var(--background)]"
            >
              <Building2 size={17} strokeWidth={1.8} />
              <span>Continuar como negocio</span>
              <ArrowRight className="ml-auto" size={15} />
            </Link>
            <Link
              href="/cliente"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--background)]"
            >
              <UserRound size={17} strokeWidth={1.8} />
              <span>Continuar como cliente</span>
              <ArrowRight className="ml-auto" size={15} />
            </Link>
          </div>
        </div>
      )}

      <section
        id="inicio"
        className="relative z-10 mx-auto max-w-[1200px] px-6 pt-16 pb-20 lg:px-8 lg:pt-24 lg:pb-28"
      >
        <div className="grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--accent-soft)] bg-surface/70 px-3.5 py-2 text-[11px] font-bold text-[var(--primary-hover)] shadow-sm">
              <span className="size-1.5 rounded-full bg-[var(--success)]" />
              La agenda inteligente para negocios que crecen
            </div>
            <h1 className="max-w-[570px] text-[54px] leading-[.98] font-bold tracking-[-.075em] sm:text-[68px]">
              Tu negocio.
              <br />
              <span className="text-[var(--primary-hover)]">Más simple.</span>
              <br />
              Más lleno.
            </h1>
            <p className="mt-7 max-w-[470px] text-[17px] leading-relaxed text-[var(--text-secondary)]">
              Opria atiende a tus clientes, organiza tu agenda y te ayuda a
              crecer. Vos enfocate en hacer lo que mejor hacés.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/registro"
                className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-hover)] px-6 py-3.5 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(112,105,199,.25)] transition hover:-translate-y-0.5"
              >
                Empezar gratis <ArrowRight size={15} />
              </Link>
              <button
                onClick={() => setDemoOpen(true)}
                className="flex items-center gap-2 px-2 text-[13px] font-bold text-[var(--text-secondary)]"
              >
                <span className="grid size-9 place-items-center rounded-full border border-[var(--border)] bg-surface">
                  <Play size={13} fill="currentColor" />
                </span>{' '}
                Ver cómo funciona
              </button>
            </div>
            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2">
                <span className="grid size-7 place-items-center rounded-full border-2 border-[var(--background)] bg-[var(--border)] text-[9px] font-bold">
                  MR
                </span>
                <span className="grid size-7 place-items-center rounded-full border-2 border-[var(--background)] bg-[var(--accent)] text-[9px] font-bold">
                  LC
                </span>
                <span className="grid size-7 place-items-center rounded-full border-2 border-[var(--background)] bg-[var(--border)] text-[9px] font-bold">
                  AP
                </span>
              </div>
              <div>
                <div className="flex gap-0.5 text-[var(--warning)]">
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                </div>
                <p className="mt-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                  +2.000 negocios ya lo eligen
                </p>
              </div>
            </div>
          </div>
          <div id="resultados" className="relative lg:pl-10">
            <div className="absolute top-4 -right-3 size-56 rounded-full bg-[var(--accent)]/40 blur-3xl" />
            <div className="relative rounded-[24px] border border-surface/80 bg-surface/80 p-3 shadow-[0_28px_70px_rgba(58,48,102,.16)] backdrop-blur lg:rotate-[1.5deg]">
              <div className="overflow-hidden rounded-[17px] border border-[var(--border)] bg-[var(--background)]">
                <div className="flex items-center justify-between border-b border-[var(--border)] bg-surface px-5 py-4">
                  <div className="flex h-7 items-center">
                    <BrandLogo variant="full" className="h-6" />
                  </div>
                  <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[9px] font-bold text-[var(--success)]">
                    ● Online
                  </span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-[1.25fr_.75fr]">
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--text-muted)]">
                      MIÉRCOLES, 29 DE OCTUBRE
                    </p>
                    <h3 className="mt-1 text-[21px] font-bold tracking-[-.05em]">
                      Buen día, Lucía
                    </h3>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-[var(--accent-soft)] p-3">
                        <p className="text-[9px] text-[var(--text-secondary)]">Turnos hoy</p>
                        <p className="mt-1 text-[19px] font-bold text-[var(--primary-hover)]">
                          18
                        </p>
                      </div>
                      <div className="rounded-xl bg-[var(--background)] p-3">
                        <p className="text-[9px] text-[var(--text-secondary)]">Asistencia</p>
                        <p className="mt-1 text-[19px] font-bold text-[var(--success)]">
                          94%
                        </p>
                      </div>
                      <div className="rounded-xl bg-[var(--background)] p-3">
                        <p className="text-[9px] text-[var(--text-secondary)]">Nuevos</p>
                        <p className="mt-1 text-[19px] font-bold text-[var(--warning)]">
                          34
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-[var(--border)] bg-surface p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold">Agenda de hoy</p>
                        <span className="text-[9px] font-bold text-[var(--primary-hover)]">
                          Ver todo
                        </span>
                      </div>
                      {[
                        '09:00  Sofía Martínez',
                        '10:30  Mateo Ríos',
                        '12:30  Valentina Costa',
                      ].map((item, i) => (
                        <div
                          key={item}
                          className="mt-3 flex items-center gap-2 border-t border-[var(--background)] pt-2.5 text-[10px]"
                        >
                          <span className="w-9 font-bold text-[var(--text-secondary)]">
                            {item.slice(0, 5)}
                          </span>
                          <span
                            className={`size-1.5 rounded-full ${i === 0 ? 'bg-[var(--secondary)]' : i === 1 ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`}
                          />
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.slice(6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-foreground text-background p-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent)]">
                      <Sparkles size={12} /> Asistente IA
                    </div>
                    <p className="mt-8 text-[15px] leading-tight font-bold">
                      Tu asistente está trabajando para vos.
                    </p>
                    <p className="mt-2 text-[10px] leading-relaxed text-[var(--accent)]">
                      42 consultas resueltas esta semana.
                    </p>
                    <div className="mt-8 flex h-12 items-end gap-1">
                      {[25, 42, 32, 56, 44, 76, 62, 88, 72, 100].map((h, i) => (
                        <span
                          key={i}
                          className={`flex-1 rounded-t ${i === 9 ? 'bg-[var(--accent)]' : 'bg-[var(--primary)]'}`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-3 flex items-center gap-2 rounded-2xl border border-surface bg-surface px-3 py-2.5 shadow-[0_12px_30px_rgba(39,33,73,.12)]">
              <span className="grid size-7 place-items-center rounded-full bg-[var(--border)] text-[var(--success)]">
                <Check size={14} />
              </span>
              <div>
                <p className="text-[9px] font-bold">Turno confirmado</p>
                <p className="text-[9px] text-[var(--text-muted)]">
                  Sofía Martínez · ahora
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="producto"
        className="border-y border-[var(--border)] bg-surface/60 px-6 py-20 lg:px-8"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-[520px]">
            <p className="text-[11px] font-bold tracking-[.18em] text-[var(--primary)] uppercase">
              Todo en un solo lugar
            </p>
            <h2 className="mt-3 text-[39px] leading-[1.03] font-bold tracking-[-.06em]">
              La calma de tener
              <br />
              todo bajo control.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="rounded-[22px] border border-[var(--border)] bg-[var(--background)] p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`grid size-11 place-items-center rounded-2xl ${index === 0 ? 'bg-[var(--accent-soft)] text-[var(--primary)]' : index === 1 ? 'bg-[var(--border)] text-[var(--success)]' : 'bg-[var(--background)] text-[var(--warning)]'}`}
                >
                  <Icon size={20} />
                </div>
                <h3 className="mt-7 text-[17px] font-bold tracking-[-.025em]">
                  {title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  {description}
                </p>
                <a
                  href="#como-funciona"
                  className="mt-6 inline-flex items-center text-[11px] font-bold text-[var(--primary-hover)]"
                >
                  Conocer más <ChevronRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="rounded-[28px] bg-foreground text-background p-8 shadow-[0_20px_50px_rgba(36,37,63,.14)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--accent)]">
                CONVERSACIÓN REAL
              </span>
              <span className="rounded-full bg-surface/10 px-2.5 py-1 text-[9px] text-[var(--accent)]">
                WhatsApp + IA
              </span>
            </div>
            <div className="mt-10 flex flex-col gap-3 text-[12px]">
              <div className="max-w-[240px] self-end rounded-2xl rounded-br-sm bg-[var(--primary-hover)] px-4 py-3">
                Hola, ¿tenés disponibilidad para corte mañana?
              </div>
              <div className="max-w-[260px] rounded-2xl rounded-bl-sm bg-surface/10 px-4 py-3 leading-relaxed text-background/80">
                ¡Hola! Sí, tengo un lugar a las 10:30 o 16:00. ¿Cuál te queda
                mejor?
              </div>
              <div className="max-w-[215px] self-end rounded-2xl rounded-br-sm bg-[var(--primary-hover)] px-4 py-3">
                A las 16:00, por favor.
              </div>
              <div className="max-w-[260px] rounded-2xl rounded-bl-sm bg-surface/10 px-4 py-3 leading-relaxed text-background/80">
                Listo. Tu turno quedó confirmado. Te voy a recordar el día
                anterior.
              </div>
            </div>
            <div className="mt-9 flex items-center gap-2 border-t border-surface/10 pt-5 text-[10px] text-[var(--text-muted)]">
              <span className="size-1.5 rounded-full bg-[var(--success)]" /> Respondió
              en menos de 30 segundos
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[.18em] text-[var(--primary)] uppercase">
              Mientras vos trabajás
            </p>
            <h2 className="mt-3 text-[39px] leading-[1.03] font-bold tracking-[-.06em]">
              Tu próximo cliente
              <br />
              ya está llegando.
            </h2>
            <p className="mt-5 max-w-[430px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
              No hace falta sumar más horas a tu día. Turnero IA se ocupa de las
              preguntas repetitivas y mantiene tu agenda llena, sin que pierdas
              el toque humano.
            </p>
            <button
              onClick={() => setDemoOpen(true)}
              className="mt-8 flex items-center gap-2 rounded-full border border-[var(--border)] bg-surface px-5 py-3 text-[12px] font-bold text-[var(--primary-hover)]"
            >
              Ver cómo funciona <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <section
        id="precios"
        className="bg-[var(--accent-soft)] px-6 py-20 text-center lg:px-8"
      >
        <p className="text-[11px] font-bold tracking-[.18em] text-[var(--primary)] uppercase">
          Listo para simplificar
        </p>
        <h2 className="mx-auto mt-3 max-w-[570px] text-[42px] leading-[1.02] font-bold tracking-[-.065em]">
          Tu negocio merece
          <br />
          una agenda así de simple.
        </h2>
        <p className="mx-auto mt-5 max-w-[440px] text-[14px] text-[var(--text-secondary)]">
          Probá todas las funciones gratis durante 14 días. Sin tarjeta, sin
          compromiso.
        </p>
        <Link
          href="/registro"
          className="mt-8 inline-flex items-center gap-1 rounded-full bg-[var(--primary-hover)] px-7 py-4 text-[13px] font-bold text-white shadow-[0_10px_25px_rgba(112,105,199,.25)]"
        >
          Empezar prueba gratuita <ArrowRight size={15} />
        </Link>
      </section>
      <footer className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-8 text-[11px] text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span className="font-bold text-[var(--text-secondary)]">Opria</span>
        <span>Hecho para que tu negocio crezca.</span>
        <span>© 2026 Turnero IA</span>
      </footer>
      {demoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Demo de Turnero IA"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDemoOpen(false);
          }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-[24px] bg-surface p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Así de simple funciona</h2>
              <button
                aria-label="Cerrar demo"
                onClick={() => setDemoOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-[var(--background)]"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              La IA recibe la consulta, encuentra un espacio disponible y
              confirma el turno automáticamente. Vos solo ves crecer tu agenda.
            </p>
            <div className="mt-6 rounded-2xl bg-foreground text-background p-5 text-center">
              <Sparkles className="mx-auto text-[var(--accent)]" size={24} />
              <p className="mt-3 text-sm font-bold">
                Tu asistente está listo para trabajar.
              </p>
            </div>
            <button
              onClick={() => setDemoOpen(false)}
              className="mt-6 w-full rounded-full bg-[var(--primary-hover)] py-3 text-sm font-bold text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
