# theuaelottery-results-telegram-bot (Unofficial)

**Unofficial** Telegram bot that fetches the daily **Pick 3** and **Pick 4** results from The UAELottery, posts them to your Telegram channel, and appends them to a local Excel sheet for record-keeping.

> **Disclaimer**  
> This project is **not affiliated with, endorsed by, or maintained by** The UAELottery. It is for informational/educational purposes. Always verify results via official sources. Gamble responsibly.

---

## What this is (and isn’t)
- ✅ A simple **Node.js script** (no server) you can run locally or on a schedule (cron/GitHub Actions).
- ✅ Pulls results via **public endpoints** you provide (from your browser’s Network tab).
- ✅ Posts a formatted message to a **Telegram channel** using your bot.
- ✅ Appends each draw to `results.xlsx` (with de-duplication by `Date + Game`).
- ❌ Not an official product and **not** an API mirror or re-distributor.
- ❌ No scraping/browser automation needed if you have stable public JSON endpoints.

---

## Features
- **Daily Pick 3 & Pick 4** at ~21:30 UAE time (you schedule when to run).
- **Excel logging** to `results.xlsx` → sheet `Results` with columns:
