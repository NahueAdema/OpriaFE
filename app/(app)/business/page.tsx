'use client';

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';
import { businessFormSchema, type BusinessFormValues } from '@/lib/schemas';
import { TIMEZONES } from '@/lib/utils';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  SuccessBanner,
} from '@/components/ui';

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
      <Card className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500">
        <Spinner />
        Cargando configuración…
      </Card>
    );
  }

  if (businessQuery.error) {
    return (
      <ErrorBanner
        message={
          businessQuery.error instanceof Error
            ? businessQuery.error.message
            : 'No pudimos cargar la configuración.'
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Negocio"
        description="Perfil público, contacto y políticas que aplica el motor de reservas."
      />

      {mutation.isSuccess ? (
        <SuccessBanner message="Configuración guardada." />
      ) : null}

      {mutation.error ? (
        <ErrorBanner
          message={
            mutation.error instanceof Error
              ? mutation.error.message
              : 'No pudimos guardar los cambios.'
          }
        />
      ) : null}

      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Perfil</h2>
            <p className="text-xs text-slate-500">
              Nombre, URL y zona horaria del negocio.
            </p>
          </div>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <Field
              label="Nombre del negocio"
              htmlFor="business-name"
              error={form.formState.errors.name?.message}
            >
              <Input
                id="business-name"
                placeholder="Estudio Aurora"
                {...form.register('name')}
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="business-slug"
              hint="Identificador único en opria.app."
              error={form.formState.errors.slug?.message}
            >
              <Input
                id="business-slug"
                placeholder="estudio-aurora"
                {...form.register('slug')}
              />
            </Field>

            <Field
              label="Zona horaria"
              htmlFor="business-timezone"
              hint="Los horarios se interpretan en esta zona."
              error={form.formState.errors.timezone?.message}
            >
              <Select id="business-timezone" {...form.register('timezone')}>
                {timezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Logo (URL)"
              htmlFor="business-logo"
              hint="Opcional. Debe ser una URL pública."
              error={form.formState.errors.logoUrl?.message}
            >
              <Input
                id="business-logo"
                placeholder="https://…/logo.png"
                {...form.register('logoUrl')}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Contacto</h2>
            <p className="text-xs text-slate-500">
              Datos visibles para tus clientes.
            </p>
          </div>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <Field
              label="Ciudad"
              htmlFor="business-city"
              hint="Se usa para filtrar el buscador público."
              error={form.formState.errors.city?.message}
            >
              <Input
                id="business-city"
                placeholder="Buenos Aires"
                {...form.register('city')}
              />
            </Field>

            <Field
              label="Dirección"
              htmlFor="business-address"
              error={form.formState.errors.address?.message}
            >
              <Input
                id="business-address"
                placeholder="Av. Siempre Viva 742"
                {...form.register('address')}
              />
            </Field>

            <Field
              label="Email de contacto"
              htmlFor="business-email"
              error={form.formState.errors.contactEmail?.message}
            >
              <Input
                id="business-email"
                type="email"
                placeholder="hola@negocio.com"
                {...form.register('contactEmail')}
              />
            </Field>

            <Field
              label="Teléfono"
              htmlFor="business-phone"
              error={form.formState.errors.contactPhone?.message}
            >
              <Input
                id="business-phone"
                placeholder="+54 11 5555 5555"
                {...form.register('contactPhone')}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Políticas de reserva
            </h2>
            <p className="text-xs text-slate-500">
              Reglas que aplica el motor al calcular disponibilidad.
            </p>
          </div>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <Field
              label="Anticipación mínima (minutos)"
              htmlFor="business-min-advance"
              hint="Tiempo mínimo entre ahora y el turno."
              error={form.formState.errors.bookingMinAdvanceMinutes?.message}
            >
              <Input
                id="business-min-advance"
                type="number"
                min={0}
                max={43200}
                {...form.register('bookingMinAdvanceMinutes', {
                  valueAsNumber: true,
                })}
              />
            </Field>

            <Field
              label="Ventana de reserva (días)"
              htmlFor="business-max-days"
              hint="Hasta cuántos días a futuro se puede reservar."
              error={form.formState.errors.bookingMaxAdvanceDays?.message}
            >
              <Input
                id="business-max-days"
                type="number"
                min={1}
                max={365}
                {...form.register('bookingMaxAdvanceDays', {
                  valueAsNumber: true,
                })}
              />
            </Field>

            <Field
              label="Cancelación sin cargo (horas)"
              htmlFor="business-cancel-hours"
              error={form.formState.errors.cancellationHours?.message}
            >
              <Input
                id="business-cancel-hours"
                type="number"
                min={0}
                max={720}
                {...form.register('cancellationHours', {
                  valueAsNumber: true,
                })}
              />
            </Field>

            <Field
              label="Seña al cancelar tarde"
              htmlFor="business-cancel-policy"
              error={form.formState.errors.cancellationDepositPolicy?.message}
            >
              <Select
                id="business-cancel-policy"
                {...form.register('cancellationDepositPolicy')}
              >
                <option value="retain">Retener la seña</option>
                <option value="refund">Devolver la seña</option>
              </Select>
            </Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={mutation.isPending}>
            <Save className="h-4 w-4" />
            Guardar cambios
          </Button>
        </div>
      </form>
    </>
  );
}
