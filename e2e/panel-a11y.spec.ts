import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** El panel es client-side: una sesión sintética alcanza para verificar a11y. */
async function signIn(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'opria.auth.v1',
      JSON.stringify({
        accessToken:
          'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhYmMtYWJjIiwiY2xpZW50X2lkIjoiYWRtaW4iLCJ0ZW5hbnRJZCI6InRlbmFudC0xMjMifQ.invalid',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { id: 'user-123', email: 'dueño@example.com', name: 'Dueño' },
        tenant: {
          id: 'tenant-123',
          name: 'Negocio de pruebas',
          slug: 'negocio-de-pruebas',
          role: 'owner',
        },
      }),
    );
  });
}

for (const path of ['/dashboard', '/agenda', '/clientes']) {
  test(`panel ${path}: sin violaciones WCAG 2.1 AA`, async ({ page }) => {
    await signIn(page);
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test('el modal de acceso tiene roles de pestaña accesibles', async ({ page }) => {
  await page.goto('/login');
  // Esperamos a la hidratación: antes, los botones son solo HTML del server.
  await page.waitForLoadState('networkidle');

  const loginTab = page.getByRole('tab', { name: 'Iniciar sesión' });
  const registerTab = page.getByRole('tab', { name: 'Crear cuenta' });

  await expect(loginTab).toHaveAttribute('aria-selected', 'true');
  await registerTab.click();
  await expect(registerTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Crear cuenta' })).toBeVisible();
});
