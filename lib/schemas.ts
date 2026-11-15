import { z } from 'zod';
import { moneyToCents } from './utils';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu email')
    .refine((value) => emailPattern.test(value), 'Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
  tenantSlug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => value === '' || slugPattern.test(value),
      'Usá minúsculas, números y guiones',
    ),
});

export const registerFormSchema = z.object({
  tenantName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  tenantSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Mínimo 2 caracteres')
    .max(63)
    .regex(slugPattern, 'Usá minúsculas, números y guiones'),
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu email')
    .refine((value) => emailPattern.test(value), 'Email inválido'),
  password: z
    .string()
    .min(10, 'La contraseña debe tener al menos 10 caracteres')
    .max(128),
});

export const customerLoginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu email')
    .refine((value) => emailPattern.test(value), 'Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

export const customerRegisterFormSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu email')
    .refine((value) => emailPattern.test(value), 'Email inválido'),
  phone: z
    .string()
    .trim()
    .min(6, 'Ingresá un teléfono')
    .max(40)
    .regex(/^[+0-9][0-9\s()-]{5,39}$/, 'Teléfono inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128),
});

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
    newPassword: z
      .string()
      .min(10, 'La contraseña debe tener al menos 10 caracteres')
      .max(128),
    confirmPassword: z.string().min(1, 'Repetí la contraseña nueva'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'La contraseña nueva debe ser distinta de la actual',
    path: ['newPassword'],
  });

export const businessFormSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(slugPattern, 'Usá minúsculas, números y guiones'),
  timezone: z.string().min(1, 'Elegí una zona horaria'),
  logoUrl: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) => value === '' || z.url().safeParse(value).success,
      'URL inválida',
    ),
  address: z.string().trim().max(255),
  city: z.string().trim().max(120),
  contactEmail: z
    .string()
    .trim()
    .max(320)
    .refine(
      (value) => value === '' || emailPattern.test(value),
      'Email inválido',
    ),
  contactPhone: z
    .string()
    .trim()
    .max(32)
    .refine(
      (value) => value === '' || /^[+0-9][0-9\s()-]{2,31}$/.test(value),
      'Teléfono inválido',
    ),
  cancellationHours: z.number().int().min(0).max(720),
  cancellationDepositPolicy: z.enum(['retain', 'refund']),
  bookingMinAdvanceMinutes: z.number().int().min(0).max(43_200),
  bookingMaxAdvanceDays: z.number().int().min(1).max(365),
});

export const serviceFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
    description: z.string().trim().max(1000),
    durationMinutes: z.number().int().min(5, 'Mínimo 5 minutos').max(1440),
    bufferMinutes: z.number().int().min(0).max(240),
    price: z
      .string()
      .trim()
      .min(1, 'Ingresá un precio')
      .refine(
        (value) =>
          Number.isFinite(moneyToCents(value)) && moneyToCents(value) >= 0,
        'Precio inválido',
      ),
    depositType: z.enum(['none', 'fixed', 'percentage']),
    depositValue: z.string().trim(),
    active: z.boolean(),
  })
  .superRefine((data, context) => {
    const priceCents = moneyToCents(data.price);

    if (data.depositType === 'fixed') {
      const value = moneyToCents(data.depositValue);

      if (value > priceCents) {
        context.addIssue({
          code: 'custom',
          path: ['depositValue'],
          message: 'La seña no puede superar el precio',
        });
      }
    }

    if (data.depositType === 'percentage') {
      const value = Number(data.depositValue);

      if (!Number.isFinite(value) || value < 0 || value > 100) {
        context.addIssue({
          code: 'custom',
          path: ['depositValue'],
          message: 'Usá un porcentaje entre 0 y 100',
        });
      }
    }
  });

export const staffFormSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  active: z.boolean(),
});

export const publicBookingFormSchema = z.object({
  customerName: z.string().trim().min(2, 'Ingresá tu nombre').max(120),
  customerPhone: z.string().trim().min(6, 'Ingresá un teléfono').max(40),
  customerEmail: z
    .string()
    .trim()
    .max(254)
    .refine(
      (value) => value === '' || emailPattern.test(value),
      'Email inválido',
    ),
  notes: z.string().trim().max(500),
});

export const timeBlockFormSchema = z
  .object({
    startsAt: z.string().min(1, 'Elegí el inicio'),
    endsAt: z.string().min(1, 'Elegí el fin'),
    reason: z.string().trim().max(255),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'El fin debe ser posterior al inicio',
    path: ['endsAt'],
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type CustomerLoginFormValues = z.infer<typeof customerLoginFormSchema>;
export type CustomerRegisterFormValues = z.infer<
  typeof customerRegisterFormSchema
>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
export type BusinessFormValues = z.infer<typeof businessFormSchema>;
export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
export type StaffFormValues = z.infer<typeof staffFormSchema>;
export type PublicBookingFormValues = z.infer<typeof publicBookingFormSchema>;
export type TimeBlockFormValues = z.infer<typeof timeBlockFormSchema>;
