'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/components/auth-provider';
import { ErrorBanner, SuccessBanner } from '@/components/ui';
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
  const [showPassword, setShowPassword] = useState(false);
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

  const errors = form.formState.errors;

  return (
    <>
      <div className="section-title-row">
        <div>
          <div className="eyebrow">TU PERFIL</div>
          <h1>Mi cuenta</h1>
          <p>Administrá tus datos personales y la seguridad de tu cuenta.</p>
        </div>
      </div>

      <div className="account-layout">
        <div className="account-main">
          <div className="form-card">
            <div className="form-card-heading">
              <h2>Información personal</h2>
              <p>Estos datos son privados y solo vos podés verlos.</p>
            </div>
            <div className="account-person">
              <div className="avatar avatar-owner account-avatar">
                {(auth?.user.name ?? 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>{auth?.user.name ?? '—'}</strong>
                <p>{auth?.tenant.name ?? '—'}</p>
              </div>
            </div>
            <div className="form-grid">
              <label className="form-field">
                Nombre
                <input defaultValue={auth?.user.name ?? ''} readOnly />
              </label>
              <label className="form-field">
                Correo electrónico
                <input type="email" defaultValue={auth?.user.email ?? ''} readOnly />
              </label>
              <label className="form-field full-field">
                Negocio
                <input defaultValue={auth?.tenant.name ?? ''} readOnly />
              </label>
            </div>
          </div>

          <div className="form-card password-card">
            <div className="form-card-heading">
              <h2>Contraseña y seguridad</h2>
              <p>Actualizá tu contraseña para mantener tu cuenta segura.</p>
            </div>
            <form
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              noValidate
            >
              {generalError ? <ErrorBanner message={generalError} /> : null}
              {mutation.isSuccess ? (
                <SuccessBanner message="Contraseña actualizada. Cerramos las sesiones en otros dispositivos." />
              ) : null}
              <div className="form-grid">
                <label className="form-field full-field">
                  Contraseña actual
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresá tu contraseña actual"
                      {...form.register('currentPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <span className="text-error" style={{ fontSize: 11 }}>{errors.currentPassword.message}</span>
                  )}
                </label>
                <label className="form-field">
                  Nueva contraseña
                  <input
                    type="password"
                    placeholder="Mínimo 10 caracteres"
                    {...form.register('newPassword')}
                  />
                  {errors.newPassword && (
                    <span className="text-error" style={{ fontSize: 11 }}>{errors.newPassword.message}</span>
                  )}
                </label>
                <label className="form-field">
                  Repetir contraseña
                  <input
                    type="password"
                    placeholder="Repetí la contraseña"
                    {...form.register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <span className="text-error" style={{ fontSize: 11 }}>{errors.confirmPassword.message}</span>
                  )}
                </label>
              </div>
              <div className="form-footer">
                <span>Última actualización de contraseña</span>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Guardando…' : 'Actualizar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="account-side">
          <div className="account-plan">
            <div className="plan-icon">
              <ShieldCheck size={18} />
            </div>
            <span>PLAN ACTUAL</span>
            <h3>Profesional</h3>
            <p>Tu negocio está en el plan profesional. Disfrutá de todas las funciones.</p>
            <button type="button">Mejorar plan →</button>
          </div>
          <div className="account-links">
            <button type="button">
              <KeyRound size={14} /> Seguridad de la cuenta
            </button>
            <button type="button" onClick={handleSignOut}>
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
          <div className="account-support">
            <span>¿Necesitás ayuda?</span>
            <a href="#ayuda">Contactar soporte</a>
          </div>
        </div>
      </div>
    </>
  );
}
