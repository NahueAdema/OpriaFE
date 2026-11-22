'use client';

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { ErrorBanner, SuccessBanner, WakingUpHint } from '@/components/ui';
import { api } from '@/lib/api';
import { businessFormSchema, type BusinessFormValues } from '@/lib/schemas';
import { TIMEZONES } from '@/lib/utils';

const DEFAULTS: BusinessFormValues = {
  name: '',
  slug: '',
  timezone: 'America/Argentina/Buenos_Aires',
  logoUrl: '',
  address: '',
  city: '',
  contactEmail: '',
  contactPhone: '',
  cancellationHours: 24,
  cancellationDepositPolicy: 'retain',
  bookingMinAdvanceMinutes: 120,
  bookingMaxAdvanceDays: 90,
};

export default function BusinessPage() {
  const queryClient = useQueryClient();
  const businessQuery = useQuery({
    queryKey: ['business'],
    queryFn: () => api.business.get(),
  });

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    const business = businessQuery.data;

    if (!business) {
      return;
    }

    form.reset({
      name: business.name,
      slug: business.slug,
      timezone: business.timezone,
      logoUrl: business.logoUrl ?? '',
      address: business.address ?? '',
      city: business.city ?? '',
      contactEmail: business.contactEmail ?? '',
      contactPhone: business.contactPhone ?? '',
      cancellationHours: business.cancellationHours,
      cancellationDepositPolicy: business.cancellationDepositPolicy,
      bookingMinAdvanceMinutes: business.bookingMinAdvanceMinutes,
      bookingMaxAdvanceDays: business.bookingMaxAdvanceDays,
    });
  }, [businessQuery.data, form]);

  const timezoneOptions = useMemo(() => {
    const current = businessQuery.data?.timezone;
    const values = new Set(TIMEZONES);

    if (current) {
      values.add(current);
    }

    return [...values];
  }, [businessQuery.data?.timezone]);

  const mutation = useMutation({
    mutationFn: (values: BusinessFormValues) =>
      api.business.update({
        name: values.name,
        slug: values.slug,
        timezone: values.timezone,
        logoUrl: values.logoUrl ? values.logoUrl : null,
        address: values.address ? values.address : null,
        city: values.city ? values.city : null,
        contactEmail: values.contactEmail ? values.contactEmail : null,
        contactPhone: values.contactPhone ? values.contactPhone : null,
        cancellationHours: values.cancellationHours,
        cancellationDepositPolicy: values.cancellationDepositPolicy,
        bookingMinAdvanceMinutes: values.bookingMinAdvanceMinutes,
        bookingMaxAdvanceDays: values.bookingMaxAdvanceDays,
      }),
    onSuccess: (business) => {
      queryClient.setQueryData(['business'], business);
      queryClient.invalidateQueries({ queryKey: ['business'] });
    },
  });

  if (businessQuery.isLoading) {
    return (
      <div className="form-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, color: 'var(--text-secondary)', fontSize: 11 }}>
        <span className="button button-secondary" style={{ pointerEvents: 'none' }}>Cargando…</span>
        <WakingUpHint />
      </div>
    );
  }

  if (businessQuery.error) {
    return (
      <ErrorBanner
        message={businessQuery.error instanceof Error ? businessQuery.error.message : 'No pudimos cargar la configuración.'}
      />
    );
  }

  const business = businessQuery.data!;
  const errors = form.formState.errors;

  return (
    <>
      <div className="section-title-row">
        <div>
          <div className="eyebrow">TU MARCA, TU ESPACIO</div>
          <h1>Negocio</h1>
          <p>Personalizá la experiencia que ven tus clientes.</p>
        </div>
        <div className="title-action">
          <button
            type="submit"
            form="business-form"
            className="button button-primary"
            disabled={mutation.isPending}
          >
            <Save size={16} />
            {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {mutation.isSuccess ? (
        <SuccessBanner message="Configuración guardada." />
      ) : null}

      {mutation.error ? (
        <ErrorBanner
          message={mutation.error instanceof Error ? mutation.error.message : 'No pudimos guardar los cambios.'}
        />
      ) : null}

      <form id="business-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="settings-layout">
          <div className="settings-content">
            <div className="settings-tabs">
              <button type="button" className="settings-tab active">Información general</button>
              <button type="button" className="settings-tab">Apariencia</button>
              <button type="button" className="settings-tab">Enlace de reservas</button>
              <button type="button" className="settings-tab">Notificaciones</button>
            </div>

            <div className="form-card">
              <div className="form-card-heading">
                <h2>Identidad del negocio</h2>
                <p>Así se verá tu espacio en la página de reservas.</p>
              </div>
              <div className="brand-edit">
                <div className="big-brand-avatar">B</div>
                <div>
                  <strong>Logo del negocio</strong>
                  <p>PNG o JPG. Recomendado: 512 × 512 px.</p>
                  <button type="button" className="small-outline">Cambiar logo</button>
                </div>
              </div>
              <div className="form-grid">
                <label className="form-field">
                  Nombre del negocio
                  <input placeholder="Bruma Estudio" {...form.register('name')} />
                  {errors.name && <span className="text-error" style={{ fontSize: 9 }}>{errors.name.message}</span>}
                </label>
                <label className="form-field">
                  Slug
                  <input placeholder="bruma-estudio" {...form.register('slug')} />
                  {errors.slug && <span className="text-error" style={{ fontSize: 9 }}>{errors.slug.message}</span>}
                </label>
                <label className="form-field">
                  Zona horaria
                  <select {...form.register('timezone')}>
                    {timezoneOptions.map((timezone) => (
                      <option key={timezone} value={timezone}>{timezone}</option>
                    ))}
                  </select>
                  {errors.timezone && <span className="text-error" style={{ fontSize: 9 }}>{errors.timezone.message}</span>}
                </label>
                <label className="form-field">
                  Logo (URL)
                  <input placeholder="https://…/logo.png" {...form.register('logoUrl')} />
                  {errors.logoUrl && <span className="text-error" style={{ fontSize: 9 }}>{errors.logoUrl.message}</span>}
                </label>
                <label className="form-field full-field">
                  Descripción
                  <textarea placeholder="Un espacio para pausar, renovarte y sentirte bien." />
                </label>
                <label className="form-field">
                  Ciudad
                  <input placeholder="Buenos Aires" {...form.register('city')} />
                  {errors.city && <span className="text-error" style={{ fontSize: 9 }}>{errors.city.message}</span>}
                </label>
                <label className="form-field">
                  Dirección
                  <input placeholder="Gorriti 4820, Palermo" {...form.register('address')} />
                  {errors.address && <span className="text-error" style={{ fontSize: 9 }}>{errors.address.message}</span>}
                </label>
                <label className="form-field">
                  Correo de contacto
                  <input type="email" placeholder="hola@brumaestudio.com" {...form.register('contactEmail')} />
                  {errors.contactEmail && <span className="text-error" style={{ fontSize: 9 }}>{errors.contactEmail.message}</span>}
                </label>
                <label className="form-field">
                  Teléfono
                  <input placeholder="+54 9 11 4567-8910" {...form.register('contactPhone')} />
                  {errors.contactPhone && <span className="text-error" style={{ fontSize: 9 }}>{errors.contactPhone.message}</span>}
                </label>
              </div>
            </div>

            <div className="form-card">
              <div className="form-card-heading">
                <h2>Políticas de reserva</h2>
                <p>Reglas que aplica el motor al calcular disponibilidad.</p>
              </div>
              <div className="form-grid">
                <label className="form-field">
                  Anticipación mínima (minutos)
                  <input type="number" min={0} max={43200} {...form.register('bookingMinAdvanceMinutes', { valueAsNumber: true })} />
                  {errors.bookingMinAdvanceMinutes && <span className="text-error" style={{ fontSize: 9 }}>{errors.bookingMinAdvanceMinutes.message}</span>}
                </label>
                <label className="form-field">
                  Ventana de reserva (días)
                  <input type="number" min={1} max={365} {...form.register('bookingMaxAdvanceDays', { valueAsNumber: true })} />
                  {errors.bookingMaxAdvanceDays && <span className="text-error" style={{ fontSize: 9 }}>{errors.bookingMaxAdvanceDays.message}</span>}
                </label>
                <label className="form-field">
                  Cancelación sin cargo (horas)
                  <input type="number" min={0} max={720} {...form.register('cancellationHours', { valueAsNumber: true })} />
                  {errors.cancellationHours && <span className="text-error" style={{ fontSize: 9 }}>{errors.cancellationHours.message}</span>}
                </label>
                <label className="form-field">
                  Seña al cancelar tarde
                  <select {...form.register('cancellationDepositPolicy')}>
                    <option value="retain">Retener la seña</option>
                    <option value="refund">Devolver la seña</option>
                  </select>
                  {errors.cancellationDepositPolicy && <span className="text-error" style={{ fontSize: 9 }}>{errors.cancellationDepositPolicy.message}</span>}
                </label>
              </div>
            </div>
          </div>

          <div className="account-side">
            <div className="preview-card">
              <div className="preview-label">VISTA PREVIA</div>
              <div className="preview-cover">
                <div className="preview-brand">
                  {business.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={business.logoUrl}
                      alt=""
                      className="h-full w-full rounded-[inherit] object-cover"
                    />
                  ) : (
                    business.name.slice(0, 1).toUpperCase()
                  )}
                </div>
              </div>
              <div className="preview-details">
                <div className="preview-badge">TU NEGOCIO</div>
                <h3>{business.name}</h3>
                <p>Así verán tu página tus clientes.</p>
                <div className="preview-meta">
                  {business.city || business.address ? (
                    <span>📍 {[business.address, business.city].filter(Boolean).join(', ')}</span>
                  ) : null}
                  {business.contactPhone ? (
                    <span>📞 {business.contactPhone}</span>
                  ) : null}
                </div>
                <span className="preview-cta">Reservar turno</span>
                <small>Así verán tu página tus clientes</small>
              </div>
              <div className="preview-link">
                <div>
                  <strong>Tu enlace de reservas</strong>
                  <span>Compartilo con tus clientes</span>
                </div>
                <a
                  className="text-link"
                  href={`/reservar/${business.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir
                </a>
              </div>
            </div>
            <div className="form-card appearance-card">
              <div className="form-card-heading">
                <h2>Apariencia</h2>
                <p>Los colores de tu panel se adaptan al tema claro u oscuro.</p>
              </div>
              <div className="appearance-row">
                <div>
                  <strong>Tema del panel</strong>
                  <span>Podés cambiarlo desde el ícono de luna en la barra superior.</span>
                </div>
                <span className="button button-secondary" style={{ pointerEvents: 'none' }}>
                  Automático
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
