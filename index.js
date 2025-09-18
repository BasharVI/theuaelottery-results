import 'dotenv/config';
import axios from 'axios';
import * as fs from 'node:fs';
import * as XLSX from 'xlsx/xlsx.mjs';
import { DateTime } from 'luxon';

XLSX.set_fs(fs); 

const EXCEL_FILE = 'results.xlsx';
const SHEET = 'Results';
const TZ = 'Asia/Dubai';

const P3_URL = process.env.P3_URL;  // Pick 3
const P4_URL = process.env.P4_URL;  // Pick 4 (same JSON shape, different endpoint)

// ---- main ----
(async () => {
  const items = [];
  const p3 = await fetchLatestFromHistory('Pick 3', P3_URL).catch(e => warn('Pick 3', e));
  const p4 = await fetchLatestFromHistory('Pick 4', P4_URL).catch(e => warn('Pick 4', e));

  if (p3) items.push(p3);
  if (p4) items.push(p4);

  if (items.length === 0) {
    console.log('No items to write/post.');
    return;
  }

  const toAppend = items
    .filter(r => !existsInExcel(r.game, r.phase))
    .map(r => [r.drawDateISO, r.game, r.phase, r.numbers, nowISO()]);

  if (toAppend.length) {
    appendRows(toAppend);
    // console.log('Appended rows:', toAppend);
  } else {
    console.log('All latest results already recorded. Skipping Excel write.');
  }

  // Post to Telegram 
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
      for (const r of items) {
          await postTelegram(formatTelegram(r));
    }
  }
})();

// ---- helpers ----
async function fetchLatestFromHistory(game, url) {
  if (!url) return null;
  const { data } = await axios.get(url, { timeout: 15000 });

  // Shape from your sample:
  // { data: { prizeHistory: [{ phase, nums, allOrderDrawn, expectedPrizeTime, expectedPrizeTimestamp }, ...] } }
  const hist = data?.data?.prizeHistory;
  if (!Array.isArray(hist) || hist.length === 0) {
    throw new Error('Missing prizeHistory');
  }

  // Use the most recent DRAWN entry (allOrderDrawn === true) by timestamp
  const latest = hist
    .filter(x => x?.allOrderDrawn)
    .sort((a, b) => Number(b.expectedPrizeTimestamp) - Number(a.expectedPrizeTimestamp))[0];

  if (!latest) throw new Error('No drawn entries yet');

  const drawDateISO = toDateISO(latest.expectedPrizeTime); // "2025-09-17 21:30:00" -> "2025-09-17"
  const numbers = (latest.nums || '').replace(/\s/g, '').replace(/,/g, '-'); // "1,9,5" -> "1-9-5"
  const phase = String(latest.phase);

  if (!numbers || !phase || !drawDateISO) {
    throw new Error('Incomplete latest entry');
  }

  return { game, phase, drawDateISO, numbers, expectedPrizeTime: latest.expectedPrizeTime };
}

function toDateISO(s) {
  if (!s) return null;
  const dt = DateTime.fromFormat(s, 'yyyy-LL-dd HH:mm:ss', { zone: TZ });
  return dt.isValid ? dt.toFormat('yyyy-LL-dd') : null;
}

function nowISO() {
  return DateTime.now().setZone(TZ).toISO();
}

function existsInExcel(game, phase, freshRead = false) {
  if (!fs.existsSync(EXCEL_FILE)) return false;
  const wb = XLSX.readFile(EXCEL_FILE);
  const ws = wb.Sheets[SHEET];
  if (!ws) return false;
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  // rows: [ ['Date','Game','Phase','Result','InsertedAt'], ... ]
  return rows.some(r => r?.[1] === game && String(r?.[2]) === String(phase));
}

function appendRows(rows) {
  let wb, ws;
  if (fs.existsSync(EXCEL_FILE)) {
    wb = XLSX.readFile(EXCEL_FILE);
    ws = wb.Sheets[SHEET];
    if (!ws) ws = XLSX.utils.aoa_to_sheet([['Date','Game','Phase','Result','InsertedAt']]);
  } else {
    wb = XLSX.utils.book_new();
    ws = XLSX.utils.aoa_to_sheet([['Date','Game','Phase','Result','InsertedAt']]);
    XLSX.utils.book_append_sheet(wb, ws, SHEET);
  }

  const existing = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const updated = existing.concat(rows);
  wb.Sheets[SHEET] = XLSX.utils.aoa_to_sheet(updated);
  XLSX.writeFile(wb, EXCEL_FILE);
}

function formatTelegram(r) {
  const stamp = DateTime.now().setZone(TZ).toFormat('yyyy-LL-dd HH:mm');
  return (
    `<b>${r.game} — ${r.drawDateISO}</b>\n` +
    `Phase: <code>${r.phase}</code>\n` +
    `Winning numbers: <b>${r.numbers}</b>\n\n` +
    `Posted at ${stamp} (UAE)\n` +
    `#${r.game.replace(/\s/g,'')} #TheUAELottery`
  );
}

async function postTelegram(text) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: process.env.TELEGRAM_CHANNEL_ID,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
}

function warn(label, err) {
  console.warn(`${label}:`, err?.message || err);
}
