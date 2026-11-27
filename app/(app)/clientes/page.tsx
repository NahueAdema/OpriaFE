'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Download, Search, UserRound } from 'lucide-react';
import { ApiError, api } from '@/lib/api';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
} from '@/lib/appointments';
import {
  customerFileFormSchema,
  type CustomerFileFormValues,
} from '@/lib/schemas';
import type { PanelCustomer } from '@/lib/types';
import { formatDateInZone, formatDateTimeInZone } from '@/lib/utils';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  Modal,
  Spinner,
  SuccessBanner,
  Textarea,
  WakingUpHint,
} from '@/components/ui';

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState<PanelCustomer | null>(null);

  const businessQuery = useQuery({
    queryKey: ['business'],
    queryFn: () => api.business.get(),
  });
  const timezone = businessQuery.data?.timezone ?? DEFAULT_TIMEZONE;

  const customersQuery = useQuery({
    queryKey: ['customers', term],
    queryFn: () => api.customers.list({ q: term, limit: 200 }),
  });

  const customers = customersQuery.data?.items ?? [];

  const exportMutation = useMutation({
    mutationFn: () => api.customers.export({ q: term }),
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'clientes.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    },
  });

  const detailQuery = useQuery({
    queryKey: ['customers', 'detail', selected?.phone],
    queryFn: () => api.customers.detail(selected!.phone),
    enabled: Boolean(selected),
  });

  const form = useForm<CustomerFileFormValues>({
    resolver: zodResolver(customerFileFormSchema),
    defaultValues: { name: '', email: '', notes: '', consent: false },
  });

  const detail = detailQuery.data;

  const updateMutation = useMutation({
    mutationFn: (values: CustomerFileFormValues) =>
      api.customers.update(selected!.phone, {
        name: values.name,
        email: values.email || undefined,
        notes: values.notes,
        consent: values.consent,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['customers', 'detail'] }),
      ]);
      form.reset(form.getValues());
    },
  });

  function openCustomer(customer: PanelCustomer) {
    setSelected(customer);
    form.reset({
      name: customer.name,
      email: customer.email ?? '',
      notes: customer.notes ?? '',
      consent: Boolean(customer.consentAt),
    });
  }

  const exportError =
    exportMutation.error instanceof ApiError
      ? exportMutation.error.message
      : null;
  const updateError =
    updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : null;

  return (
    <>
      <div className="section-title-row">
        <div>
          <div className="eyebrow">BASE DE CLIENTES</div>
          <h1>Clientes</h1>
          <p>Consultá el historial, guardá notas y gestioná el consentimiento.</p>
        </div>
        <div className="title-action">
          <Button
            type="button"
            variant="secondary"
            loading={exportMutation.isPending}
            onClick={() => exportMutation.mutate()}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {customersQuery.error ? (
        <ErrorBanner
          message={
            customersQuery.error instanceof Error
              ? customersQuery.error.message
              : 'No pudimos cargar los clientes.'
          }
        />
      ) : null}
      {exportError ? <ErrorBanner message={exportError} /> : null}

      <Card className="overflow-hidden">
        <form
          className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            setTerm(search.trim());
          }}
          role="search"
        >
          <label htmlFor="customer-search" className="sr-only">
            Buscar cliente
          </label>
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
            <Input
              id="customer-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, teléfono o email"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
          {term ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setTerm('');
                setSearch('');
              }}
            >
              Limpiar
            </Button>
          ) : null}
        </form>

        {customersQuery.isLoading ? (
          <div className="flex items-center gap-2 px-5 py-8 text-sm text-subtle-foreground">
            <Spinner className="h-4 w-4" />
            Cargando clientes…
            <WakingUpHint />
          </div>
        ) : customers.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              icon={UserRound}
              title="Sin clientes"
              description="Cuando se registre un turno, el cliente va a aparecer acá."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Clientes del negocio con cantidad de turnos y último turno
              </caption>
              <thead className="bg-background text-xs uppercase text-subtle-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Cliente</th>
                  <th scope="col" className="px-5 py-3 font-medium">Teléfono</th>
                  <th scope="col" className="px-5 py-3 font-medium">Turnos</th>
                  <th scope="col" className="px-5 py-3 font-medium">Último turno</th>
                  <th scope="col" className="px-5 py-3 font-medium">Consentimiento</th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr key={customer.phone} className="hover:bg-background">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{customer.name}</p>
                      {customer.email ? (
                        <p className="text-xs text-subtle-foreground">{customer.email}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-subtle-foreground">{customer.phone}</td>
                    <td className="px-5 py-3 text-foreground">{customer.appointmentCount}</td>
                    <td className="px-5 py-3 text-subtle-foreground">
                      {customer.lastAppointmentAt
                        ? formatDateInZone(customer.lastAppointmentAt, timezone)
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {customer.consentAt ? (
                        <Badge tone="success">Autorizado</Badge>
                      ) : (
                        <Badge tone="neutral">Sin consentimiento</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => openCustomer(customer)}
                      >
                        Ver ficha
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        title={detail?.name ?? selected?.name ?? 'Cliente'}
        description={selected?.phone}
        onClose={() => {
          setSelected(null);
          updateMutation.reset();
        }}
        wide
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelected(null)}
              disabled={updateMutation.isPending}
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              form="customer-file-form"
              loading={updateMutation.isPending}
            >
              Guardar cambios
            </Button>
          </>
        }
      >
        {detailQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-subtle-foreground">
            <Spinner className="h-4 w-4" />
            Cargando ficha…
          </div>
        ) : detailQuery.error ? (
          <ErrorBanner message="No pudimos cargar la ficha del cliente." />
        ) : (
          <form
            id="customer-file-form"
            onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
            className="space-y-5"
            noValidate
          >
            {detail ? (
              <dl className="grid gap-2 rounded-xl bg-background px-3 py-2 text-xs text-subtle-foreground sm:grid-cols-3">
                <div>
                  <dt>Turnos</dt>
                  <dd className="font-medium text-foreground">{detail.appointmentCount}</dd>
                </div>
                <div>
                  <dt>Último turno</dt>
                  <dd className="font-medium text-foreground">
                    {detail.lastAppointmentAt
                      ? formatDateTimeInZone(detail.lastAppointmentAt, timezone)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Consentimiento</dt>
                  <dd className="font-medium text-foreground">
                    {detail.consentAt
                      ? formatDateInZone(detail.consentAt, timezone)
                      : 'Sin registrar'}
                  </dd>
                </div>
              </dl>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} autoComplete="name" />
              </Field>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" {...form.register('email')} autoComplete="email" />
              </Field>
            </div>

            <Field
              label="Notas internas"
              hint="Solo las ve el equipo del negocio."
              error={form.formState.errors.notes?.message}
            >
              <Textarea {...form.register('notes')} rows={3} />
            </Field>

            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                {...form.register('consent')}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              El cliente autorizó recibir comunicaciones del negocio.
            </label>

            {detail && detail.history.length > 0 ? (
              <section aria-labelledby="customer-history-title">
                <h3 id="customer-history-title" className="mb-2 text-sm font-semibold text-foreground">
                  Historial de turnos
                </h3>
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {detail.history.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-xs"
                    >
                      <span className="flex items-center gap-2 text-foreground">
                        <CalendarDays className="h-3.5 w-3.5 text-subtle-foreground" />
                        {formatDateTimeInZone(entry.startsAt, timezone)}
                      </span>
                      <span className="flex items-center gap-2 text-subtle-foreground">
                        {entry.serviceName} · {entry.staffName}
                        <Badge tone={APPOINTMENT_STATUS_TONES[entry.status]}>
                          {APPOINTMENT_STATUS_LABELS[entry.status]}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {updateMutation.isSuccess ? (
              <SuccessBanner message="Los cambios se guardaron correctamente." />
            ) : null}
            {updateError ? <ErrorBanner message={updateError} /> : null}
          </form>
        )}
      </Modal>
    </>
  );
}
