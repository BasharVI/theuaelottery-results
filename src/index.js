import 'dotenv/config';
import { fetchLatestFromHistory } from './fetchResults.js';
import { loadWorkbook, ensureSheet, existingKeys, appendRows } from './sheets.js';
import { postTelegram } from './postTelegram.js';

const SHEET = 'Results';
const TZ = 'Asia/Dubai';

// Env endpoints
const P3_URL = process.env.P3_URL;  // Pick 3
const P4_URL = process.env.P4_URL;  // Pick 4

// Map each game to its own Excel file (add future games here)
const EXCEL_FILES = {
  'Pick 3': 'results_pick3.xlsx',
  'Pick 4': 'results_pick4.xlsx',
  'Lucky Day': 'results_luckyday.xlsx', // future-ready
};

// Fallback: slugify any unexpected game name
function slugifyGame(game) {
  return String(game || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getExcelPathForGame(game) {
  if (EXCEL_FILES[game]) return EXCEL_FILES[game];
  return `results_${slugifyGame(game)}.xlsx`;
}

function warn(label, err) {
  console.warn(`${label}:`, err?.message || err);
}

// Pretty Telegram message (with emoji digits)
function formatTelegramMessage(item) {
  return (
    `🎉 <b>The UAE Lottery – ${item.game}</b> 🎉\n\n` +
    `📅 <b>Date:</b> ${item.dateISO}\n` +
    `🏆 <b>Draw No:</b> ${item.phase}\n` +
    `🔢 <b>Winning Numbers:</b> ${item.result.split('-').join(', ')}\n\n` +
    `#UAELottery #${item.game.replace(/\s+/g, '')} #LuckyDraw #WinBig`
  );
}

(async () => {
  // 1) Fetch latest results
  const fetched = [];

  const p3 = await fetchLatestFromHistory('Pick 3', P3_URL, TZ).catch(e => warn('Pick 3', e));
  const p4 = await fetchLatestFromHistory('Pick 4', P4_URL, TZ).catch(e => warn('Pick 4', e));

  if (p3) fetched.push(p3);
  if (p4) fetched.push(p4);

  if (fetched.length === 0) {
    console.log('No items fetched.');
    return;
  }

  // 2) Group items by game so each group uses its own Excel file
  const byGame = fetched.reduce((acc, it) => {
    (acc[it.game] ||= []).push(it);
    return acc;
  }, {});

  // 3) For each game: load its workbook, dedupe, append, and post
  for (const [game, items] of Object.entries(byGame)) {
    const excelPath = getExcelPathForGame(game);

    const wb = loadWorkbook(excelPath);
    const ws = ensureSheet(wb, SHEET);
    const keys = existingKeys(ws);

    // Dedupe within this game's file using Game+Phase
    const newOnes = items.filter(x => !keys.has(`${x.game}__${x.phase}`));

    if (newOnes.length === 0) {
      console.log(`[${game}] No new results (already recorded in ${excelPath}).`);
      continue;
    }

    appendRows(wb, ws, excelPath, newOnes, TZ);
    console.log(`[${game}] Appended ${newOnes.length} new row(s) to ${excelPath}.`);

    // Post to Telegram per new item
    for (const it of newOnes) {
      try {
        await postTelegram(formatTelegramMessage(it));
        console.log(`[${game}] Posted: ${it.phase}`);
      } catch (err) {
        warn(`[${game}] Telegram`, err);
      }
    }
  }
})();
