import Cheeky from "cheeky-async";
import puppeteer from "puppeteer-extra";
import BlockResourcesPlugin from "puppeteer-extra-plugin-block-resources";

puppeteer.use(BlockResourcesPlugin({ blockedTypes: new Set(["stylesheet", "font", "image"]) }));

let timeout = setTimeout(() => {
  process.exit(1);
}, 300000);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://foundryvtt.com/admin/", { waitUntil: "domcontentloaded" });

  // login if needed
  if (page.url().includes("login")) {
    await page.type("#id_username", process.env.FOUNDRY_USER);
    await page.type("#id_password", process.env.FOUNDRY_PWD);
    await page.click('input[type="submit"]');
    await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  }

  // go to packages screen
  await page.goto("https://foundryvtt.com/admin/packages/package/", { waitUntil: "domcontentloaded" });

  await Cheeky.some(await page.$$(".results .field-name a"), async (el) => {
    if ((await el.evaluate((node) => node.innerText)) === process.env.MODULE_ID) {
      await el.click();
      await page.waitForNavigation({ waitUntil: "domcontentloaded" });
      return true;
    }
  });

  const selector = ".form-row.dynamic-versions:not(.has_original) ";
  await page.type(selector + 'input[id$="-version"]', process.env.MODULE_VERSION);
  await page.type(selector + 'input[id$="-manifest"]', process.env.MODULE_MANIFEST);
  await page.type(selector + 'input[id$="-notes"]', process.env.MODULE_CHANGELOG);
  await page.type(selector + 'input[id$="-required_core_version"]', proces.env.MODULE_MIN_CORE);
  await page.type(selector + 'input[id$="-compatible_core_version"]', process.env.MODULE_COMP_CORE);

  await page.click('input[type="submit"][name="_save"]');
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  await browser.close();
  clearTimeout(timeout);
})();
