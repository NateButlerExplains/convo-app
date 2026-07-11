import { chromium } from "playwright";

const routes = [
  ["calendar", "Family move calendar"],
  ["decisions", "Decision cards"],
  ["income", "Income Planning"],
  ["housing", "Housing Planning"],
  ["budget", "Budget planner"],
  ["expenses", "Editable expense surface"],
  ["tasks", "Next steps"],
  ["options", "Compare possible paths"],
  ["ideas", "Keep track of open ideas"],
  ["risks", "Uncertainty with a next action"],
];

const baseUrl = process.env.VERIFY_BASE_URL ?? "http://127.0.0.1:5174";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

for (const [route, title] of routes) {
  await page.goto(`${baseUrl}/#${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);
  await page.getByRole("heading", { name: title }).first().waitFor({ timeout: 5000 });
}

await page.goto(`${baseUrl}/#calendar`, { waitUntil: "networkidle" });
await page.waitForTimeout(250);
await page.screenshot({ path: "verification/page-cleanup/calendar.png", fullPage: true });

await page.goto(`${baseUrl}/#decisions`, { waitUntil: "networkidle" });
await page.waitForTimeout(250);
const decisionAddButtons = await page.getByRole("button", { name: /new decision|add a decision/i }).count();
await page.screenshot({ path: "verification/page-cleanup/decisions.png", fullPage: true });
if (decisionAddButtons !== 0) throw new Error(`Decisions add button still visible: ${decisionAddButtons}`);

await page.goto(`${baseUrl}/#m4`, { waitUntil: "networkidle" });
await page.waitForTimeout(250);
await page.getByRole("heading", { name: "Home" }).first().waitFor({ timeout: 5000 });
const m4Heading = await page.locator("h1").first().textContent();
if (m4Heading?.includes("Income & Housing Planning")) throw new Error("Combined Income & Housing Planning route still resolves");

if (consoleErrors.length > 0) throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
await browser.close();
console.log("page cleanup verification passed");
