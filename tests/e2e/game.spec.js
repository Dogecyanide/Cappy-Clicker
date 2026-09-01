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
  await expect(page.locator('[data-coins]')).toHaveText('0.000');

  const cappy = page.locator('[data-cappy-button]');
  for (let index = 0; index < 15; index += 1) await cappy.click({ force: true });
  await expect(page.locator('[data-coins]')).not.toHaveText('0.000');

  const frog = page.locator('[data-producer-card="frog-capture"]');
  await frog.locator('[data-buy="1"]').click();
  await expect(frog.locator('[data-owned]')).toHaveText('1');
  await expect(page.locator('[data-cps]')).not.toHaveText('0.000');

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
  await expect(page.locator('.installed-section .count-pill')).toHaveText('1/480');
  await expect(page.locator('[data-badges]')).toHaveText(/[1-9]\d*\/700/);

  await page.locator('[data-tab="moons"]').click();
  const firstMoon = page.locator('[data-buy-moon="moon-first-stamp"]');
  await expect(firstMoon).toBeEnabled();
  await firstMoon.click();
  await expect(page.locator('.moon-count')).toHaveText('1/50');
  await expect(frog.locator('[data-each-rate]')).not.toHaveText('0.800');
  expect(errors).toEqual([]);
});

test('critical tosses show their larger payout without bringing back a CRITICAL label', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await freshGame(page);

  await page.evaluate(() => { Math.random = () => 1; });
  await page.locator('[data-cappy-button]').click({ force: true });
  await expect(page.locator('.click-pop.is-active')).toHaveCount(1);

  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator('[data-cappy-button]').click({ force: true });

  await expect.poll(() => page.evaluate(() => window.cappyClicker.store.state.stats.criticalClicks)).toBe(1);
  await expect(page.locator('[data-cappy-button]')).toHaveClass(/is-critical/);
  await expect(page.locator('.click-pop.is-critical-value')).toHaveCount(1);
  await expect(page.locator('.click-pop.is-critical-value')).toHaveText(/^\+\d+\.\d{3}/);
  await expect(page.locator('[data-click-feedback]')).not.toContainText('CRITICAL');
  expect(await page.evaluate(() => window.cappyClicker.store.state.coins.gte(6))).toBe(true);
  expect(errors).toEqual([]);
});

test('sustained rapid tosses keep exact mechanics while bounding whole-page refreshes', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await freshGame(page);
  const burst = await page.evaluate(() => {
    Math.random = () => 1;
    const button = document.querySelector('[data-cappy-button]');
    const store = window.cappyClicker.store;
    const clicksBefore = store.state.stats.totalClicks;
    const revisionBefore = store.revision;
    const started = performance.now();
    for (let index = 0; index < 250; index += 1) {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 120, clientY: 220 }));
    }
    return {
      elapsed: performance.now() - started,
      clicks: store.state.stats.totalClicks - clicksBefore,
      immediateRevisions: store.revision - revisionBefore,
      activeFeedback: document.querySelectorAll('.click-pop.is-active').length,
      mechanicsAligned: store.state.coins.eq(store.state.stats.coinsFromClicks)
        && store.state.lifetimeCoins.eq(store.state.stats.coinsFromClicks),
    };
  });

  expect(burst.clicks).toBe(250);
  expect(burst.immediateRevisions).toBe(1);
  expect(burst.activeFeedback).toBeLessThanOrEqual(12);
  expect(burst.mechanicsAligned).toBe(true);
  expect(burst.elapsed).toBeLessThan(1_000);
  await expect.poll(() => page.evaluate(() => window.cappyClicker.store.state.stats.totalClicks)).toBe(250);
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

test('King Boo accepts one deliberately held click while the countdown updates', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await freshGame(page);
  await page.evaluate(() => window.cappyClicker.debug.spawnBoo());

  const spinButton = page.locator('[data-spin-boo]');
  await expect(spinButton).toBeVisible();
  await spinButton.hover();
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.up();

  await expect(page.locator('.boo-machine.is-spinning')).toBeVisible();
  await expect(spinButton).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.cappyClicker.store.state.stats.booSpins)).toBe(1);
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
  await expect(page.locator('[data-cps]')).toHaveText('0.000');
  const lossBeforeReload = await page.evaluate(() => window.cappyClicker.store.state.stats.booCoinsLost.toString());

  await page.reload();
  await expect(page.locator('body')).toHaveClass(/has-purple-curse/);
  await expect(page.locator('[data-cps]')).toHaveText('0.000');
  const lossAfterReload = await page.evaluate(() => window.cappyClicker.store.state.stats.booCoinsLost.toString());
  expect(lossAfterReload).toBe(lossBeforeReload);
  expect(errors).toEqual([]);
});

