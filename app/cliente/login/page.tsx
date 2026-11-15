import { CustomerAuthClient } from '../auth-client';

/** Customer login: opt into instant-navigation validation explicitly. */
export const instant = true;

export default function CustomerLoginPage() {
  return <CustomerAuthClient defaultMode="login" />;
}
