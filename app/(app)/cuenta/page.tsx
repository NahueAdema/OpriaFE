'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/components/auth-provider';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  PageHeader,
  SuccessBanner,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from '@/lib/schemas';

const DEFAULTS: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function isWrongPassword(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.detail === 'Current password is incorrect'
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { auth, signOut } = useAuth();
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: DEFAULTS,
  });

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordFormValues) =>
      api.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => form.reset(DEFAULTS),
    onError: (error) => {
      if (isWrongPassword(error)) {
        form.setError('currentPassword', {
          message: 'La contraseña actual no es correcta',
        });
      }
    },
  });

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  const generalError =
    mutation.error && !isWrongPassword(mutation.error)
      ? mutation.error instanceof Error
        ? mutation.error.message
        : 'No pudimos cambiar la contraseña.'
      : null;

  return (
    <>
      <PageHeader
        title="Mi cuenta"
        description="Tus datos de acceso y la seguridad de la sesión."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Cambiar contraseña
              </h2>
              <p className="text-xs text-slate-500">
                Al menos 10 caracteres, distinta de la actual.
              </p>
            </div>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            <Field
              label="Contraseña actual"
              htmlFor="current-password"
              error={form.formState.errors.currentPassword?.message}
            >
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                {...form.register('currentPassword')}
              />
            </Field>

            <Field
              label="Contraseña nueva"
              htmlFor="new-password"
              error={form.formState.errors.newPassword?.message}
            >
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                {...form.register('newPassword')}
              />
            </Field>

            <Field
              label="Repetir contraseña nueva"
              htmlFor="confirm-password"
              error={form.formState.errors.confirmPassword?.message}
            >
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                {...form.register('confirmPassword')}
              />
            </Field>

            {generalError ? <ErrorBanner message={generalError} /> : null}

            {mutation.isSuccess ? (
              <SuccessBanner message="Contraseña actualizada. Cerramos las sesiones en otros dispositivos." />
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando…' : 'Actualizar contraseña'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-slate-400 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              Cuenta
            </div>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Nombre</dt>
                <dd className="font-medium text-slate-900">
                  {auth?.user.name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="font-medium break-all text-slate-900">
                  {auth?.user.email ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Negocio</dt>
                <dd className="font-medium text-slate-900">
                  {auth?.tenant.name ?? '—'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">Sesión</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Cerrá la sesión en este dispositivo. Las demás sesiones ya se
              cierran al cambiar la contraseña.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
