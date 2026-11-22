import { clearAuth, readAuth, writeAuth } from './auth-storage';
import {
  clearCustomerAuth,
  readCustomerAuth,
  writeCustomerAuth,
} from './customer-auth-storage';
import type {
  Appointment,
  AppointmentList,
  AppointmentStatus,
  AppointmentStatusInput,
  AuthResult,
  AvailabilityResponse,
  Business,
  BusinessInput,
  ChangePasswordInput,
  CustomerAppointment,
  CustomerAppointmentInput,
  CustomerAppointmentList,
  CustomerAuthResult,
  CustomerLoginInput,
  CustomerProfile,
  CustomerRegisterInput,
  LoginInput,
  ProblemDetails,
  PublicAppointment,
  PublicAvailability,
  PublicBookingInput,
  PublicBusiness,
  PublicBusinessFilters,
  PublicBusinessSummary,
  PublicCalendar,
  RegisterInput,
  Service,
  ServiceInput,
  StaffInput,
  StaffMember,
  TimeBlock,
  TimeBlockInput,
  WorkingHourInput,
  WorkingHoursResponse,
} from './types';

const LOCAL_API_URL = 'http://127.0.0.1:3001/v1';

/**
 * `next dev` always targets the local API, even if a stale shell variable or
 * an old `.env.local` points to production. Production builds keep using
 * NEXT_PUBLIC_API_URL (baked at build time).
 */
export const API_URL =
  process.env.NODE_ENV === 'development'
    ? LOCAL_API_URL
    : (process.env.NEXT_PUBLIC_API_URL ?? LOCAL_API_URL);

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | undefined;
  readonly code: string | undefined;
  readonly errors: Array<{ path?: string; message: string }>;

  constructor(status: number, body: unknown) {
    const problem = body as ProblemDetails | null;
    const message =
      problem?.detail ?? problem?.title ?? `Request failed (${status})`;

    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = problem?.detail;
    this.code = typeof problem?.code === 'string' ? problem.code : undefined;
    this.errors = (problem?.errors ?? [])
      .filter((issue) => typeof issue?.message === 'string')
      .map((issue) => ({ path: issue.path, message: issue.message as string }));
  }

  fieldMessage(path: string): string | undefined {
    return this.errors.find((issue) => issue.path === path)?.message;
  }
}

let unauthorizedHandler: (() => void) | null = null;
let refreshPromise: Promise<AuthResult> | null = null;
let customerUnauthorizedHandler: (() => void) | null = null;
let customerRefreshPromise: Promise<CustomerAuthResult> | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function setCustomerUnauthorizedHandler(
  handler: (() => void) | null,
): void {
  customerUnauthorizedHandler = handler;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function refreshSession(): Promise<AuthResult> {
  const auth = readAuth();

  if (!auth?.refreshToken) {
    throw new ApiError(401, null);
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });
      const body = await parseBody(response);

      if (!response.ok) {
        throw new ApiError(response.status, body);
      }

      const next = body as AuthResult;
      writeAuth(next);

      return next;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const auth = readAuth();
  const headers = new Headers(init.headers);

  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  if (auth) {
    headers.set('authorization', `Bearer ${auth.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (response.status === 401 && retry && readAuth()?.refreshToken) {
    try {
      await refreshSession();
    } catch (error) {
      clearAuth();
      unauthorizedHandler?.();
      throw error;
    }

    return apiFetch<T>(path, init, false);
  }

  const body = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as T;
}

async function refreshCustomerSession(): Promise<CustomerAuthResult> {
  const auth = readCustomerAuth();

  if (!auth?.refreshToken) {
    throw new ApiError(401, null);
  }

  if (!customerRefreshPromise) {
    customerRefreshPromise = (async () => {
      const response = await fetch(`${API_URL}/customer-auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });
      const body = await parseBody(response);

      if (!response.ok) {
        throw new ApiError(response.status, body);
      }

      const next = body as CustomerAuthResult;
      writeCustomerAuth(next);

      return next;
    })().finally(() => {
      customerRefreshPromise = null;
    });
  }

  return customerRefreshPromise;
}

