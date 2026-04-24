# Stingray Tracker v2 🏎️

A gamified savings tracker built with vanilla HTML, CSS, and JavaScript — no build step, no dependencies. Save toward your dream car one day at a time.

## What's new in v2

- **Interactive calendar** — month grid with color-coded days (on-budget, over-budget, zero-spend). Click any day to view details or log a backdated transaction.
- **Retroactive editing** — every log form accepts a custom date, so you can catch up on missed days.
- **Settings tab** — edit goal name, emoji, target amount, start date, monthly budget, and savings target without touching code.
- **Live countdown** — header shows days remaining until your projected goal date based on your current pace.
- **Daily challenges** — rotating challenge each day with bonus XP for completion.
- **Motivational quotes** — daily quote rotation (14 curated), deterministic per-day.
- **Backup & restore** — export your full history as JSON and import it back anywhere.
- **PWA support** — installable to your phone's home screen with offline caching and a custom icon.
- **Fixed date bugs** — all date logic now uses local time (no more "tomorrow's" entry appearing at 8pm).
- **Fixed subscription math** — yearly subs correctly amortize to `amount / 12` every month.

## Features

- **Journey milestones** — 6 checkpoints from $0 to your goal amount with achievement emojis
- **12 achievements** — first day, streaks (5/14/30), perfect week, no-spend day, monthly goal, savings milestones
- **XP + leveling** — earn XP for staying on budget, logging extra savings, claiming challenges. Level up as you go.
- **Streak tracking** — current and best streak for days under your daily allowance
- **Subscription manager** — monthly and yearly billing, per-sub impact on daily allowance
- **Stats dashboard** — 30-day spending trend chart, weekly/monthly breakdown, budget waterfall
- **Local data** — everything stored in `localStorage`, no backend, no account required
- **Dark theme** — easy on the eyes, mobile-responsive with iOS safe-area support

## Run locally

Any static file server works. The included `.claude/launch.json` uses `http-server`:

```bash
npx http-server . -p 8000 -c-1
```

Then open http://localhost:8000.

## Deploy

Drop the files on any static host — GitHub Pages, Netlify, Vercel, Cloudflare Pages. The app is a single HTML file + CSS + JS, so no build is required.

## Data model

All app state is stored under `localStorage['stingrayData']` as JSON with this shape:

```
{
  version: 2,
  config: { goalName, goalEmoji, goalAmount, startDate, monthlyBudget, monthlySavingsTarget },
  transactions: [{ id, date, amount, category, note, type, timestamp }],
  subscriptions: [{ id, name, amount, dayOfMonth, category, billingCycle, billingMonth, active }],
  xp: { total, level, history: [{ date, source, xp }] },
  achievements: { unlockedIds, unlockedAt },
  challenges: { completed: { [date]: [challengeId, ...] } },
  lastVisit: <iso date>
}
```

Use **Settings → Backup/Restore** to export and import this as a JSON file.

## License

MIT