test('Developer Lab can preview both Shines and apply an exact outcome', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await freshGame(page);

  await openLab(page);
  await page.locator('[data-dev="shine-normal"]').click();
  await closeLab(page);
  await expect(page.locator('.shine-widget')).toHaveClass(/is-visible/);
  await expect(page.locator('.shine-target')).not.toHaveClass(/is-corrupted/);

  await openLab(page);
  await page.locator('[data-dev="shine-gloom"]').click();
  await closeLab(page);
  await expect(page.locator('.shine-target')).toHaveClass(/is-corrupted/);

  await openLab(page);
  await page.locator('[data-dev-dialog] [name="coins"]').fill('1000');
  await page.locator('[data-dev="add-coins"]').click();
  await page.locator('[name="shine"]').selectOption('gloom-toll');
  await page.locator('[data-dev="shine-force"]').click();
  await expect(page.locator('[data-dev-output]')).toContainText('Gloom Toll');
  await expect(page.locator('[data-shine-receipt]')).toContainText('Gloom Toll');
  await expect(page.locator('[data-shine-receipt-reward]')).toContainText('−120.000 Kingdom Coins');
  await expect.poll(() => page.evaluate(() => window.cappyClicker.store.state.stats.shineOutcomeCounts['gloom-toll'])).toBe(1);
  expect(errors).toEqual([]);
});

test('mobile and ultrawide layouts avoid overflow and use the available canvas', async ({ page }) => {
  const errors = watchRuntimeErrors(page);
  await page.setViewportSize({ width: 320, height: 812 });
  await freshGame(page);
  const mobile = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    cappyOverflow: getComputedStyle(document.querySelector('.cappy-column')).overflowY,
    panelOverscroll: getComputedStyle(document.querySelector('.rail-panel:not([hidden])')).overscrollBehaviorY,
  }));
  expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.width);
  expect(mobile.cappyOverflow).toBe('visible');
  expect(mobile.panelOverscroll).toBe('auto');
  await expect(page.locator('[data-cappy-button]')).toBeVisible();
  const mobileModuleOrder = await page.evaluate(() => ({
    collectionsTop: document.querySelector('[data-right-rail]').getBoundingClientRect().top,
    producersTop: document.querySelector('.producer-shop').getBoundingClientRect().top,
  }));
  expect(mobileModuleOrder.collectionsTop).toBeLessThan(mobileModuleOrder.producersTop);

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.reload();
  const shortDesktop = await page.evaluate(() => {
    const column = document.querySelector('.cappy-column');
    const deck = document.querySelector('[data-flight-deck]');
    const rail = document.querySelector('[data-right-rail]').getBoundingClientRect();
    return {
      columnClientHeight: column.clientHeight,
      columnScrollHeight: column.scrollHeight,
      deckClientHeight: deck.clientHeight,
      deckScrollHeight: deck.scrollHeight,
      railBottom: rail.bottom,
    };
  });
  expect(shortDesktop.columnScrollHeight).toBeGreaterThan(shortDesktop.columnClientHeight);
  expect(shortDesktop.deckClientHeight).toBeGreaterThan(200);
  expect(shortDesktop.deckScrollHeight).toBeLessThanOrEqual(shortDesktop.deckClientHeight + 1);
  expect(shortDesktop.railBottom).toBeLessThanOrEqual(721);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  const desks = await page.evaluate(() => {
    const rail = document.querySelector('[data-right-rail]').getBoundingClientRect();
    const cappy = document.querySelector('.cappy-column');
    const shop = document.querySelector('.producer-shop');
    return {
      railBottom: rail.bottom,
      railOverflow: getComputedStyle(document.querySelector('.rail-panel:not([hidden])')).overflowY,
      cappyOverflow: getComputedStyle(cappy).overflowY,
      shopOverflow: getComputedStyle(shop).overflowY,
      fuelMaximum: document.querySelector('[data-fuel-depth]').getAttribute('aria-valuemax'),
    };
  });
  expect(desks.railBottom).toBeLessThanOrEqual(901);
  expect(desks.railOverflow).toBe('auto');
  expect(desks.cappyOverflow).toBe('auto');
  expect(desks.shopOverflow).toBe('auto');
  expect(desks.fuelMaximum).toBe('100');

  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.reload();
  const wide = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(wide.scrollWidth).toBeLessThanOrEqual(wide.width);
  const layout = await page.locator('.game-layout').boundingBox();
  expect(layout.width).toBeGreaterThan(2_200);
  expect(errors).toEqual([]);
});
