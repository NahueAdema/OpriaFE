import { LoginClient } from '../login/login-client';

/** Business registration entry: starts the auth card on the register tab. */
export const instant = true;

export default function RegisterPage() {
  return <LoginClient defaultMode="register" />;
}
