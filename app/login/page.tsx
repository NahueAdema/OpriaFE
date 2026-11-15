import { LoginClient } from './login-client';

/** Business login: opt into instant-navigation validation explicitly. */
export const instant = true;

export default function LoginPage() {
  return <LoginClient defaultMode="login" />;
}
