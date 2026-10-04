import { test, expect } from '../fixtures';
import { queryOne } from '@core/db/oracle';
import { ESTABLISHMENT_QUERIES, type EstablishmentRow } from '../data/queries';

test.describe('Establishment — profile', () => {
  test('shows the establishment picked from the DB @regression', async ({ page }) => {
    const est = await queryOne<EstablishmentRow>(ESTABLISHMENT_QUERIES.activeEstablishment);

    await page.goto(`/establishment/${est.registrationNo}/profile`);
    await expect(page.getByText(est.nameEn)).toBeVisible();
  });
});
