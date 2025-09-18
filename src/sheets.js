import * as fs from 'node:fs';
import * as XLSX from 'xlsx/xlsx.mjs';
import { DateTime } from 'luxon';

XLSX.set_fs(fs);

const DEFAULT_SHEET = 'Results';
const HEADERS = ['Date', 'Game', 'Phase', 'Result', 'InsertedAt'];

// Load workbook or create a new one with headers
export function loadWorkbook(excelPath) {
  let wb;
  if (fs.existsSync(excelPath)) {
    wb = XLSX.readFile(excelPath);
  } else {
    wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
    XLSX.utils.book_append_sheet(wb, ws, DEFAULT_SHEET);
    XLSX.writeFile(wb, excelPath);
  }
  return wb;
}

export function ensureSheet(wb, sheetName = DEFAULT_SHEET) {
  let ws = wb.Sheets[sheetName];
  if (!ws) {
    ws = XLSX.utils.aoa_to_sheet([HEADERS]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  } else {
    // Ensure headers exist and in proper order
    const firstRow = XLSX.utils.sheet_to_json(ws, { header: 1, range: { s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } } })[0] || [];
    const needsHeader = HEADERS.some((h, i) => firstRow[i] !== h);
    if (needsHeader) {
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const rows = [HEADERS, ...data.map(r => HEADERS.map(h => r[h] ?? ''))];
      ws = XLSX.utils.aoa_to_sheet(rows);
      wb.Sheets[sheetName] = ws;
    }
  }
  return ws;
}

export function existingKeys(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }); // [{Date, Game, Phase, Result, InsertedAt}]
  const set = new Set();
  for (const r of rows) {
    if (r.Game && r.Phase) {
      set.add(`${r.Game}__${r.Phase}`);
    }
  }
  return set;
}

export function appendRows(wb, ws, excelPath, items, tz = 'Asia/Dubai', sheetName = DEFAULT_SHEET) {
  const now = DateTime.now().setZone(tz).toISO();
  // Current data (excluding header if present)
  const existing = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const newRows = items.map(x => ({
    Date: x.dateISO,
    Game: x.game,
    Phase: x.phase,
    Result: x.result,
    InsertedAt: now
  }));
  const all = existing.concat(newRows);
  // Build a sheet with headers in the correct order
  const headerRow = XLSX.utils.aoa_to_sheet([HEADERS]);
  const merged = XLSX.utils.sheet_add_json(headerRow, all, { origin: 'A2', header: HEADERS, skipHeader: true });
  wb.Sheets[sheetName] = merged;
  if (!wb.SheetNames.includes(sheetName)) wb.SheetNames.push(sheetName);
  XLSX.writeFile(wb, excelPath);
}