/**
 * Customer requests carry their own token. They never fall back to the staff
 * session: a customer must not silently borrow a business login.
 */
async function customerFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const auth = readCustomerAuth();
  const headers = new Headers(init.headers);

  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  if (auth) {
    headers.set('authorization', `Bearer ${auth.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (response.status === 401 && retry && readCustomerAuth()?.refreshToken) {
    try {
      await refreshCustomerSession();
    } catch (error) {
      clearCustomerAuth();
      customerUnauthorizedHandler?.();
      throw error;
    }

    return customerFetch<T>(path, init, false);
  }

  const body = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as T;
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const serialized = search.toString();

  return serialized ? `?${serialized}` : '';
}

/**
 * Public endpoints are anonymous: they must not attach the tenant token, and
 * they never trigger a session refresh.
 */
async function publicFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as T;
}

export const api = {
  login(input: LoginInput): Promise<AuthResult> {
    return apiFetch<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  register(input: RegisterInput): Promise<AuthResult> {
    return apiFetch<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  logout(refreshToken: string): Promise<void> {
    return apiFetch<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken, allDevices: false }),
    });
  },

  changePassword(input: ChangePasswordInput): Promise<void> {
    return apiFetch<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        // The backend keeps this session alive and revokes the rest.
        refreshToken: readAuth()?.refreshToken,
      }),
    });
  },

  business: {
    get(): Promise<Business> {
      return apiFetch<Business>('/business');
    },
    update(input: Partial<BusinessInput>): Promise<Business> {
      return apiFetch<Business>('/business', {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
  },

  services: {
    list(active?: boolean): Promise<Service[]> {
      return apiFetch<Service[]>(
        `/services${query({
          active: active === undefined ? undefined : String(active),
        })}`,
      );
    },
    create(input: ServiceInput): Promise<Service> {
      return apiFetch<Service>('/services', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    update(id: string, input: Partial<ServiceInput>): Promise<Service> {
      return apiFetch<Service>(`/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
    deactivate(id: string): Promise<void> {
      return apiFetch<void>(`/services/${id}`, { method: 'DELETE' });
    },
  },

  staff: {
    list(active?: boolean): Promise<StaffMember[]> {
      return apiFetch<StaffMember[]>(
        `/staff${query({
          active: active === undefined ? undefined : String(active),
        })}`,
      );
    },
    create(input: StaffInput): Promise<StaffMember> {
      return apiFetch<StaffMember>('/staff', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    update(id: string, input: Partial<StaffInput>): Promise<StaffMember> {
      return apiFetch<StaffMember>(`/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
    deactivate(id: string): Promise<void> {
      return apiFetch<void>(`/staff/${id}`, { method: 'DELETE' });
    },
    setServices(id: string, serviceIds: string[]): Promise<StaffMember> {
      return apiFetch<StaffMember>(`/staff/${id}/services`, {
        method: 'PUT',
        body: JSON.stringify({ serviceIds }),
      });
    },
    getWorkingHours(id: string): Promise<WorkingHoursResponse> {
      return apiFetch<WorkingHoursResponse>(`/staff/${id}/working-hours`);
    },
    replaceWorkingHours(
      id: string,
      hours: WorkingHourInput[],
    ): Promise<WorkingHoursResponse> {
      return apiFetch<WorkingHoursResponse>(`/staff/${id}/working-hours`, {
        method: 'PUT',
        body: JSON.stringify({ hours }),
      });
    },
    listTimeBlocks(id: string): Promise<TimeBlock[]> {
      return apiFetch<TimeBlock[]>(`/staff/${id}/time-blocks`);
    },
    createTimeBlock(id: string, input: TimeBlockInput): Promise<TimeBlock> {
      return apiFetch<TimeBlock>(`/staff/${id}/time-blocks`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    deleteTimeBlock(id: string, blockId: string): Promise<void> {
      return apiFetch<void>(`/staff/${id}/time-blocks/${blockId}`, {
        method: 'DELETE',
      });
    },
  },

  availability: {
    get(params: {
      serviceId: string;
      date: string;
      staffId?: string;
    }): Promise<AvailabilityResponse> {
      return apiFetch<AvailabilityResponse>(
        `/availability${query({
          serviceId: params.serviceId,
          date: params.date,
          staffId: params.staffId,
        })}`,
      );
    },
  },

  appointments: {
    list(
      params: {
        from?: string;
        to?: string;
        status?: AppointmentStatus;
        staffId?: string;
        serviceId?: string;
        limit?: number;
      } = {},
    ): Promise<AppointmentList> {
      return apiFetch<AppointmentList>(
        `/appointments${query({
          from: params.from,
          to: params.to,
          status: params.status,
          staffId: params.staffId,
          serviceId: params.serviceId,
          limit: params.limit === undefined ? undefined : String(params.limit),
        })}`,
      );
    },
    updateStatus(
      id: string,
      input: AppointmentStatusInput,
    ): Promise<Appointment> {
      return apiFetch<Appointment>(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
  },
};

export const publicApi = {
  searchBusinesses(params: {
    q?: string;
    city?: string;
    service?: string;
  }): Promise<{ items: PublicBusinessSummary[] }> {
    return publicFetch<{ items: PublicBusinessSummary[] }>(
      `/public/businesses${query(params)}`,
    );
  },

  getFilters(): Promise<PublicBusinessFilters> {
    return publicFetch<PublicBusinessFilters>('/public/businesses/filters');
  },

  getBusiness(slug: string): Promise<PublicBusiness> {
    return publicFetch<PublicBusiness>(
      `/public/businesses/${encodeURIComponent(slug)}`,
    );
  },

  getAvailability(
    slug: string,
    params: { serviceId: string; date: string },
  ): Promise<PublicAvailability> {
    return publicFetch<PublicAvailability>(
      `/public/businesses/${encodeURIComponent(slug)}/availability${query({
        serviceId: params.serviceId,
        date: params.date,
      })}`,
    );
  },

  getCalendar(
    slug: string,
    params: { serviceId: string; from: string; to: string },
  ): Promise<PublicCalendar> {
    return publicFetch<PublicCalendar>(
      `/public/businesses/${encodeURIComponent(slug)}/calendar${query({
        serviceId: params.serviceId,
        from: params.from,
        to: params.to,
      })}`,
    );
  },

  createAppointment(
    slug: string,
    input: PublicBookingInput,
  ): Promise<PublicAppointment> {
    return publicFetch<PublicAppointment>(
      `/public/businesses/${encodeURIComponent(slug)}/appointments`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
};

/**
 * Customer account API. Kept apart from `api` (staff) and `publicApi`
 * (anonymous): each flow has its own session and refresh chain.
 */
export const customerApi = {
  register(input: CustomerRegisterInput): Promise<CustomerAuthResult> {
    return customerFetch<CustomerAuthResult>('/customer-auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  login(input: CustomerLoginInput): Promise<CustomerAuthResult> {
    return customerFetch<CustomerAuthResult>('/customer-auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  logout(refreshToken: string): Promise<void> {
    return customerFetch<void>('/customer-auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken, allDevices: false }),
    });
  },

  me(): Promise<CustomerProfile> {
    return customerFetch<CustomerProfile>('/customer-auth/me');
  },

  appointments: {
    list(limit?: number): Promise<CustomerAppointmentList> {
      return customerFetch<CustomerAppointmentList>(
        `/customer/appointments${query({
          limit: limit === undefined ? undefined : String(limit),
        })}`,
      );
    },
    create(input: CustomerAppointmentInput): Promise<CustomerAppointment> {
      return customerFetch<CustomerAppointment>('/customer/appointments', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    cancel(id: string): Promise<CustomerAppointment> {
      return customerFetch<CustomerAppointment>(
        `/customer/appointments/${id}/cancel`,
        { method: 'POST' },
      );
    },
  },
};
