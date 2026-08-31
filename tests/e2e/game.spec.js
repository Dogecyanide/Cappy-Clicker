import { expect, test } from '@playwright/test';

function watchRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`);
  });
  return errors;
}

async function freshGame(page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('cappy-e2e-started')) {
      localStorage.removeItem('cappy-clicker-v2');
      sessionStorage.setItem('cappy-e2e-started', 'yes');
    }
  });
  await page.goto('/');
  await expect(page).toHaveTitle('Cappy Clicker');
  await expect(page.locator('[data-cappy-button]')).toBeVisible();
}

async function openLab(page) {
  await page.getByRole('button', { name: 'Lab', exact: true }).click();
  await expect(page.locator('[data-dev-dialog]')).toBeVisible();
}

async function closeLab(page) {
  await page.locator('[data-dev-dialog] button[value="close"]').last().click();
  await expect(page.locator('[data-dev-dialog]')).not.toBeVisible();
}

test('fresh voyage: click, producer, milestone upgrade, achievement, and Power Moon', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await freshGame(page);
  await expect(page.locator('[data-coins]')).toHaveText('0');

  const cappy = page.locator('[data-cappy-button]');
  for (let index = 0; index < 15; index += 1) await cappy.click({ force: true });
  await expect(page.locator('[data-coins]')).not.toHaveText('0');

  const frog = page.locator('[data-producer-card="frog-capture"]');
  await frog.locator('[data-buy="1"]').click();
  await expect(frog.locator('[data-owned]')).toHaveText('1');
  await expect(page.locator('[data-cps]')).not.toHaveText('0');

  await openLab(page);
  await page.locator('[data-dev-dialog] [name="coins"]').fill('1e6');
  await page.locator('[data-dev="add-coins"]').click();
  await page.locator('[data-dev-dialog] [name="amount"]').fill('5');
  await page.locator('[data-dev="set-producer"]').click();
  await closeLab(page);

  const firstUpgrade = page.locator('[data-buy-upgrade="frog-capture--5"]');
  await expect(firstUpgrade).toBeVisible();
  await expect(firstUpgrade).toBeEnabled();
  await firstUpgrade.click();
  await expect(page.locator('.installed-section .count-pill')).toHaveText('1/140');
  await expect(page.locator('[data-badges]')).toHaveText(/[1-9]\d*\/250/);

  await page.locator('[data-tab="moons"]').click();
  const firstMoon = page.locator('[data-buy-moon="moon-first-stamp"]');
  await expect(firstMoon).toBeEnabled();
  await firstMoon.click();
  await expect(page.locator('.moon-count')).toHaveText('1/16');
  await expect(frog.locator('[data-each-rate]')).not.toHaveText('0.8');
  expect(errors).toEqual([]);
});

test('King Boo stays top-right, can be ignored, and keeps a committed spin across reload', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await freshGame(page);

  await page.evaluate(() => window.cappyClicker.debug.spawnBoo());
  const boo = page.locator('[data-boo-widget]');
  await expect(boo).toHaveClass(/is-visible/);
  const box = await boo.boundingBox();
  expect(box.x + box.width).toBeGreaterThan(1440 * 0.8);
  expect(box.y).toBeLessThan(250);
  expect(box.height).toBeLessThan(500);

  await page.evaluate(() => window.cappyClicker.store.mutate('e2e-expire-boo', (state) => {
    state.boo.visibleUntil = Date.now() - 1;
  }));
  await expect(boo).not.toHaveClass(/is-visible/);
  await expect.poll(() => page.evaluate(() => window.cappyClicker.store.state.stats.booIgnored)).toBe(1);

  const symbolsBefore = await page.evaluate(() => {
    window.cappyClicker.debug.forceBoo('royal-jackpot');
    window.cappyClicker.save();
    return [...window.cappyClicker.store.state.boo.committedSpin.symbols];
  });
  await expect(page.locator('.boo-machine.is-spinning')).toBeVisible();
  const reelIterations = await page.locator('.slot-reel span').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationIterationCount));
  expect(new Set(reelIterations).size).toBe(3);

  await page.reload();
  const symbolsAfter = await page.evaluate(() => [...window.cappyClicker.store.state.boo.committedSpin.symbols]);
  expect(symbolsAfter).toEqual(symbolsBefore);
  await expect(page.locator('.boo-machine.is-result')).toBeVisible({ timeout: 7_000 });
  await expect(boo.getByRole('heading', { name: 'Royal Flush-ish' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('triple-Boo catastrophe charges once and its curse survives reload', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await freshGame(page);
  await openLab(page);
  await page.locator('[data-dev-dialog] [name="coins"]').fill('1000000');
  await page.locator('[data-dev="add-coins"]').click();
  await page.locator('[data-dev-dialog] [name="amount"]').fill('10');
  await page.locator('[data-dev="set-producer"]').click();
  await page.locator('[data-dev="boo-catastrophe"]').click();
  await closeLab(page);

  await expect(page.locator('.boo-machine.is-result')).toBeVisible({ timeout: 7_000 });
  await expect(page.getByRole('heading', { name: 'THE HOUSE ALWAYS WINS' })).toBeVisible();
  await expect(page.locator('.slot-reel')).toHaveText(['👻', '👻', '👻']);
  await expect(page.locator('.boo-result__receipt')).toContainText('Casino charge');
  await expect(page.locator('body')).toHaveClass(/has-purple-curse/);
  await expect(page.locator('[data-cps]')).toHaveText('0');
  const lossBeforeReload = await page.evaluate(() => window.cappyClicker.store.state.stats.booCoinsLost.toString());

  await page.reload();
  await expect(page.locator('body')).toHaveClass(/has-purple-curse/);
  await expect(page.locator('[data-cps]')).toHaveText('0');
  const lossAfterReload = await page.evaluate(() => window.cappyClicker.store.state.stats.booCoinsLost.toString());
  expect(lossAfterReload).toBe(lossBeforeReload);
  expect(errors).toEqual([]);
});

test('mobile and ultrawide layouts avoid overflow and use the available canvas', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await page.setViewportSize({ width: 320, height: 812 });
  await freshGame(page);
  const mobile = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.width);
  await expect(page.locator('[data-cappy-button]')).toBeVisible();

  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.reload();
  const wide = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(wide.scrollWidth).toBeLessThanOrEqual(wide.width);
  const layout = await page.locator('.game-layout').boundingBox();
  expect(layout.width).toBeGreaterThan(2_200);
  expect(errors).toEqual([]);
});
