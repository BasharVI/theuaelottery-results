import 'dotenv/config';
import { fetchLatestFromHistory } from './fetchResults.js';
import { loadWorkbook, ensureSheet, existingKeys, appendRows } from './sheets.js';
import { postTelegram } from './postTelegram.js';

const EXCEL_FILE = 'results.xlsx';
const SHEET = 'Results';
const TZ = 'Asia/Dubai';

const P3_URL = process.env.P3_URL;  // Pick 3
const P4_URL = process.env.P4_URL;  // Pick 4

function warn(label, err) {
  console.warn(`${label}:`, err?.message || err);
}
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
  const items = [];

  const p3 = await fetchLatestFromHistory('Pick 3', P3_URL, TZ).catch(e => warn('Pick 3', e));
  const p4 = await fetchLatestFromHistory('Pick 4', P4_URL, TZ).catch(e => warn('Pick 4', e));

  if (p3) items.push(p3);
  if (p4) items.push(p4);

  if (items.length === 0) {
    console.log('No items fetched.');
    return;
  }

  const wb = loadWorkbook(EXCEL_FILE);
  const ws = ensureSheet(wb, SHEET);
  const keys = existingKeys(ws);

  const newOnes = items.filter(x => !keys.has(`${x.game}__${x.phase}`));

  if (newOnes.length === 0) {
    console.log('All results already recorded.');
    return;
  }

  appendRows(wb, ws, EXCEL_FILE, newOnes, TZ);

  // Post to Telegram per new item
  for (const it of newOnes) {
    try {
      await postTelegram(formatTelegramMessage(it));
      console.log('Posted:', it.game, it.phase);
    } catch (err) {
      warn('Telegram', err);
    }
  }
})();
