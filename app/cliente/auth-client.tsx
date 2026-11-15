'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CalendarCheck, Sparkles } from 'lucide-react';
import { useCustomerAuth } from '@/components/customer-auth-provider';
import { ApiError } from '@/lib/api';
import {
  customerLoginFormSchema,
  customerRegisterFormSchema,
  type CustomerLoginFormValues,
  type CustomerRegisterFormValues,
} from '@/lib/schemas';
import { Button, ErrorBanner, Field, Input } from '@/components/ui';

/**
 * Customer login and registration. The account realm is independent from the
 * business panel, so this form only talks to `useCustomerAuth`.
 */
export function CustomerAuthClient({
  defaultMode = 'login',
}: {
  defaultMode?: 'login' | 'register';
}) {
  const router = useRouter();
  const { status, signIn, signUp } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<CustomerLoginFormValues>({
    resolver: zodResolver(customerLoginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<CustomerRegisterFormValues>({
    resolver: zodResolver(customerRegisterFormSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/cliente/turnos');
    }
  }, [status, router]);

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setError(null);
  }

  async function onLogin(values: CustomerLoginFormValues) {
    setError(null);

    try {
      await signIn(values);
      router.replace('/cliente/turnos');
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No pudimos iniciar sesión. Intentá de nuevo.',
      );
    }
  }

  async function onRegister(values: CustomerRegisterFormValues) {
    setError(null);

    try {
      await signUp(values);
      router.replace('/cliente/turnos');
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No pudimos crear tu cuenta. Intentá de nuevo.',
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-slate-50 to-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-200">
              O
            </span>
            <span className="text-lg font-semibold text-slate-900">Opria</span>
          </Link>
          <Link
            href="/cliente"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>

        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-700 shadow-sm ring-1 ring-violet-100">
            <Sparkles className="h-3.5 w-3.5" />
            Espacio de clientes
          </span>
          <h1 className="pt-3 text-2xl font-semibold tracking-tight text-slate-900">
            {mode === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}
          </h1>
          <p className="text-sm text-slate-500">
            {mode === 'login'
              ? 'Mirá tus turnos y reservá más rápido.'
              : 'Guardá tus datos y seguí tus turnos en un solo lugar.'}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'login'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'register'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {error ? (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        ) : null}

        {mode === 'login' ? (
          <form
            onSubmit={loginForm.handleSubmit(onLogin)}
            className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Field
              label="Email"
              htmlFor="customer-login-email"
              error={loginForm.formState.errors.email?.message}
            >
              <Input
                id="customer-login-email"
                type="email"
                autoComplete="email"
                placeholder="vos@email.com"
                {...loginForm.register('email')}
              />
            </Field>

            <Field
              label="Contraseña"
              htmlFor="customer-login-password"
              error={loginForm.formState.errors.password?.message}
            >
              <Input
                id="customer-login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...loginForm.register('password')}
              />
            </Field>

            <Button
              type="submit"
              className="w-full"
              loading={loginForm.formState.isSubmitting}
            >
              Entrar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <form
            onSubmit={registerForm.handleSubmit(onRegister)}
            className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Field
              label="Nombre y apellido"
              htmlFor="customer-register-name"
              error={registerForm.formState.errors.name?.message}
            >
              <Input
                id="customer-register-name"
                autoComplete="name"
                placeholder="Ana Pérez"
                {...registerForm.register('name')}
              />
            </Field>

            <Field
              label="Email"
              htmlFor="customer-register-email"
              error={registerForm.formState.errors.email?.message}
            >
              <Input
                id="customer-register-email"
                type="email"
                autoComplete="email"
                placeholder="vos@email.com"
                {...registerForm.register('email')}
              />
            </Field>

            <Field
              label="Teléfono"
              htmlFor="customer-register-phone"
              hint="Lo usamos para avisarte sobre tus turnos."
              error={registerForm.formState.errors.phone?.message}
            >
              <Input
                id="customer-register-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+54 11 5555 0000"
                {...registerForm.register('phone')}
              />
            </Field>

            <Field
              label="Contraseña"
              htmlFor="customer-register-password"
              hint="Mínimo 8 caracteres."
              error={registerForm.formState.errors.password?.message}
            >
              <Input
                id="customer-register-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...registerForm.register('password')}
              />
            </Field>

            <Button
              type="submit"
              className="w-full"
              loading={registerForm.formState.isSubmitting}
            >
              Crear cuenta
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500">
          <CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <span>
            También podés reservar como invitado desde{' '}
            <Link
              href="/cliente"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              el buscador de negocios
            </Link>
            . ¿Sos un negocio?{' '}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Ingresá a tu panel
            </Link>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
