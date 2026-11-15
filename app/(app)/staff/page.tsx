'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarOff,
  Clock3,
  Plus,
  Save,
  Scissors,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  staffFormSchema,
  timeBlockFormSchema,
  type StaffFormValues,
  type TimeBlockFormValues,
} from '@/lib/schemas';
import type { Service, StaffMember } from '@/lib/types';
import {
  formatDateTimeInZone,
  initials,
  localDateTimeToIso,
  todayKeyInZone,
  WEEKDAYS,
} from '@/lib/utils';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  Modal,
  PageHeader,
  Spinner,
  SuccessBanner,
} from '@/components/ui';

type Tab = 'perfil' | 'servicios' | 'horarios' | 'bloqueos';

const TABS: Array<{ id: Tab; label: string; icon: typeof UserRound }> = [
  { id: 'perfil', label: 'Perfil', icon: UserRound },
  { id: 'servicios', label: 'Servicios', icon: Scissors },
  { id: 'horarios', label: 'Horarios', icon: Clock3 },
  { id: 'bloqueos', label: 'Bloqueos', icon: CalendarOff },
];

export default function StaffPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('perfil');
  const [creating, setCreating] = useState(false);

  const staffQuery = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.staff.list(),
  });
  const businessQuery = useQuery({
    queryKey: ['business'],
    queryFn: () => api.business.get(),
  });
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => api.services.list(),
  });

  const staff = staffQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const timezone =
    businessQuery.data?.timezone ?? 'America/Argentina/Buenos_Aires';

  const resolvedId =
    selectedId && staff.some((member) => member.id === selectedId)
      ? selectedId
      : (staff[0]?.id ?? null);
  const selected = staff.find((member) => member.id === resolvedId) ?? null;

  return (
    <>
      <PageHeader
        title="Equipo"
        description="Profesionales, servicios que atienden, horario semanal y bloqueos."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Nuevo integrante
          </Button>
        }
      />

      {staffQuery.error ? (
        <ErrorBanner
          message={
            staffQuery.error instanceof Error
              ? staffQuery.error.message
              : 'No pudimos cargar el equipo.'
          }
        />
      ) : null}

      {staffQuery.isLoading ? (
        <Card className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500">
          <Spinner />
          Cargando equipo…
        </Card>
      ) : staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tu equipo está vacío"
          description="Agregá a las personas que atienden turnos y asignales sus servicios."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Agregar integrante
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-start">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3 text-xs font-medium tracking-wide text-slate-500 uppercase">
              {staff.length} integrantes
            </div>
            <ul className="divide-y divide-slate-100">
              {staff.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(member.id);
                      setTab('perfil');
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      member.id === resolvedId
                        ? 'bg-indigo-50/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {initials(member.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {member.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {member.services.length} servicios
                      </span>
                    </span>
                    {member.active ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {selected ? (
            <div className="space-y-4">
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                      {initials(selected.name)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">
                          {selected.name}
                        </h2>
                        {selected.active ? (
                          <Badge tone="success">Activo</Badge>
                        ) : (
                          <Badge tone="neutral">Inactivo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {selected.services.length > 0
                          ? selected.services
                              .map((service) => service.name)
                              .join(' · ')
                          : 'Sin servicios asignados'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2">
                  {TABS.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          tab === item.id
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {tab === 'perfil' ? (
                <ProfileTab key={selected.id} member={selected} />
              ) : null}
              {tab === 'servicios' ? (
                <ServicesTab
                  key={`${selected.id}-${selected.updatedAt}`}
                  member={selected}
                  services={services}
                />
              ) : null}
              {tab === 'horarios' ? (
                <HoursTab key={selected.id} member={selected} />
              ) : null}
              {tab === 'bloqueos' ? (
                <TimeBlocksTab
                  key={selected.id}
                  member={selected}
                  timezone={timezone}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {creating ? (
        <StaffFormModal
          member={null}
          onClose={() => setCreating(false)}
          onSaved={(member) => {
            setSelectedId(member.id);
            setTab('perfil');
          }}
        />
      ) : null}
    </>
  );
}

function ProfileTab({ member }: { member: StaffMember }) {
  const queryClient = useQueryClient();
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: { name: member.name, active: member.active },
  });

  const update = useMutation({
    mutationFn: (values: StaffFormValues) =>
      api.staff.update(member.id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });

  const deactivate = useMutation({
    mutationFn: () => api.staff.deactivate(member.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  function handleDeactivate() {
    const confirmed = window.confirm(
      `¿Desactivar a ${member.name}? No se borra, pero deja de recibir turnos.`,
    );

    if (confirmed) {
      deactivate.mutate();
    }
  }

  return (
    <Card>
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Perfil</h3>
        <p className="text-xs text-slate-500">
          Nombre visible y estado del integrante.
        </p>
      </div>
      <form
        onSubmit={form.handleSubmit((values) => update.mutate(values))}
        className="space-y-4 px-5 py-5"
      >
        {update.isSuccess ? (
          <SuccessBanner message="Perfil actualizado." />
        ) : null}
        {update.error ? (
          <ErrorBanner
            message={
              update.error instanceof Error
                ? update.error.message
                : 'No pudimos actualizar el perfil.'
            }
          />
        ) : null}
        {deactivate.error ? (
          <ErrorBanner
            message={
              deactivate.error instanceof Error
                ? deactivate.error.message
                : 'No pudimos desactivar al integrante.'
            }
          />
        ) : null}

        <Field
          label="Nombre"
          htmlFor="staff-name"
          error={form.formState.errors.name?.message}
        >
          <Input id="staff-name" {...form.register('name')} />
        </Field>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            {...form.register('active')}
          />
          Activo (puede recibir turnos)
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="danger"
            onClick={handleDeactivate}
            loading={deactivate.isPending}
            disabled={!member.active}
          >
            <Trash2 className="h-4 w-4" />
            Desactivar
          </Button>
          <Button type="submit" loading={update.isPending}>
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ServicesTab({
  member,
  services,
}: {
  member: StaffMember;
  services: Service[];
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(
    member.services.map((service) => service.id),
  );

  const sorted = useMemo(
    () =>
      [...services].sort((left, right) => {
        if (left.active !== right.active) {
          return left.active ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      }),
    [services],
  );

  const save = useMutation({
    mutationFn: () => api.staff.setServices(member.id, selected),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  function toggle(serviceId: string) {
    setSelected((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  return (
    <Card>
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Servicios</h3>
        <p className="text-xs text-slate-500">
          Solo los servicios marcados aparecen como disponibles para esta
          persona.
        </p>
      </div>
      <div className="space-y-4 px-5 py-5">
        {save.isSuccess ? (
          <SuccessBanner message="Servicios actualizados." />
        ) : null}
        {save.error ? (
          <ErrorBanner
            message={
              save.error instanceof Error
                ? save.error.message
                : 'No pudimos actualizar los servicios.'
            }
          />
        ) : null}

        {sorted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Primero creá servicios en la sección Servicios.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {sorted.map((service) => (
              <li key={service.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition hover:border-slate-300 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selected.includes(service.id)}
                    onChange={() => toggle(service.id)}
                  />
                  <span className="min-w-0 flex-1 truncate text-slate-900">
                    {service.name}
                  </span>
                  {!service.active ? (
                    <Badge tone="neutral">Inactivo</Badge>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => save.mutate()}
            loading={save.isPending}
          >
            <Save className="h-4 w-4" />
            Guardar servicios
          </Button>
        </div>
      </div>
    </Card>
  );
}

type Range = { startTime: string; endTime: string };
type Draft = Record<number, Range[]>;

function emptyDraft(): Draft {
  return Object.fromEntries(WEEKDAYS.map((day) => [day.value, [] as Range[]]));
}

function draftFromHours(
  hours: Array<{ weekday: number; startTime: string; endTime: string }>,
): Draft {
  const next = emptyDraft();

  for (const hour of hours) {
    const ranges = next[hour.weekday] ?? [];
    ranges.push({
      startTime: hour.startTime.slice(0, 5),
      endTime: hour.endTime.slice(0, 5),
    });
    next[hour.weekday] = ranges;
  }

  return next;
}

function HoursTab({ member }: { member: StaffMember }) {
  const queryClient = useQueryClient();
  const [draftState, setDraftState] = useState<Draft | null>(null);

  const hoursQuery = useQuery({
    queryKey: ['staff', member.id, 'working-hours'],
    queryFn: () => api.staff.getWorkingHours(member.id),
  });

  const draft = draftState ?? draftFromHours(hoursQuery.data?.hours ?? []);

  const save = useMutation({
    mutationFn: () =>
      api.staff.replaceWorkingHours(
        member.id,
        WEEKDAYS.flatMap((day) =>
          (draft[day.value] ?? []).map((range) => ({
            weekday: day.value,
            startTime: range.startTime,
            endTime: range.endTime,
          })),
        ),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staff', member.id, 'working-hours'],
      });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  function addRange(weekday: number) {
    setDraftState((current) => {
      const base = current ?? draft;

      return {
        ...base,
        [weekday]: [
          ...(base[weekday] ?? []),
          { startTime: '09:00', endTime: '18:00' },
        ],
      };
    });
  }

  function removeRange(weekday: number, index: number) {
    setDraftState((current) => {
      const base = current ?? draft;

      return {
        ...base,
        [weekday]: (base[weekday] ?? []).filter(
          (_, position) => position !== index,
        ),
      };
    });
  }

  function updateRange(
    weekday: number,
    index: number,
    field: keyof Range,
    value: string,
  ) {
    setDraftState((current) => {
      const base = current ?? draft;

      return {
        ...base,
        [weekday]: (base[weekday] ?? []).map((range, position) =>
          position === index ? { ...range, [field]: value } : range,
        ),
      };
    });
  }

  return (
    <Card>
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Horario semanal
        </h3>
        <p className="text-xs text-slate-500">
          Franjas en la zona horaria del negocio. Podés cargar varias por día.
        </p>
      </div>
      <div className="space-y-4 px-5 py-5">
        {save.isSuccess ? <SuccessBanner message="Horario guardado." /> : null}
        {save.error ? (
          <ErrorBanner
            message={
              save.error instanceof Error
                ? save.error.message
                : 'No pudimos guardar el horario.'
            }
          />
        ) : null}

        {hoursQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="h-4 w-4" />
            Cargando horario…
          </div>
        ) : hoursQuery.error ? (
          <ErrorBanner
            message={
              hoursQuery.error instanceof Error
                ? hoursQuery.error.message
                : 'No pudimos cargar el horario.'
            }
          />
        ) : (
          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const ranges = draft[day.value] ?? [];

              return (
                <div
                  key={day.value}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {day.label}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => addRange(day.value)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Franja
                    </Button>
                  </div>

                  {ranges.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Sin atención este día.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {ranges.map((range, index) => (
                        <div
                          key={`${day.value}-${index}`}
                          className="flex items-center gap-2"
                        >
                          <Input
                            type="time"
                            value={range.startTime}
                            onChange={(event) =>
                              updateRange(
                                day.value,
                                index,
                                'startTime',
                                event.target.value,
                              )
                            }
                            className="h-9 w-32"
                            aria-label={`Inicio ${day.label}`}
                          />
                          <span className="text-sm text-slate-400">a</span>
                          <Input
                            type="time"
                            value={range.endTime}
                            onChange={(event) =>
                              updateRange(
                                day.value,
                                index,
                                'endTime',
                                event.target.value,
                              )
                            }
                            className="h-9 w-32"
                            aria-label={`Fin ${day.label}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeRange(day.value, index)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Quitar franja de ${day.label}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => save.mutate()}
            loading={save.isPending}
            disabled={hoursQuery.isLoading}
          >
            <Save className="h-4 w-4" />
            Guardar horario
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TimeBlocksTab({
  member,
  timezone,
}: {
  member: StaffMember;
  timezone: string;
}) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const blocksQuery = useQuery({
    queryKey: ['staff', member.id, 'time-blocks'],
    queryFn: () => api.staff.listTimeBlocks(member.id),
  });

  const remove = useMutation({
    mutationFn: (blockId: string) =>
      api.staff.deleteTimeBlock(member.id, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staff', member.id, 'time-blocks'],
      });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const blocks = [...(blocksQuery.data ?? [])].sort((left, right) =>
    left.startsAt.localeCompare(right.startsAt),
  );

  function handleDelete(blockId: string, label: string) {
    const confirmed = window.confirm(`¿Eliminar el bloqueo ${label}?`);

    if (confirmed) {
      remove.mutate(blockId);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Bloqueos</h3>
          <p className="text-xs text-slate-500">
            Vacaciones, descansos o compromisos fuera del sistema.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Nuevo bloqueo
        </Button>
      </div>
      <div className="space-y-3 px-5 py-5">
        {remove.error ? (
          <ErrorBanner
            message={
              remove.error instanceof Error
                ? remove.error.message
                : 'No pudimos eliminar el bloqueo.'
            }
          />
        ) : null}

        {blocksQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="h-4 w-4" />
            Cargando bloqueos…
          </div>
        ) : blocksQuery.error ? (
          <ErrorBanner
            message={
              blocksQuery.error instanceof Error
                ? blocksQuery.error.message
                : 'No pudimos cargar los bloqueos.'
            }
          />
        ) : blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            No hay bloqueos cargados.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {blocks.map((block) => {
              const label = formatDateTimeInZone(block.startsAt, timezone);

              return (
                <li
                  key={block.id}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {label}
                    </p>
                    <p className="text-xs text-slate-500">
                      Hasta {formatDateTimeInZone(block.endsAt, timezone)}
                      {block.reason ? ` · ${block.reason}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(block.id, label)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Eliminar bloqueo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {creating ? (
        <TimeBlockFormModal
          member={member}
          timezone={timezone}
          onClose={() => setCreating(false)}
        />
      ) : null}
    </Card>
  );
}

function TimeBlockFormModal({
  member,
  timezone,
  onClose,
}: {
  member: StaffMember;
  timezone: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const today = todayKeyInZone(timezone);

  const form = useForm<TimeBlockFormValues>({
    resolver: zodResolver(timeBlockFormSchema),
    defaultValues: {
      startsAt: `${today}T09:00`,
      endsAt: `${today}T13:00`,
      reason: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: TimeBlockFormValues) =>
      api.staff.createTimeBlock(member.id, {
        startsAt: localDateTimeToIso(values.startsAt, timezone),
        endsAt: localDateTimeToIso(values.endsAt, timezone),
        reason: values.reason ? values.reason : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['staff', member.id, 'time-blocks'],
      });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      onClose();
    },
  });

  return (
    <Modal
      open
      title="Nuevo bloqueo"
      description={`Horario local de ${timezone}.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="time-block-form"
            loading={mutation.isPending}
          >
            Crear bloqueo
          </Button>
        </>
      }
    >
      <form
        id="time-block-form"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        {mutation.error ? (
          <ErrorBanner
            message={
              mutation.error instanceof Error
                ? mutation.error.message
                : 'No pudimos crear el bloqueo.'
            }
          />
        ) : null}

        <Field
          label="Desde"
          htmlFor="block-start"
          error={form.formState.errors.startsAt?.message}
        >
          <Input
            id="block-start"
            type="datetime-local"
            {...form.register('startsAt')}
          />
        </Field>

        <Field
          label="Hasta"
          htmlFor="block-end"
          error={form.formState.errors.endsAt?.message}
        >
          <Input
            id="block-end"
            type="datetime-local"
            {...form.register('endsAt')}
          />
        </Field>

        <Field
          label="Motivo"
          htmlFor="block-reason"
          hint="Opcional."
          error={form.formState.errors.reason?.message}
        >
          <Input
            id="block-reason"
            placeholder="Vacaciones"
            {...form.register('reason')}
          />
        </Field>
      </form>
    </Modal>
  );
}

function StaffFormModal({
  member,
  onClose,
  onSaved,
}: {
  member: StaffMember | null;
  onClose: () => void;
  onSaved?: (member: StaffMember) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: member?.name ?? '',
      active: member?.active ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: StaffFormValues) =>
      member ? api.staff.update(member.id, values) : api.staff.create(values),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      onSaved?.(saved);
      onClose();
    },
  });

  return (
    <Modal
      open
      title={member ? 'Editar integrante' : 'Nuevo integrante'}
      description={
        member
          ? 'Actualizá el nombre o el estado.'
          : 'Agregá una persona al equipo.'
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="staff-form" loading={mutation.isPending}>
            {member ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </>
      }
    >
      <form
        id="staff-form"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        {mutation.error ? (
          <ErrorBanner
            message={
              mutation.error instanceof Error
                ? mutation.error.message
                : 'No pudimos guardar al integrante.'
            }
          />
        ) : null}

        <Field
          label="Nombre"
          htmlFor="staff-modal-name"
          error={form.formState.errors.name?.message}
        >
          <Input
            id="staff-modal-name"
            placeholder="Ana Pérez"
            {...form.register('name')}
          />
        </Field>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            {...form.register('active')}
          />
          Activo (puede recibir turnos)
        </label>
      </form>
    </Modal>
  );
}
