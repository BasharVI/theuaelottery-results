# theuaelottery-results-telegram-bot (Unofficial)

**Unofficial** Telegram bot that fetches the daily **Pick 3** and **Pick 4** results from The UAELottery, posts them to your Telegram channel, and stores each game’s history in **separate Excel files**.

> **Disclaimer**  
> This project is **not affiliated with, endorsed by, or maintained by** The UAELottery.  
> It is provided for **informational/educational purposes only**.  
> Always verify results via official sources. Gamble responsibly.

🔗 **Live updates channel:** [@luckylottouae](https://t.me/luckylottouae)

---

## What this is (and isn’t)

- ✅ A simple **Node.js script** you can run locally or schedule with **cron/GitHub Actions**.  
- ✅ Pulls results via **public JSON endpoints** you supply (for example, captured from your browser’s Network tab).  
- ✅ Posts a cleanly formatted message to your **Telegram channel** using your own bot.  
- ✅ Logs each draw to **separate Excel files** (e.g. `pick3.xlsx`, `pick4.xlsx`, and future games like `luckyday.xlsx`), ensuring no duplicate rows based on `Date + Game`.  
- ❌ Not an official product and **not** a public API mirror or bulk re-distributor.  
- ❌ No scraping or browser automation required if stable public endpoints are available.

---

## Features

- **Daily posting** around 21:30 UAE time (adjustable via GitHub Actions cron).  
- **Per-game Excel logs** for long-term record keeping:  
  - `pick3.xlsx` → sheet `Results`  
  - `pick4.xlsx` → sheet `Results`  
  - future: `luckyday.xlsx`  
- Automated GitHub Action (sample workflow included) to:
  - Fetch the latest results
  - Post to the Telegram channel
  - Commit updated Excel files back to the repository

---

## Quick Start

1. Clone or fork this repository.
2. Add required environment variables (`P3_URL`, `P4_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`, etc.) in your `.env` or GitHub Actions secrets.
3. Run manually:
   ```bash
   npm install
   npm start
   ```
   or schedule via GitHub Actions using the provided workflow.

---

## Roadmap / Future

- ✅ Current: Pick 3 & Pick 4 logging to separate Excel files  
- 🔜 Planned: **Lucky Day** support and any additional draws

---

## License

[MIT](LICENSE)
