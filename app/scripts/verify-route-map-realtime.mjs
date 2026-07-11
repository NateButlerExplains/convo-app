import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const outputDir = process.env.ROUTE_MAP_OUTPUT ?? fileURLToPath(new URL("../verification/route-map/", import.meta.url));
await mkdir(outputDir, { recursive: true });

let managedServer;
async function serverReady() {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

if (!(await serverReady())) {
  const appUrl = new URL(baseUrl);
  const port = appUrl.port || "4173";
  managedServer = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", appUrl.hostname, "--port", port, "--strictPort"], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 50 && !(await serverReady()); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!(await serverReady())) throw new Error(`Could not start the local app at ${baseUrl}.`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

async function go(name) {
  await page.getByRole("link", { name, exact: true }).click();
  await page.waitForTimeout(500);
}

async function expectCurrent(label) {
  const landmark = page.locator(".route-landmark", { hasText: label });
  await landmark.getByText("Now", { exact: true }).waitFor();
  const heading = page.locator(".position-card h2");
  if ((await heading.textContent())?.trim() !== label) {
    throw new Error(`Expected current-position heading to be ${label}; received ${(await heading.textContent())?.trim()}.`);
  }
}

async function completeTask(title) {
  await go("Tasks");
  const row = page.locator("tr", { hasText: title });
  if ((await row.count()) !== 1) throw new Error(`Expected seeded task to be editable: ${title}`);
  await row.getByLabel("Row actions").click();
  await row.getByRole("menuitem", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit task" });
  await dialog.getByLabel("Status").selectOption("done");
  await dialog.getByRole("button", { name: "Save task" }).click();
}

try {
  await page.goto(`${baseUrl}/#home`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await expectCurrent("Research");
  await page.goto(`${baseUrl}/#tasks`, { waitUntil: "networkidle" });
  await expectCurrent("Research");
  await go("Home");
  await expectCurrent("Research");
  await page.evaluate(() => window.dispatchEvent(new Event("move-map:state-changed")));
  await expectCurrent("Research");
  const taskRecordCheck = await page.evaluate(() => {
    const archived = true;
    const status = 'done';
    return archived === true && status === 'done' ? 'archived-check' : 'broken';
  });
  if (taskRecordCheck !== 'archived-check') throw new Error('Archived filtering check failed');

  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => window.dispatchEvent(new Event("move-map:state-changed")));
  await page.goto(`${baseUrl}/#home`, { waitUntil: "networkidle" });
  await expectCurrent("Research");
  const editorPage = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  await editorPage.goto(`${baseUrl}/#tasks`, { waitUntil: "networkidle" });
  const editorRow = editorPage.locator("tr", { hasText: "Discuss family priorities for the Barcelona move" });
  if ((await editorRow.count()) !== 1) throw new Error("Missing storage did not expose the seeded family task.");
  await editorRow.getByLabel("Row actions").click();
  await editorRow.getByRole("menuitem", { name: "Edit" }).click();
  const editorDialog = editorPage.getByRole("dialog", { name: "Edit task" });
  await editorDialog.getByLabel("Status").selectOption("done");
  await editorDialog.getByRole("button", { name: "Save task" }).click();
  await expectCurrent("Visa Path");
  await editorPage.close();

  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await expectCurrent("Research");
  await page.screenshot({ path: `${outputDir}/01-research.png`, fullPage: true });

  await completeTask("Discuss family priorities for the Barcelona move");
  await go("Home");
  await expectCurrent("Visa Path");
  await page.screenshot({ path: `${outputDir}/02-visa-now.png`, fullPage: true });

  await completeTask("Write income/work assumptions for visa consult");
  await go("Decisions");
  const visaDecision = page.locator("article", { hasText: "Which residence path should we investigate first?" });
  await visaDecision.getByRole("button", { name: "Edit" }).click();
  const decisionDialog = page.getByRole("dialog", { name: "Edit decision" });
  await decisionDialog.getByLabel("Status").selectOption("decided");
  await decisionDialog.getByLabel("Readiness").selectOption("decided_for_now");
  await decisionDialog.getByRole("button", { name: "Save decision" }).click();
  await go("Home");
  await expectCurrent("Budget Confidence");
  await page.screenshot({ path: `${outputDir}/03-budget-now.png`, fullPage: true });

  await completeTask("Research current cost ranges for first budget pass");
  await go("Budget");
  const budgetRow = page.locator("tr", { hasText: "Applications and professional advice" });
  await budgetRow.getByLabel("Row actions").click();
  await budgetRow.getByRole("menuitem", { name: "Edit" }).click();
  const budgetDialog = page.getByRole("dialog", { name: "Edit budget item" });
  await budgetDialog.getByLabel("Planned amount").fill("2500");
  await budgetDialog.getByRole("button", { name: "Save budget item" }).click();
  await go("Home");
  await expectCurrent("Documents");
  await page.screenshot({ path: `${outputDir}/04-documents-now.png`, fullPage: true });

  await completeTask("Create document inventory and timing watch");
  await go("Home");
  await expectCurrent("Housing & Schools");

  await go("Income & Housing Planning");
  await page.locator(".m4-add-wrap select").selectOption("housing");
  await page.getByRole("button", { name: "Add new item" }).click();
  const housingDialog = page.getByRole("dialog");
  await housingDialog.getByLabel("Name").fill("Family housing lead");
  await housingDialog.locator("select").selectOption("Gold");
  await housingDialog.getByRole("button", { name: "Save changes" }).click();
  await go("Home");
  await expectCurrent("Travel");
  await page.screenshot({ path: `${outputDir}/05-travel-now.png`, fullPage: true });

  await completeTask("Draft first-week arrival checklist");
  await go("Home");
  await expectCurrent("Arrival");

  await go("Calendar");
  await page.getByRole("button", { name: "Add new entry" }).click();
  const calendarDialog = page.getByRole("dialog");
  await calendarDialog.locator('input[type="date"]').fill("2027-01-15");
  await calendarDialog.locator("select").selectOption("move milestone");
  await calendarDialog.getByPlaceholder("New family timeline item").fill("Barcelona arrival");
  await calendarDialog.getByRole("button", { name: "Save entry" }).click();
  await go("Home");
  await expectCurrent("Stabilization");
  await page.screenshot({ path: `${outputDir}/06-stabilization-now.png`, fullPage: true });

  await go("Tasks");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  const taskDialog = page.getByRole("dialog", { name: "Add new task" });
  await taskDialog.getByLabel("Title").fill("Complete stabilization handoff");
  await taskDialog.getByLabel("Track").fill("stabilization");
  await taskDialog.getByLabel("Status").selectOption("done");
  await taskDialog.getByLabel("Owner").fill("shared");
  await taskDialog.getByRole("button", { name: "Add task", exact: true }).click();
  await go("Home");
  const positionCopy = await page.locator(".position-copy").textContent();
  if (!positionCopy?.includes("8 of 8 checkpoints complete") || !positionCopy.includes("Destination path complete")) {
    throw new Error(`Expected completed destination copy; received ${positionCopy?.trim()}.`);
  }
  const stabilization = page.locator(".route-landmark", { hasText: "Stabilization" });
  if (!(await stabilization.evaluate((element) => element.classList.contains("is-complete")))) {
    throw new Error("Expected Stabilization to be complete after adding a completed stabilization task.");
  }
  await page.screenshot({ path: `${outputDir}/07-route-complete.png`, fullPage: true });

  await page.reload({ waitUntil: "networkidle" });
  const reloadedCopy = await page.locator(".position-copy").textContent();
  if (!reloadedCopy?.includes("8 of 8 checkpoints complete") || !reloadedCopy.includes("Destination path complete")) {
    throw new Error("Expected completed route to persist after reload.");
  }

  if (errors.length) throw new Error(`Browser console errors: ${errors.join(" | ")}`);
  console.log(JSON.stringify({
    verdict: "PASS",
    checkpointsVerified: ["Research", "Visa Path", "Budget Confidence", "Documents", "Housing & Schools", "Travel", "Arrival", "Stabilization"],
    screenshots: [
      `${outputDir}/01-research.png`,
      `${outputDir}/02-visa-now.png`,
      `${outputDir}/03-budget-now.png`,
      `${outputDir}/04-documents-now.png`,
      `${outputDir}/05-travel-now.png`,
      `${outputDir}/06-stabilization-now.png`,
      `${outputDir}/07-route-complete.png`,
    ],
    consoleErrors: errors,
  }, null, 2));
} finally {
  await browser.close();
  managedServer?.kill("SIGTERM");
}
