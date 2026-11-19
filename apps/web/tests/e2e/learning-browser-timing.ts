import { expect, type Locator, type Page } from "@playwright/test";

export type BrowserTiming = {
  eventToReadyMs: number;
  eventToFrameMs: number;
  busyFrameMs: number | null;
  documentChanged: boolean;
  driverMs: number;
};

/** Event → usable DOM → next rendering opportunity. Double rAF is not a paint trace or field INP. */
export async function installBrowserTiming(page: Page) {
  await page.addInitScript(() => {
    const key = "f07-browser-timing";
    type Pending = { selector: string; text?: string; start: number; origin: number; busyFrameMs: number | null };
    const now = () => performance.timeOrigin + performance.now();
    function watch(pending: Pending, button?: HTMLButtonElement) {
      const label = button?.textContent;
      let busyScheduled = false;
      function frame() {
        if (now() - pending.start > 30_000) return;
        if (button && !busyScheduled && (button.disabled || button.textContent !== label)) {
          busyScheduled = true;
          requestAnimationFrame(() => {
            pending.busyFrameMs = now() - pending.start;
            sessionStorage.setItem(key, JSON.stringify(pending));
          });
        }
        const target = [...document.querySelectorAll<HTMLElement>(pending.selector)].find(el => {
          const box = el.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== "hidden"
            && !el.matches(":disabled") && (!pending.text || el.textContent?.trim() === pending.text);
        });
        if (!target) { requestAnimationFrame(frame); return; }
        const eventToReadyMs = now() - pending.start;
        requestAnimationFrame(() => {
          sessionStorage.setItem(`${key}-result`, JSON.stringify({ eventToReadyMs,
            eventToFrameMs: now() - pending.start, busyFrameMs: pending.busyFrameMs,
            documentChanged: pending.origin !== performance.timeOrigin }));
          sessionStorage.removeItem(key);
        });
      }
      requestAnimationFrame(frame);
    }
    const previous = sessionStorage.getItem(key);
    if (previous) watch(JSON.parse(previous));
    document.addEventListener("click", event => {
      const control = (event.target as Element).closest<HTMLElement>("[data-f07-timing]");
      if (!control) return;
      const config = JSON.parse(control.dataset.f07Timing!);
      control.removeAttribute("data-f07-timing");
      const pending: Pending = { ...config, start: now(), origin: performance.timeOrigin, busyFrameMs: null };
      sessionStorage.removeItem(`${key}-result`);
      sessionStorage.setItem(key, JSON.stringify(pending));
      watch(pending, control instanceof HTMLButtonElement ? control : undefined);
    }, true);
  });
}

export async function measureClick(page: Page, control: Locator, selector: string, text?: string): Promise<BrowserTiming> {
  await control.evaluate((el, config) => { (el as HTMLElement).dataset.f07Timing = JSON.stringify(config); }, { selector, text });
  const start = performance.now();
  await control.click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("f07-browser-timing-result"))).not.toBeNull();
  const result = await page.evaluate(() => JSON.parse(sessionStorage.getItem("f07-browser-timing-result")!));
  return { ...result, driverMs: performance.now() - start };
}
