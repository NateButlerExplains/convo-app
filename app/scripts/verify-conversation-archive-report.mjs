import fs from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "src", "views", "ConversationView.tsx");
const cssPath = path.join(process.cwd(), "src", "styles.css");
const source = fs.readFileSync(filePath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

const checks = [
  {
    label: "Listener queue starts empty for new sessions",
    test: source.includes("const emptyNotes: Note[] = [];") && source.includes("const [notes, setNotes] = useState<Note[]>(emptyNotes);") && source.includes("setNotes(emptyNotes);"),
  },
  {
    label: "Archived sessions store a report payload",
    test: source.includes("report: finalReport"),
  },
  {
    label: "Archive summary reads archived total duration from report",
    test: source.includes("formatClock(session.report.totalSeconds)"),
  },
  {
    label: "Archive renders speaking totals from archived report",
    test: source.includes("session.report.speakingTotals.Nate") && source.includes("session.report.speakingTotals.Shae"),
  },
  {
    label: "Archive renders interrupt usage from archived report",
    test: source.includes("session.report.interruptsUsed.Nate") && source.includes("session.report.interruptsUsed.Shae"),
  },
  {
    label: "Archive renders notes with resolved state",
    test: source.includes("session.report.notes.map") && source.includes("noteStateLabel(note)"),
  },
  {
    label: "Archive shows empty note copy when no notes were created",
    test: source.includes("No notes were created in this session."),
  },
  {
    label: "Interrupt disables visibly when the interrupter is out of tokens",
    test: source.includes("const interruptDisabled = status !== \"active\" || interrupts[interruptActor] >= interruptTokens;") && source.includes("className={interruptDisabled ? \"interrupt-button is-disabled\" : \"interrupt-button\"}") && css.includes(".interrupt-button:disabled,") && css.includes("cursor: not-allowed;"),
  },
  {
    label: "Interrupt switches away from the current speaker to the interrupter",
    test: source.includes("const interruptActor = currentSpeaker === \"Nate\" ? \"Shae\" : \"Nate\";") && source.includes("[interruptActor]: current[interruptActor] + 1") && source.includes("setCurrentSpeaker(interruptActor);") && source.includes("interrupted"),
  },
  {
    label: "Current speaker bubble no longer uses glow or pulse animation",
    test: !css.includes(".current-speaker-nate::after") && !css.includes("animation: pulse-recording 1.25s ease-in-out infinite;") && source.includes("active meter shows who has the floor right now"),
  },
  {
    label: "Active speaker meter glow is stronger and green",
    test: css.includes(".speaker-meter.glow") && css.includes("rgba(40, 144, 96") && css.includes("0 0 52px rgba(96, 211, 142, .22)"),
  },
  {
    label: "Live report also exposes total duration",
    test: source.includes("formatClock(reportItems.totalSeconds)"),
  },
];

let failed = false;
for (const check of checks) {
  const status = check.test ? "PASS" : "FAIL";
  console.log(`${status}: ${check.label}`);
  if (!check.test) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("Conversation refinement verification passed.");
