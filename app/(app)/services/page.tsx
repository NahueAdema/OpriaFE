'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock3, Pencil, Plus, Scissors, Sparkles, Trash2, MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { serviceFormSchema, type ServiceFormValues } from '@/lib/schemas';
import type { Service } from '@/lib/types';
import { centsToMoneyInput, formatMoney, moneyToCents } from '@/lib/utils';
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
  WakingUpHint,
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

  const toggleActive = useMutation<unknown, Error, Service>({
    mutationFn: (service: Service) => {
      if (service.active) {
        return api.services.deactivate(service.id);
      }
      return api.services.update(service.id, {
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
        priceCents: service.priceCents,
        depositType: service.depositType,
        depositValue: service.depositValue,
        active: true,
      });
    },
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
      <div className="section-title-row">
        <div>
          <div className="eyebrow">LO QUE OFRECÉS</div>
          <h1>Tus servicios</h1>
          <p>Creá y organizá los servicios que tus clientes pueden reservar.</p>
        </div>
        <div className="title-action">
          <button
            type="button"
            className="button button-primary"
            onClick={() => setEditing({ service: null })}
          >
            <Plus size={17} />
            Agregar servicio
          </button>
        </div>
      </div>

      {deactivate.error ? (
        <ErrorBanner
          message={deactivate.error instanceof Error ? deactivate.error.message : 'No pudimos desactivar el servicio.'}
        />
      ) : null}

      <div className="service-summary">
        <div>
          <span className="service-summary-icon">
            <Scissors size={18} />
          </span>
          <div>
            <strong>{services.length} servicios</strong>
            <small>en tu menú de reservas</small>
          </div>
        </div>
        <span className="active-service-count">
          <i /> {activeCount} activos
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`filter-button ${filter === option.value ? 'settings-tab active' : ''}`}
            style={filter === option.value ? { borderColor: 'var(--primary)', color: 'var(--primary-hover)' } : {}}
          >
            {option.label}
          </button>
        ))}
      </div>

      {servicesQuery.isLoading ? (
        <div className="form-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, color: 'var(--text-secondary)', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Spinner /> Cargando servicios…
          </div>
          <WakingUpHint />
        </div>
      ) : servicesQuery.error ? (
        <ErrorBanner
          message={servicesQuery.error instanceof Error ? servicesQuery.error.message : 'No pudimos cargar los servicios.'}
        />
      ) : services.length === 0 ? (
        <div className="form-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Todavía no hay servicios. Creá tu primer servicio para que tus clientes puedan reservar.</p>
          <button type="button" className="button button-primary" onClick={() => setEditing({ service: null })}>
            <Plus size={17} /> Crear servicio
          </button>
        </div>
      ) : (
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.id} style={{ opacity: service.active ? 1 : 0.7 }}>
              <div className="service-card-top">
                <div className="service-symbol" style={{ background: 'var(--accent-soft)', color: 'var(--primary)' }}>
                  <Scissors size={19} />
                </div>
                <button
                  type="button"
                  className="round-more"
                  aria-label={`Opciones para ${service.name}`}
                  onClick={() => setEditing({ service })}
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <span className="service-category">{service.description ? service.description.slice(0, 24) : 'General'}</span>
              <h2>{service.name}</h2>
              <div className="service-metadata">
                <span>
                  <Clock3 size={14} />
                  {service.durationMinutes} min
                  {service.bufferMinutes > 0 ? ` + ${service.bufferMinutes}` : ''}
                </span>
                <strong>$ {formatMoney(service.priceCents)}</strong>
              </div>
              <div className="service-card-bottom">
                <span className={service.active ? 'active-badge' : 'inactive-badge'}>
                  {service.active ? 'Activo' : 'Pausado'}
                </span>
                <button
                  type="button"
                  className={`toggle ${service.active ? 'toggle-on' : ''}`}
                  aria-label={service.active ? 'Pausar servicio' : 'Activar servicio'}
                  onClick={() => toggleActive.mutate(service)}
                  disabled={toggleActive.isPending}
                >
                  <i />
                </button>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>{depositLabel(service)}</span>
                <button
                  type="button"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }} className="text-error"
                  onClick={() => handleDeactivate(service)}
                  disabled={!service.active}
                >
                  Desactivar
                </button>
              </div>
            </article>
          ))}
          <button className="add-service-card" onClick={() => setEditing({ service: null })}>
            <span>
              <Plus size={21} />
            </span>
            <strong>Agregar otro servicio</strong>
            <small>Sumá una nueva opción a tu menú</small>
          </button>
        </div>
      )}

      <div className="tip-card">
        <Sparkles size={16} />
        <span>
          <strong>Tip:</strong> Los servicios activos son los que tus clientes ven al reservar. Podés pausar los que no estés ofreciendo.
        </span>
      </div>

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

        <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary focus:ring-accent-soft"
            {...form.register('active')}
          />
          Servicio activo (visible para reservar)
        </label>
      </form>
    </Modal>
  );
}
