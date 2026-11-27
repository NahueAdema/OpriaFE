import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const paths = [
  { path: '/', name: 'landing' },
  { path: '/cliente', name: 'buscador de negocios' },
  { path: '/reservar', name: 'reserva' },
  { path: '/login', name: 'ingreso' },
  { path: '/registro', name: 'registro' },
];

for (const { path, name } of paths) {
  test(`${name}: sin violaciones WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test('el buscador público permite filtrar y navegar con teclado', async ({
  page,
}) => {
  await page.goto('/reservar');

  const search = page.getByRole('search', {
    name: 'Buscar negocios para reservar',
  });
  await expect(search).toBeVisible();

  const input = page.getByRole('textbox', { name: 'Buscar negocio' });
  await input.focus();
  await input.fill('aurora');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Buscar' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByText(/negocios?/).first()).toBeVisible();
});
