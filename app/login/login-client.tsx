'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  CalendarClock,
  Check,
  Scissors,
  Sparkles,
  Users,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { useAuth } from '@/components/auth-provider';
import { ApiError } from '@/lib/api';
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from '@/lib/schemas';
import { Button, Field, Input } from '@/components/ui';

const CUSTOMER_ACCOUNT_ERROR_CODE = 'CUSTOMER_ACCOUNT';

const highlights = [
  {
    icon: Scissors,
    title: 'Servicios con seña',
    description: 'Precio, duración, buffer y política de seña.',
  },
  {
    icon: Users,
    title: 'Equipo y horarios',
    description: 'Asigná servicios y definí franjas semanales.',
  },
  {
    icon: CalendarClock,
    title: 'Disponibilidad real',
    description: 'Slots libres con timezone, bloqueos y DST.',
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

export function LoginClient({
  defaultMode = 'login',
}: {
  defaultMode?: 'login' | 'register';
}) {
  const router = useRouter();
  const { status, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [isCustomerAccount, setIsCustomerAccount] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      tenantName: '',
      tenantSlug: '',
      name: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setError(null);
    setIsCustomerAccount(false);
  }

  async function onLogin(values: LoginFormValues) {
    setError(null);
    setIsCustomerAccount(false);

    try {
      await signIn({ email: values.email, password: values.password });
      router.replace('/dashboard');
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        cause.code === CUSTOMER_ACCOUNT_ERROR_CODE
      ) {
        setError('Tu cuenta es de cliente. Ingresá desde el espacio de clientes.');
        setIsCustomerAccount(true);
        return;
      }

      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No pudimos iniciar sesión. Intentá de nuevo.',
      );
    }
  }

  async function onRegister(values: RegisterFormValues) {
    setError(null);

    try {
      await signUp(values);
      router.replace('/dashboard');
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'No pudimos crear la cuenta. Intentá de nuevo.',
      );
    }
  }

  const tenantName = registerForm.watch('tenantName');

  function suggestSlug() {
    if (!registerForm.getValues('tenantSlug')) {
      registerForm.setValue('tenantSlug', slugify(tenantName), {
        shouldValidate: true,
      });
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-primary-dark p-10 text-white [--text-muted:#E9E6FF] lg:flex">
        <div className="absolute top-24 -left-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex h-11 items-center">
          <BrandLogo variant="full" inverted className="h-10" priority />
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-surface/10 bg-surface/5 px-3 py-1 text-xs text-subtle-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Configuración del negocio
            </span>
            <h1 className="max-w-md text-4xl leading-tight font-semibold tracking-tight">
              Todo lo que tu negocio necesita para recibir turnos.
            </h1>
            <p className="max-w-md text-sm leading-6 text-subtle-foreground">
              Centralizá servicios, equipo, horarios y bloqueos. La
              disponibilidad se calcula sola, respetando tu timezone.
            </p>
          </div>

          <div className="space-y-4">
            {highlights.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-surface/10 bg-surface/5">
                  <item.icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs leading-5 text-subtle-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-subtle-foreground">
          Opria. Hecho para negocios de servicios.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex h-9 items-center lg:hidden">
            <BrandLogo variant="full" className="h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {mode === 'login'
                ? 'Ingresá a tu panel de negocio'
                : 'Creá tu negocio'}
            </h2>
            <p className="text-sm text-subtle-foreground">
              {mode === 'login'
                ? 'Gestioná servicios, equipo, agenda y disponibilidad.'
                : 'En un minuto tenés tu cuenta de dueño lista.'}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Tipo de acceso"
            className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1 shadow-sm"
          >
            <button
              type="button"
              role="tab"
              id="tab-login"
              aria-selected={mode === 'login'}
              aria-controls="panel-login"
              onClick={() => switchMode('login')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === 'login'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-background'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              id="tab-register"
              aria-selected={mode === 'register'}
              aria-controls="panel-register"
              onClick={() => switchMode('register')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-background'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {error ? (
            <div
              role="alert"
              className="space-y-1 rounded-xl border border-error bg-error/10 px-3 py-2 text-sm text-error"
            >
              <p>{error}</p>
              {isCustomerAccount ? (
                <Link
                  href="/cliente/login"
                  className="font-medium underline underline-offset-2"
                >
                  Ir al ingreso de clientes
                </Link>
              ) : null}
            </div>
          ) : null}

          {mode === 'login' ? (
            <form
              id="panel-login"
              role="tabpanel"
              aria-labelledby="tab-login"
              onSubmit={loginForm.handleSubmit(onLogin)}
              className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <Field
                label="Email"
                htmlFor="login-email"
                error={loginForm.formState.errors.email?.message}
              >
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vos@negocio.com"
                  {...loginForm.register('email')}
                />
              </Field>

              <Field
                label="Contraseña"
                htmlFor="login-password"
                error={loginForm.formState.errors.password?.message}
              >
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
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
              id="panel-register"
              role="tabpanel"
              aria-labelledby="tab-register"
              onSubmit={registerForm.handleSubmit(onRegister)}
              className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <Field
                label="Nombre del negocio"
                htmlFor="register-tenant-name"
                error={registerForm.formState.errors.tenantName?.message}
              >
                <Input
                  id="register-tenant-name"
                  placeholder="Estudio Aurora"
                  {...registerForm.register('tenantName', {
                    onBlur: suggestSlug,
                  })}
                />
              </Field>

              <Field
                label="Slug"
                htmlFor="register-tenant-slug"
                hint="Va a formar parte de la URL pública del negocio."
                error={registerForm.formState.errors.tenantSlug?.message}
              >
                <div className="flex gap-2">
                  <Input
                    id="register-tenant-slug"
                    placeholder="estudio-aurora"
                    {...registerForm.register('tenantSlug')}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={suggestSlug}
                    className="shrink-0"
                  >
                    Sugerir
                  </Button>
                </div>
              </Field>

              <Field
                label="Tu nombre"
                htmlFor="register-name"
                error={registerForm.formState.errors.name?.message}
              >
                <Input
                  id="register-name"
                  placeholder="Ana Pérez"
                  {...registerForm.register('name')}
                />
              </Field>

              <Field
                label="Email"
                htmlFor="register-email"
                error={registerForm.formState.errors.email?.message}
              >
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vos@negocio.com"
                  {...registerForm.register('email')}
                />
              </Field>

              <Field
                label="Contraseña"
                htmlFor="register-password"
                hint="Mínimo 10 caracteres."
                error={registerForm.formState.errors.password?.message}
              >
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  {...registerForm.register('password')}
                />
              </Field>

              <Button
                type="submit"
                className="w-full"
                loading={registerForm.formState.isSubmitting}
              >
                Crear negocio
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <div className="flex items-center gap-2 text-xs text-subtle-foreground">
            <Check className="h-3.5 w-3.5 text-success" />
            Tus datos quedan aislados por negocio.
          </div>

          <div className="rounded-xl border border-border bg-surface px-3 py-2.5 text-center text-xs text-subtle-foreground">
            ¿Sos cliente y querés reservar un turno?{' '}
            <Link
              href="/cliente"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Ir al espacio de clientes
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
