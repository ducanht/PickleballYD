import { test, expect } from "@playwright/test";

// IMPORTANT: Use "domcontentloaded" NOT "networkidle"
// Firebase keeps retrying connections -> network never idles

test.describe("Public Dashboard", () => {
  test("trang chu load va hien thi heading", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000); // Allow React to mount
    const headings = page.locator("h1, h2, h3");
    await expect(headings.first()).toBeVisible({ timeout: 12000 });
  });

  test("footer hien thi voi copyright", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    const footer = page.locator("footer");
    await expect(footer).toBeVisible({ timeout: 12000 });
    await expect(footer).toContainText("2026");
  });

  test("app render content (khong blank)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2500);
    const root = page.locator("#root");
    const html = await root.innerHTML();
    expect(html.length).toBeGreaterThan(100);
  });
});

test.describe("Login Page", () => {
  test("trang login load dung", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const body = await page.locator("body").textContent();
    expect(body!.length).toBeGreaterThan(10);
  });

  test("co input email hoac text", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const emailInput = page.locator("input[type=email], input[type=text]").first();
    await expect(emailInput).toBeVisible({ timeout: 12000 });
  });

  test("co it nhat 1 nut", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("SPA Navigation", () => {
  const routes = ["/tournaments", "/finance", "/members", "/admin"];

  for (const route of routes) {
    test(`route ${route} render content`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      const root = page.locator("#root");
      const html = await root.innerHTML();
      expect(html.length).toBeGreaterThan(50);
    });
  }
});

test.describe("CSS Design System", () => {
  test(".card class co background style", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const result = await page.evaluate(() => {
      const div = document.createElement("div");
      div.className = "card";
      document.body.appendChild(div);
      const bg = getComputedStyle(div).backgroundColor;
      const borderColor = getComputedStyle(div).borderColor;
      document.body.removeChild(div);
      return { bg, borderColor };
    });
    // Card phai co background khac trong suot
    expect(result.bg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test(".btn-primary co gradient background", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const bgImage = await page.evaluate(() => {
      const btn = document.createElement("button");
      btn.className = "btn-primary";
      document.body.appendChild(btn);
      const bg = getComputedStyle(btn).backgroundImage;
      document.body.removeChild(btn);
      return bg;
    });
    expect(bgImage).toContain("gradient");
  });

  test(".animate-fade-in-up animation duoc dinh nghia", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const animName = await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "animate-fade-in-up";
      document.body.appendChild(el);
      const anim = getComputedStyle(el).animationName;
      document.body.removeChild(el);
      return anim;
    });
    expect(animName).not.toBe("none");
    expect(animName).not.toBe("");
  });

  test(".badge-green co mau xanh", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    const color = await page.evaluate(() => {
      const el = document.createElement("span");
      el.className = "badge badge-green";
      document.body.appendChild(el);
      const c = getComputedStyle(el).color;
      document.body.removeChild(el);
      return c;
    });
    // badge-green phai co mau khac den
    expect(color).not.toBe("rgb(0, 0, 0)");
    expect(color).not.toBe("");
  });
});

test.describe("Mobile Responsive (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("trang chu khong co horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 10;
    });
    expect(overflow).toBeFalsy();
  });
});
