export type MembershipRole = 'owner' | 'admin' | 'staff' | 'customer';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    role: MembershipRole;
  };
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'suspended' | 'deleted';
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  cancellationHours: number;
  cancellationDepositPolicy: 'retain' | 'refund';
  bookingMinAdvanceMinutes: number;
  bookingMaxAdvanceDays: number;
  createdAt: string;
  updatedAt: string;
}

export type DepositType = 'none' | 'fixed' | 'percentage';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  depositType: DepositType;
  depositValue: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffServiceLink {
  id: string;
  name: string;
  active: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  userId: string | null;
  active: boolean;
  services: StaffServiceLink[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHour {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface WorkingHoursResponse {
  hours: WorkingHour[];
}

export interface TimeBlock {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  startsAt: string;
  endsAt: string;
  staffIds: string[];
}

export interface AvailabilityResponse {
  date: string;
  timezone: string;
  serviceId: string;
  durationMinutes: number;
  bufferMinutes: number;
  slots: AvailabilitySlot[];
}

export type AppointmentStatus =
  'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show';

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  notes: string | null;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  depositType: DepositType;
  depositValue: number;
  statusReason: string | null;
  statusChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentList {
  items: Appointment[];
  total: number;
}

export interface AppointmentStatusInput {
  status: 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show';
  reason?: string;
}

export interface AppointmentCreateInput {
  serviceId: string;
  staffId?: string;
  startsAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  status?: 'pending' | 'confirmed';
  consent?: boolean;
}

export interface AppointmentRescheduleInput {
  startsAt: string;
  reason?: string;
}

/** Panel customer file. Phone identifies both guests and signed-in accounts. */
export interface PanelCustomer {
  phone: string;
  name: string;
  email: string | null;
  customerId: string | null;
  profileId: string | null;
  notes: string | null;
  consentAt: string | null;
  appointmentCount: number;
  lastAppointmentAt: string | null;
}

export interface CustomerHistoryEntry {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  serviceName: string;
  staffName: string;
  priceCents: number;
  depositType: DepositType;
  depositValue: number;
  notes: string | null;
  statusReason: string | null;
}

export interface PanelCustomerDetail extends PanelCustomer {
  history: CustomerHistoryEntry[];
}

export interface PanelCustomerList {
  items: PanelCustomer[];
  total: number;
}

export interface PanelCustomerUpdate {
  name?: string;
  email?: string;
  notes?: string;
  consent?: boolean;
}

export interface PublicBusinessSummary {
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  serviceCount: number;
}

export interface PublicBusinessFilters {
  cities: string[];
  services: string[];
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  depositType: DepositType;
  depositValue: number;
}

export interface PublicBusiness {
  slug: string;
  name: string;
  timezone: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  cancellationHours: number;
  cancellationDepositPolicy: 'retain' | 'refund';
  bookingMinAdvanceMinutes: number;
  bookingMaxAdvanceDays: number;
  services: PublicService[];
}

export interface PublicAvailabilitySlot {
  startsAt: string;
  endsAt: string;
}

export interface PublicAvailability {
  date: string;
  timezone: string;
  serviceId: string;
  durationMinutes: number;
  bufferMinutes: number;
  slots: PublicAvailabilitySlot[];
}

export interface PublicCalendarDay {
  date: string;
  available: boolean;
  slots: number;
}

export interface PublicCalendar {
  timezone: string;
  serviceId: string;
  from: string;
  to: string;
  days: PublicCalendarDay[];
}

export interface PublicAppointment {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  staffName: string;
  priceCents: number;
  depositType: DepositType;
  depositValue: number;
  customerName: string;
  business: {
    name: string;
    slug: string;
    timezone: string;
  };
}

export interface PublicBookingInput {
  serviceId: string;
  startsAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface BusinessInput {
  name: string;
  slug: string;
  timezone: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  cancellationHours: number;
  cancellationDepositPolicy: 'retain' | 'refund';
  bookingMinAdvanceMinutes: number;
  bookingMaxAdvanceDays: number;
}

export interface ServiceInput {
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  depositType: DepositType;
  depositValue: number;
  active: boolean;
}

export interface StaffInput {
  name: string;
  active: boolean;
}

export interface WorkingHourInput {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface TimeBlockInput {
  startsAt: string;
  endsAt: string;
  reason?: string | null;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  errors?: Array<{ path?: string; message?: string }>;
}

/* Customer accounts (separate realm from the business panel). */

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
}

export interface CustomerAuthResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  customer: Customer;
}

export interface CustomerProfile extends Customer {
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface CustomerLoginInput {
  email: string;
  password: string;
}

export interface CustomerRegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface CustomerAppointment {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  staffName: string;
  priceCents: number;
  depositType: DepositType;
  depositValue: number;
  notes: string | null;
  createdAt: string;
  canCancel: boolean;
  cancellationHours: number;
  business: {
    name: string;
    slug: string;
    city: string | null;
    address: string | null;
    logoUrl: string | null;
    timezone: string;
  };
}

export interface CustomerAppointmentList {
  items: CustomerAppointment[];
  total: number;
}

export interface CustomerAppointmentInput {
  businessSlug: string;
  serviceId: string;
  startsAt: string;
  notes?: string;
}
