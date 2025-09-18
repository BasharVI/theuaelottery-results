import axios from 'axios';
import { DateTime } from 'luxon';

export async function fetchLatestFromHistory(game, url, tz = 'Asia/Dubai') {
  if (!url) throw new Error(`${game}: URL is missing`);
  const { data } = await axios.get(url, { timeout: 15000 });

  const hist = data?.data?.prizeHistory;
  if (!Array.isArray(hist) || hist.length === 0) {
    throw new Error(`${game}: Missing prizeHistory in response`);
  }

  // Choose the most recent *drawn* entry
  const latest = hist
    .filter(x => x?.allOrderDrawn)
    .sort((a, b) => Number(b.expectedPrizeTimestamp) - Number(a.expectedPrizeTimestamp))[0];

  if (!latest) {
    throw new Error(`${game}: No drawn entries found`);
  }

  // Normalize result like "1-2-3" or "1-2-3-4"
  let resultStr = '';
  if (Array.isArray(latest.nums)) {
    resultStr = latest.nums.join('-');
  } else if (typeof latest.nums === 'string') {
    // handle either "1,2,3" or "1234"
    const digits = latest.nums.replace(/[^0-9]/g, '').split('');
    resultStr = digits.join('-');
  } else {
    throw new Error(`${game}: Unknown nums format`);
  }

  // Use expectedPrizeTimestamp when available to compute the date in tz
  const ts = Number(latest.expectedPrizeTimestamp || 0);
  const dt = (ts > 0 ? DateTime.fromMillis(ts) : DateTime.fromISO(latest.expectedPrizeTime)).setZone(tz);

  const out = {
    game,
    phase: String(latest.phase || '').trim(),
    dateISO: dt.toISODate(), // YYYY-MM-DD
    result: resultStr,
  };

  if (!out.phase || !out.dateISO || !out.result) {
    throw new Error(`${game}: Incomplete parsed result`);
  }
  return out;
}
