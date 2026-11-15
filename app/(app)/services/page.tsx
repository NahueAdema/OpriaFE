'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock3, Pencil, Plus, Scissors, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { serviceFormSchema, type ServiceFormValues } from '@/lib/schemas';
import type { Service } from '@/lib/types';
import { centsToMoneyInput, formatMoney, moneyToCents } from '@/lib/utils';
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
  Select,
  Spinner,
  Textarea,
} from '@/components/ui';

type Filter = 'all' | 'active' | 'inactive';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

function depositLabel(service: Service): string {
  if (service.depositType === 'none') {
    return 'Sin seña';
  }

  if (service.depositType === 'fixed') {
    return `Seña $ ${formatMoney(service.depositValue)}`;
  }

  return `Seña ${service.depositValue}%`;
}

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<{ service: Service | null } | null>(
    null,
  );

  const servicesQuery = useQuery({
    queryKey: ['services', filter],
    queryFn: () =>
      api.services.list(filter === 'all' ? undefined : filter === 'active'),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.services.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const services = servicesQuery.data ?? [];
  const activeCount = services.filter((service) => service.active).length;

  function handleDeactivate(service: Service) {
    const confirmed = window.confirm(
      `¿Desactivar "${service.name}"? Dejará de ofrecerse, pero no se borra.`,
    );

    if (confirmed) {
      deactivate.mutate(service.id);
    }
  }

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Definí qué ofrece el negocio, cuánto dura, cuánto sale y qué seña pide."
        action={
          <Button onClick={() => setEditing({ service: null })}>
            <Plus className="h-4 w-4" />
            Nuevo servicio
          </Button>
        }
      />

      {deactivate.error ? (
        <ErrorBanner
          message={
            deactivate.error instanceof Error
              ? deactivate.error.message
              : 'No pudimos desactivar el servicio.'
          }
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              filter === option.value
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          {services.length} servicios · {activeCount} activos
        </span>
      </div>

      {servicesQuery.isLoading ? (
        <Card className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500">
          <Spinner />
          Cargando servicios…
        </Card>
      ) : servicesQuery.error ? (
        <ErrorBanner
          message={
            servicesQuery.error instanceof Error
              ? servicesQuery.error.message
              : 'No pudimos cargar los servicios.'
          }
        />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Todavía no hay servicios"
          description="Creá tu primer servicio para que tus clientes puedan reservar."
          action={
            <Button onClick={() => setEditing({ service: null })}>
              <Plus className="h-4 w-4" />
              Crear servicio
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <Card
              key={service.id}
              className={service.active ? '' : 'opacity-70'}
            >
              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-slate-900">
                      {service.name}
                    </h2>
                    {service.active ? (
                      <Badge tone="success">Activo</Badge>
                    ) : (
                      <Badge tone="neutral">Inactivo</Badge>
                    )}
                  </div>
                  {service.description ? (
                    <p className="line-clamp-2 text-sm text-slate-500">
                      {service.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing({ service })}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Editar ${service.name}`}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {service.active ? (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(service)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Desactivar ${service.name}`}
                      title="Desactivar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 px-5 py-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Clock3 className="h-4 w-4 text-slate-400" />
                  {service.durationMinutes} min
                  {service.bufferMinutes > 0
                    ? ` + ${service.bufferMinutes} min buffer`
                    : ''}
                </span>
                <span className="font-medium text-slate-900">
                  $ {formatMoney(service.priceCents)}
                </span>
                <Badge
                  tone={service.depositType === 'none' ? 'neutral' : 'info'}
                >
                  {depositLabel(service)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing ? (
        <ServiceFormModal
          service={editing.service}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function ServiceFormModal({
  service,
  onClose,
}: {
  service: Service | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      durationMinutes: service?.durationMinutes ?? 30,
      bufferMinutes: service?.bufferMinutes ?? 0,
      price: centsToMoneyInput(service?.priceCents ?? 0),
      depositType: service?.depositType ?? 'none',
      depositValue:
        service?.depositType === 'fixed'
          ? centsToMoneyInput(service.depositValue)
          : service?.depositType === 'percentage'
            ? String(service.depositValue)
            : '',
      active: service?.active ?? true,
    },
  });

  const depositType = form.watch('depositType');

  const mutation = useMutation({
    mutationFn: (values: ServiceFormValues) => {
      const payload = {
        name: values.name,
        description: values.description ? values.description : null,
        durationMinutes: values.durationMinutes,
        bufferMinutes: values.bufferMinutes,
        priceCents: moneyToCents(values.price),
        depositType: values.depositType,
        depositValue:
          values.depositType === 'none'
            ? 0
            : values.depositType === 'fixed'
              ? moneyToCents(values.depositValue)
              : Math.round(Number(values.depositValue)),
        active: values.active,
      };

      return service
        ? api.services.update(service.id, payload)
        : api.services.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      onClose();
    },
  });

  return (
    <Modal
      open
      wide
      title={service ? 'Editar servicio' : 'Nuevo servicio'}
      description={
        service
          ? 'Actualizá los datos del servicio.'
          : 'Completá los datos para ofrecer un nuevo servicio.'
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="service-form"
            loading={mutation.isPending}
          >
            {service ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </>
      }
    >
      <form
        id="service-form"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        {mutation.error ? (
          <ErrorBanner
            message={
              mutation.error instanceof Error
                ? mutation.error.message
                : 'No pudimos guardar el servicio.'
            }
          />
        ) : null}

        <Field
          label="Nombre"
          htmlFor="service-name"
          error={form.formState.errors.name?.message}
        >
          <Input
            id="service-name"
            placeholder="Corte de pelo"
            {...form.register('name')}
          />
        </Field>

        <Field
          label="Descripción"
          htmlFor="service-description"
          error={form.formState.errors.description?.message}
        >
          <Textarea
            id="service-description"
            rows={3}
            placeholder="Detalle opcional del servicio."
            {...form.register('description')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Duración (minutos)"
            htmlFor="service-duration"
            error={form.formState.errors.durationMinutes?.message}
          >
            <Input
              id="service-duration"
              type="number"
              min={5}
              max={1440}
              {...form.register('durationMinutes', { valueAsNumber: true })}
            />
          </Field>

          <Field
            label="Buffer (minutos)"
            htmlFor="service-buffer"
            hint="Tiempo libre antes y después del turno."
            error={form.formState.errors.bufferMinutes?.message}
          >
            <Input
              id="service-buffer"
              type="number"
              min={0}
              max={240}
              {...form.register('bufferMinutes', { valueAsNumber: true })}
            />
          </Field>

          <Field
            label="Precio"
            htmlFor="service-price"
            hint="En pesos, con decimales."
            error={form.formState.errors.price?.message}
          >
            <Input
              id="service-price"
              inputMode="decimal"
              placeholder="15000.00"
              {...form.register('price')}
            />
          </Field>

          <Field
            label="Tipo de seña"
            htmlFor="service-deposit-type"
            error={form.formState.errors.depositType?.message}
          >
            <Select id="service-deposit-type" {...form.register('depositType')}>
              <option value="none">Sin seña</option>
              <option value="fixed">Monto fijo</option>
              <option value="percentage">Porcentaje</option>
            </Select>
          </Field>

          <Field
            label={
              depositType === 'percentage'
                ? 'Seña (%)'
                : depositType === 'fixed'
                  ? 'Seña ($)'
                  : 'Seña'
            }
            htmlFor="service-deposit-value"
            hint={
              depositType === 'none'
                ? 'Este servicio no pide seña.'
                : depositType === 'percentage'
                  ? 'Entre 0 y 100.'
                  : 'No puede superar el precio.'
            }
            error={form.formState.errors.depositValue?.message}
          >
            <Input
              id="service-deposit-value"
              type={depositType === 'percentage' ? 'number' : 'text'}
              inputMode="decimal"
              min={depositType === 'percentage' ? 0 : undefined}
              max={depositType === 'percentage' ? 100 : undefined}
              disabled={depositType === 'none'}
              placeholder={depositType === 'percentage' ? '30' : '5000.00'}
              {...form.register('depositValue')}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            {...form.register('active')}
          />
          Servicio activo (visible para reservar)
        </label>
      </form>
    </Modal>
  );
}
