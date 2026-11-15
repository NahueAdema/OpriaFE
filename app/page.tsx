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
    <main className="min-h-screen overflow-hidden bg-[#fbfaf8] text-[#17151d] selection:bg-[#ddd8ff]">
      <div className="absolute inset-x-0 top-0 -z-0 h-[680px] bg-[radial-gradient(circle_at_72%_7%,rgba(205,196,255,.5),transparent_34%),radial-gradient(circle_at_18%_4%,rgba(255,224,192,.42),transparent_30%)]" />
      <nav className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6 lg:px-8">
        <a href="#inicio" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[12px] bg-[#5148d8] text-white shadow-[0_8px_20px_rgba(81,72,216,.23)]">
            <Sparkles size={18} />
          </span>
          <span className="text-[18px] font-bold tracking-[-.05em]">Opria</span>
        </a>
        <div className="hidden items-center gap-8 text-[13px] font-semibold text-[#716f79] md:flex">
          <a href="#producto" className="transition hover:text-[#5148d8]">
            Producto
          </a>
          <a href="#como-funciona" className="transition hover:text-[#5148d8]">
            Cómo funciona
          </a>
          <a href="#resultados" className="transition hover:text-[#5148d8]">
            Resultados
          </a>
          <a href="#precios" className="transition hover:text-[#5148d8]">
            Precios
          </a>
        </div>
        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#696672] transition-colors hover:text-[#5148d8]"
          >
            <Building2 size={15} strokeWidth={1.8} />
            <span>Negocios</span>
          </Link>
          <span aria-hidden="true" className="h-4 w-px bg-[#dedbe5]" />
          <Link
            href="/cliente"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#696672] transition-colors hover:text-[#5148d8]"
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
          className="grid size-10 place-items-center rounded-full border border-black/10 md:hidden"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>
      {mobileOpen && (
        <div
          id="landing-mobile-menu"
          className="relative z-10 mx-6 flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-xl md:hidden"
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
          <div className="mt-1 border-t border-[#eeeaf1] pt-3">
            <p className="mb-2 text-[10px] font-semibold tracking-[.14em] text-[#96919e] uppercase">
              Ingresar a Opria
            </p>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-semibold text-[#5148d8] transition hover:bg-[#f7f6ff]"
            >
              <Building2 size={17} strokeWidth={1.8} />
              <span>Continuar como negocio</span>
              <ArrowRight className="ml-auto" size={15} />
            </Link>
            <Link
              href="/cliente"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-semibold text-[#696672] transition hover:bg-[#faf9fc]"
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
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dcd7fa] bg-white/70 px-3.5 py-2 text-[11px] font-bold text-[#6159c7] shadow-sm">
              <span className="size-1.5 rounded-full bg-[#6cdd9c]" />
              La agenda inteligente para negocios que crecen
            </div>
            <h1 className="max-w-[570px] text-[54px] leading-[.98] font-bold tracking-[-.075em] sm:text-[68px]">
              Tu negocio.
              <br />
              <span className="text-[#5148d8]">Más simple.</span>
              <br />
              Más lleno.
            </h1>
            <p className="mt-7 max-w-[470px] text-[17px] leading-relaxed text-[#77737e]">
              Opria atiende a tus clientes, organiza tu agenda y te ayuda a
              crecer. Vos enfocate en hacer lo que mejor hacés.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/registro"
                className="inline-flex items-center gap-1 rounded-full bg-[#5148d8] px-6 py-3.5 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(81,72,216,.25)] transition hover:-translate-y-0.5"
              >
                Empezar gratis <ArrowRight size={15} />
              </Link>
              <button
                onClick={() => setDemoOpen(true)}
                className="flex items-center gap-2 px-2 text-[13px] font-bold text-[#615d68]"
              >
                <span className="grid size-9 place-items-center rounded-full border border-[#d8d4e4] bg-white">
                  <Play size={13} fill="currentColor" />
                </span>{' '}
                Ver cómo funciona
              </button>
            </div>
            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2">
                <span className="grid size-7 place-items-center rounded-full border-2 border-[#fbfaf8] bg-[#e8c4ae] text-[9px] font-bold">
                  MR
                </span>
                <span className="grid size-7 place-items-center rounded-full border-2 border-[#fbfaf8] bg-[#bfcaf0] text-[9px] font-bold">
                  LC
                </span>
                <span className="grid size-7 place-items-center rounded-full border-2 border-[#fbfaf8] bg-[#d1e6c2] text-[9px] font-bold">
                  AP
                </span>
              </div>
              <div>
                <div className="flex gap-0.5 text-[#f1b84d]">
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                  <Star size={11} fill="currentColor" />
                </div>
                <p className="mt-0.5 text-[10px] font-semibold text-[#8b8790]">
                  +2.000 negocios ya lo eligen
                </p>
              </div>
            </div>
          </div>
          <div id="resultados" className="relative lg:pl-10">
            <div className="absolute top-4 -right-3 size-56 rounded-full bg-[#c7bfff]/40 blur-3xl" />
            <div className="relative rounded-[24px] border border-white/80 bg-white/80 p-3 shadow-[0_28px_70px_rgba(58,48,102,.16)] backdrop-blur lg:rotate-[1.5deg]">
              <div className="overflow-hidden rounded-[17px] border border-[#ecebf2] bg-[#fbfbfd]">
                <div className="flex items-center justify-between border-b border-[#ededf2] bg-white px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-[#5148d8] text-white">
                      <Sparkles size={13} />
                    </span>
                    <span className="text-[12px] font-bold">Opria</span>
                  </div>
                  <span className="rounded-full bg-[#effaf4] px-2.5 py-1 text-[9px] font-bold text-[#42a875]">
                    ● Online
                  </span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-[1.25fr_.75fr]">
                  <div>
                    <p className="text-[10px] font-semibold text-[#a1a0ab]">
                      MIÉRCOLES, 29 DE OCTUBRE
                    </p>
                    <h3 className="mt-1 text-[21px] font-bold tracking-[-.05em]">
                      Buen día, Lucía
                    </h3>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-[#f0efff] p-3">
                        <p className="text-[9px] text-[#79749a]">Turnos hoy</p>
                        <p className="mt-1 text-[19px] font-bold text-[#5148d8]">
                          18
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#eef9f2] p-3">
                        <p className="text-[9px] text-[#709280]">Asistencia</p>
                        <p className="mt-1 text-[19px] font-bold text-[#39a56f]">
                          94%
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#fff4eb] p-3">
                        <p className="text-[9px] text-[#a78a74]">Nuevos</p>
                        <p className="mt-1 text-[19px] font-bold text-[#df8953]">
                          34
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-[#eeeef3] bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold">Agenda de hoy</p>
                        <span className="text-[9px] font-bold text-[#5148d8]">
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
                          className="mt-3 flex items-center gap-2 border-t border-[#f3f3f5] pt-2.5 text-[10px]"
                        >
                          <span className="w-9 font-bold text-[#888792]">
                            {item.slice(0, 5)}
                          </span>
                          <span
                            className={`size-1.5 rounded-full ${i === 0 ? 'bg-[#8179e8]' : i === 1 ? 'bg-[#eea16e]' : 'bg-[#65c397]'}`}
                          />
                          <span className="font-semibold text-[#484650]">
                            {item.slice(6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#24253f] p-4 text-white">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#bcb6ff]">
                      <Sparkles size={12} /> Asistente IA
                    </div>
                    <p className="mt-8 text-[15px] leading-tight font-bold">
                      Tu asistente está trabajando para vos.
                    </p>
                    <p className="mt-2 text-[10px] leading-relaxed text-[#b5b6ca]">
                      42 consultas resueltas esta semana.
                    </p>
                    <div className="mt-8 flex h-12 items-end gap-1">
                      {[25, 42, 32, 56, 44, 76, 62, 88, 72, 100].map((h, i) => (
                        <span
                          key={i}
                          className={`flex-1 rounded-t ${i === 9 ? 'bg-[#bcb6ff]' : 'bg-[#6b66ba]'}`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-3 flex items-center gap-2 rounded-2xl border border-white bg-white px-3 py-2.5 shadow-[0_12px_30px_rgba(39,33,73,.12)]">
              <span className="grid size-7 place-items-center rounded-full bg-[#e4f8ed] text-[#43aa75]">
                <Check size={14} />
              </span>
              <div>
                <p className="text-[9px] font-bold">Turno confirmado</p>
                <p className="text-[9px] text-[#9997a2]">
                  Sofía Martínez · ahora
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="producto"
        className="border-y border-[#ede9e7] bg-white/60 px-6 py-20 lg:px-8"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-[520px]">
            <p className="text-[11px] font-bold tracking-[.18em] text-[#6b61d5] uppercase">
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
                className="rounded-[22px] border border-[#ece9ee] bg-[#fbfafc] p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`grid size-11 place-items-center rounded-2xl ${index === 0 ? 'bg-[#eeedff] text-[#5b54e8]' : index === 1 ? 'bg-[#e8f8ef] text-[#42a875]' : 'bg-[#fff0e5] text-[#dd8956]'}`}
                >
                  <Icon size={20} />
                </div>
                <h3 className="mt-7 text-[17px] font-bold tracking-[-.025em]">
                  {title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-[#85818b]">
                  {description}
                </p>
                <a
                  href="#como-funciona"
                  className="mt-6 inline-flex items-center text-[11px] font-bold text-[#5148d8]"
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
          <div className="rounded-[28px] bg-[#24253f] p-8 text-white shadow-[0_20px_50px_rgba(36,37,63,.14)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#bdb8ff]">
                CONVERSACIÓN REAL
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] text-[#b8b9c9]">
                WhatsApp + IA
              </span>
            </div>
            <div className="mt-10 flex flex-col gap-3 text-[12px]">
              <div className="max-w-[240px] self-end rounded-2xl rounded-br-sm bg-[#5148d8] px-4 py-3">
                Hola, ¿tenés disponibilidad para corte mañana?
              </div>
              <div className="max-w-[260px] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 leading-relaxed text-[#deddea]">
                ¡Hola! Sí, tengo un lugar a las 10:30 o 16:00. ¿Cuál te queda
                mejor?
              </div>
              <div className="max-w-[215px] self-end rounded-2xl rounded-br-sm bg-[#5148d8] px-4 py-3">
                A las 16:00, por favor.
              </div>
              <div className="max-w-[260px] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 leading-relaxed text-[#deddea]">
                Listo. Tu turno quedó confirmado. Te voy a recordar el día
                anterior.
              </div>
            </div>
            <div className="mt-9 flex items-center gap-2 border-t border-white/10 pt-5 text-[10px] text-[#9597ae]">
              <span className="size-1.5 rounded-full bg-[#65d49a]" /> Respondió
              en menos de 30 segundos
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[.18em] text-[#6b61d5] uppercase">
              Mientras vos trabajás
            </p>
            <h2 className="mt-3 text-[39px] leading-[1.03] font-bold tracking-[-.06em]">
              Tu próximo cliente
              <br />
              ya está llegando.
            </h2>
            <p className="mt-5 max-w-[430px] text-[15px] leading-relaxed text-[#85818b]">
              No hace falta sumar más horas a tu día. Turnero IA se ocupa de las
              preguntas repetitivas y mantiene tu agenda llena, sin que pierdas
              el toque humano.
            </p>
            <button
              onClick={() => setDemoOpen(true)}
              className="mt-8 flex items-center gap-2 rounded-full border border-[#d9d4ed] bg-white px-5 py-3 text-[12px] font-bold text-[#5148d8]"
            >
              Ver cómo funciona <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <section
        id="precios"
        className="bg-[#f0efff] px-6 py-20 text-center lg:px-8"
      >
        <p className="text-[11px] font-bold tracking-[.18em] text-[#6b61d5] uppercase">
          Listo para simplificar
        </p>
        <h2 className="mx-auto mt-3 max-w-[570px] text-[42px] leading-[1.02] font-bold tracking-[-.065em]">
          Tu negocio merece
          <br />
          una agenda así de simple.
        </h2>
        <p className="mx-auto mt-5 max-w-[440px] text-[14px] text-[#77738a]">
          Probá todas las funciones gratis durante 14 días. Sin tarjeta, sin
          compromiso.
        </p>
        <Link
          href="/registro"
          className="mt-8 inline-flex items-center gap-1 rounded-full bg-[#5148d8] px-7 py-4 text-[13px] font-bold text-white shadow-[0_10px_25px_rgba(81,72,216,.25)]"
        >
          Empezar prueba gratuita <ArrowRight size={15} />
        </Link>
      </section>
      <footer className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-8 text-[11px] text-[#99959f] sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span className="font-bold text-[#5e5a65]">Opria</span>
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
          className="fixed inset-0 z-50 grid place-items-center bg-[#17151d]/50 p-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-[24px] bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Así de simple funciona</h2>
              <button
                aria-label="Cerrar demo"
                onClick={() => setDemoOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-[#f3f2f7]"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#77737e]">
              La IA recibe la consulta, encuentra un espacio disponible y
              confirma el turno automáticamente. Vos solo ves crecer tu agenda.
            </p>
            <div className="mt-6 rounded-2xl bg-[#24253f] p-5 text-center text-white">
              <Sparkles className="mx-auto text-[#bdb8ff]" size={24} />
              <p className="mt-3 text-sm font-bold">
                Tu asistente está listo para trabajar.
              </p>
            </div>
            <button
              onClick={() => setDemoOpen(false)}
              className="mt-6 w-full rounded-full bg-[#5148d8] py-3 text-sm font-bold text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
