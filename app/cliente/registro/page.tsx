import { CustomerAuthClient } from '../auth-client';

/** Customer registration: starts the card on the register tab. */
export const instant = true;

export default function CustomerRegisterPage() {
  return <CustomerAuthClient defaultMode="register" />;
}
