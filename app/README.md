# Barcelona Move Map M1 Prototype

Private localhost prototype for planning a possible family move from Malden, Missouri to Barcelona around January 2027.

## Run Locally

```bash
npm install
npm run dev
```

Then open the localhost URL printed by Vite. The dev server is configured for `127.0.0.1`.

## Manual Data Editing

M1 is read-only in the browser. Edit planning data in:

```text
app/src/data/move-map-data.json
```

Save the file and refresh the browser if hot reload does not update immediately. Keep IDs stable and human-readable. Use `null`, empty strings, or empty arrays for unknown values.

## Privacy Notes

This prototype is designed for local use only. Do not add cloud services, analytics, external maps, remote fonts, or runtime API calls. Do not store sensitive details such as passport numbers, SSNs, bank account numbers, medical records, scans, or private identifiers in M1 data. Use placeholders until a separate privacy review approves more.

## Exports

Use **Print / Save as PDF** for browser print snapshots. Use **Download JSON snapshot** for a local data snapshot. Exports stay on your machine unless you share them.

## Checks

```bash
npm run typecheck
npm run build
```
