/* ═══════════════════════════════════════════════════════════════
   STINGRAY TRACKER v2
   Gamified savings with calendar, challenges, and live projection.
   ═══════════════════════════════════════════════════════════════ */

// ── Defaults ─────────────────────────────────────────────────────
const DEFAULTS = {
  monthlyBudget: 400,
  monthlySavingsTarget: 225,
  goalAmount: 20000,
  goalName: 'Corvette Stingray',
  goalEmoji: '🏎️',
  startDate: '2026-05-01',
};

const ACHIEVEMENTS = [
  { id: 'first-day',     icon: '👣', name: 'First Step',     desc: 'Log your first transaction' },
  { id: 'streak-5',      icon: '🔥', name: '5-Day Streak',   desc: 'Stay under budget 5 days in a row' },
  { id: 'streak-14',     icon: '⚡', name: 'Two Week Hero',  desc: 'Stay under budget 14 days in a row' },
  { id: 'streak-30',     icon: '🏅', name: 'Month Master',   desc: 'Stay under budget 30 days in a row' },
  { id: 'perfect-week',  icon: '✨', name: 'Perfect Week',   desc: 'Under budget 7 days in a week' },
  { id: 'no-spend-day',  icon: '🛡️', name: 'No-Spend Day',   desc: 'Spend $0 on a tracked day' },
  { id: 'monthly-goal',  icon: '🎯', name: 'Monthly Goal',   desc: 'Hit your monthly savings target' },
  { id: 'extra-100',     icon: '💵', name: 'First $100',     desc: 'Log $100 in extra savings' },
  { id: 'milestone-5k',  icon: '💎', name: '$5K Saved',      desc: 'Reach $5,000 saved' },
  { id: 'milestone-10k', icon: '💰', name: '$10K Saved',     desc: 'Reach $10,000 saved' },
  { id: 'milestone-15k', icon: '🚀', name: '$15K Saved',     desc: 'Reach $15,000 saved' },
  { id: 'milestone-goal',icon: '🏆', name: 'Dream Achieved', desc: 'Reach your savings goal' },
];

const MILESTONES = [
  { amount: 0,     label: 'Start',    emoji: '🔒', desc: 'Begin your journey' },
  { amount: 2500,  label: '$2,500',   emoji: '🔑', desc: 'First quarter of the way to 10K' },
  { amount: 5000,  label: '$5,000',   emoji: '🚗', desc: 'You\'re making real progress' },
  { amount: 10000, label: '$10,000',  emoji: '🏎️', desc: 'Halfway there!' },
  { amount: 15000, label: '$15,000',  emoji: '⚡', desc: 'Almost home' },
  { amount: 20000, label: 'Stingray', emoji: '🏆', desc: 'Dream achieved' },
];

const CHALLENGES = [
  { id: 'zero',     name: 'Zero Day',        desc: 'Spend $0 today',                 xp: 100, check: ctx => ctx.spent === 0 },
  { id: 'half',     name: 'Half Day',        desc: 'Stay under half your allowance', xp: 50,  check: ctx => ctx.spent > 0 && ctx.spent <= ctx.allowance / 2 },
  { id: 'skip',     name: 'The Skip',        desc: 'Log one avoided purchase',       xp: 25,  check: ctx => ctx.avoided >= 1 },
  { id: 'boost',    name: 'Boost',           desc: 'Add to your extra savings',      xp: 50,  check: ctx => ctx.extra >= 1 },
  { id: 'mindful',  name: 'Mindful Spender', desc: 'Add a note to every transaction',xp: 30,  check: ctx => ctx.spendTxs.length > 0 && ctx.spendTxs.every(t => t.note?.trim()) },
  { id: 'under',    name: 'Hold The Line',   desc: 'Stay under your daily allowance',xp: 40,  check: ctx => ctx.spent <= ctx.allowance },
  { id: 'single',   name: 'One And Done',    desc: 'Keep today to one transaction',  xp: 35,  check: ctx => ctx.spendTxs.length === 1 },
];

const QUOTES = [
  { text: 'Every dollar not spent is a dollar closer to the driver\'s seat.', by: 'Stingray Tracker' },
  { text: 'Discipline is choosing between what you want now and what you want most.', by: 'Abraham Lincoln' },
  { text: 'A journey of a thousand miles begins with a single step.', by: 'Lao Tzu' },
  { text: 'The secret of getting ahead is getting started.', by: 'Mark Twain' },
  { text: 'Do not save what is left after spending; spend what is left after saving.', by: 'Warren Buffett' },
  { text: 'You must gain control over your money or the lack of it will forever control you.', by: 'Dave Ramsey' },
  { text: 'Small daily improvements over time lead to stunning results.', by: 'Robin Sharma' },
  { text: 'We first make our habits, then our habits make us.', by: 'John Dryden' },
  { text: 'Rich is not an amount of money, it\'s a mindset about how you live.', by: 'Unknown' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', by: 'Chinese Proverb' },
  { text: 'Do not be afraid to give up the good to go for the great.', by: 'John D. Rockefeller' },
  { text: 'Motivation is what gets you started. Habit is what keeps you going.', by: 'Jim Ryun' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', by: 'Robert Collier' },
  { text: 'Wealth consists not in having great possessions, but in having few wants.', by: 'Epictetus' },
];

const CATEGORIES = ['Food', 'Entertainment', 'Shopping', 'Transport', 'Health', 'Subscriptions', 'Other'];
const STORAGE_KEY = 'stingrayData';

// ── State ────────────────────────────────────────────────────────
let state = null;
let calView = { year: new Date().getFullYear(), month: new Date().getMonth() };
let reportView = { year: new Date().getFullYear(), month: new Date().getMonth() };
let modalDate = null;

// ── Helpers ──────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const fmt = n => `$${Number(n).toFixed(2)}`;
const fmt0 = n => `$${Math.round(Number(n)).toLocaleString()}`;
const dateStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dateStr(new Date());
const set = (id, val, prop = 'textContent') => { const el = $(id); if (el) el[prop] = val; };
const sum = arr => arr.reduce((s, n) => s + n, 0);
const byDate = d => tx => tx.date === d;
const isSpend = tx => tx.type === 'spending';
const isExtra = tx => tx.type === 'savings';
const isWithdraw = tx => tx.type === 'withdrawal';
const isAvoided = tx => tx.type === 'avoided';

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a, b) {
  const ms = parseDate(b) - parseDate(a);
  return Math.round(ms / 86400000);
}

function hashDayIdx(dateS, mod) {
  // Deterministic day-of-year hash for rotating content.
  const d = parseDate(dateS);
  const start = new Date(d.getFullYear(), 0, 0);
  const doy = Math.floor((d - start) / 86400000);
  return doy % mod;
}

// ── Storage & Migration ──────────────────────────────────────────
function freshState() {
  return {
    version: 2,
    config: { ...DEFAULTS },
    transactions: [],
    subscriptions: [],
    xp: { total: 0, level: 1, history: [] },
    achievements: { unlockedIds: [], unlockedAt: {} },
    challenges: { completed: {} }, // { 'YYYY-MM-DD': [challengeId, ...] }
    lastVisit: null,
  };
}

function migrate(raw) {
  // v1 had: config, transactions, subscriptions, xpData, achievementState
  if (raw.version === 2) return raw;
  const s = freshState();
  if (raw.config) {
    s.config = {
      monthlyBudget:         raw.config.monthlyFunMoney       ?? DEFAULTS.monthlyBudget,
      monthlySavingsTarget:  raw.config.targetMonthlySavings  ?? DEFAULTS.monthlySavingsTarget,
      goalAmount:            raw.config.targetSavingsGoal     ?? DEFAULTS.goalAmount,
      goalName:              raw.config.goalName              ?? DEFAULTS.goalName,
      goalEmoji:             raw.config.goalEmoji             ?? DEFAULTS.goalEmoji,
      startDate:             raw.config.startDate             ?? DEFAULTS.startDate,
    };
  }
  if (Array.isArray(raw.transactions)) {
    s.transactions = raw.transactions.map(tx => ({
      id: tx.id || String(Date.now() + Math.random()),
      date: tx.date,
      amount: Number(tx.amount) || 0,
      category: tx.category || 'Other',
      note: tx.note || '',
      type: typeToKind(tx.category),
      timestamp: tx.timestamp || new Date().toISOString(),
    }));
  }
  if (Array.isArray(raw.subscriptions)) s.subscriptions = raw.subscriptions;
  if (raw.xpData) s.xp = {
    total: raw.xpData.totalXP || 0,
    level: raw.xpData.level || 1,
    history: raw.xpData.history || [],
  };
  return s;
}

function typeToKind(cat) {
  if (cat === 'Extra Savings') return 'savings';
  if (cat === 'Withdrawal')    return 'withdrawal';
  if (cat === 'Avoided')       return 'avoided';
  return 'spending';
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  state = raw ? migrate(JSON.parse(raw)) : freshState();
  // Backfill missing fields for forward-compat
  state.challenges = state.challenges || { completed: {} };
  state.achievements = state.achievements || { unlockedIds: [], unlockedAt: {} };
  state.lastVisit = state.lastVisit || today();
  // Persist migrated state so downstream readers (including sync) see v2.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (window.StingraySync) window.StingraySync.pushState(state);
  render();
}

function applyRemoteState(remote) {
  if (!remote || typeof remote !== 'object') return;
  state = migrate(remote);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stingray-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      state = migrate(parsed);
      save();
      alert('Data imported successfully.');
    } catch (err) {
      alert('Import failed: invalid file.');
    }
  };
  reader.readAsText(file);
}

// ── Calculations ─────────────────────────────────────────────────
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

function subscriptionMonthlyImpact() {
  // Corrected: yearly subs contribute amount/12 every month.
  return sum(state.subscriptions
    .filter(s => s.active)
    .map(s => s.billingCycle === 'yearly' ? s.amount / 12 : s.amount));
}

function dailyAllowance() {
  const { monthlyBudget, monthlySavingsTarget } = state.config;
  const d = daysInMonth(new Date().getFullYear(), new Date().getMonth());
  const avail = monthlyBudget - monthlySavingsTarget - subscriptionMonthlyImpact();
  return Math.max(0, avail / d);
}

function spentOnDay(dateS) {
  return sum(state.transactions.filter(byDate(dateS)).filter(isSpend).map(tx => tx.amount));
}

function totalSaved() {
  const extra = sum(state.transactions.filter(isExtra).map(tx => tx.amount));
  const withd = sum(state.transactions.filter(isWithdraw).map(tx => tx.amount));
  return Math.max(0, extra - withd);
}

function calculateStreaks() {
  // Walks backward from today. A day counts if spending ≤ allowance AND at least one tx exists OR it's an active tracking day.
  // We only include days that have *any* transaction of any type (so empty future days don't count).
  const allowance = dailyAllowance();
  let current = 0, longest = 0, temp = 0;
  const seen = new Set(state.transactions.map(tx => tx.date));
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = dateStr(d);
    if (seen.has(ds)) {
      const spent = spentOnDay(ds);
      if (spent <= allowance) {
        temp++;
        if (i === 0 || current === i) current = temp;
      } else {
        longest = Math.max(longest, temp);
        temp = 0;
      }
    } else if (i === 0) {
      // No activity today yet — don't break or count.
    } else {
      // No activity on a past day — treat as neutral gap (break streak after today).
      longest = Math.max(longest, temp);
      temp = 0;
    }
    d.setDate(d.getDate() - 1);
  }
  longest = Math.max(longest, temp);
  return { current, longest };
}

function weeklyStats(refDate = new Date()) {
  const start = new Date(refDate);
  start.setDate(refDate.getDate() - refDate.getDay());
  let underBudget = 0, totalSpent = 0;
  const allowance = dailyAllowance();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const spent = spentOnDay(dateStr(d));
    totalSpent += spent;
    if (spent <= allowance) underBudget++;
  }
  return { underBudget, totalSpent, allocation: allowance * 7 };
}

function monthlyStats(year = new Date().getFullYear(), month = new Date().getMonth()) {
  const txs = state.transactions.filter(tx => {
    const d = parseDate(tx.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const spent = sum(txs.filter(isSpend).map(tx => tx.amount));
  const extra = sum(txs.filter(isExtra).map(tx => tx.amount));
  const withd = sum(txs.filter(isWithdraw).map(tx => tx.amount));
  const saved = state.config.monthlyBudget - spent;
  return { spent, extra, withd, saved, metGoal: saved >= state.config.monthlySavingsTarget };
}

function spendingByCategory(year, month) {
  const totals = {};
  state.transactions.forEach(tx => {
    if (!isSpend(tx)) return;
    const d = parseDate(tx.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  });
  return Object.entries(totals).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

function averageMonthlySpend() {
  const spendTxs = state.transactions.filter(isSpend);
  if (!spendTxs.length) return 0;
  const months = new Set(spendTxs.map(tx => {
    const d = parseDate(tx.date);
    return `${d.getFullYear()}-${d.getMonth()}`;
  }));
  return sum(spendTxs.map(tx => tx.amount)) / months.size;
}

function averageMonthlyExtra() {
  const extraTxs = state.transactions.filter(isExtra);
  if (!extraTxs.length) return 0;
  const totals = {};
  extraTxs.forEach(tx => {
    const d = parseDate(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    totals[key] = (totals[key] || 0) + tx.amount;
  });
  return sum(Object.values(totals)) / Object.keys(totals).length;
}

function projectedMonthlySavings() {
  const avgSpend = averageMonthlySpend();
  const avgExtra = averageMonthlyExtra();
  return Math.max(0, state.config.monthlyBudget - avgSpend) + avgExtra;
}

function projectedGoalDate() {
  const remaining = state.config.goalAmount - totalSaved();
  const monthly = projectedMonthlySavings();
  if (remaining <= 0) return { date: new Date(), months: 0, daysLeft: 0, possible: true };
  if (monthly <= 0) return { date: null, months: Infinity, daysLeft: Infinity, possible: false };
  const months = remaining / monthly;
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(months));
  const daysLeft = Math.max(0, Math.round((d - new Date()) / 86400000));
  return { date: d, months, daysLeft, possible: true };
}

function currentMilestone() {
  const saved = totalSaved();
  return [...MILESTONES].reverse().find(m => saved >= m.amount) || MILESTONES[0];
}
function nextMilestone() {
  const saved = totalSaved();
  return MILESTONES.find(m => m.amount > saved);
}

// ── Challenges ───────────────────────────────────────────────────
function todaysChallenge() {
  return CHALLENGES[hashDayIdx(today(), CHALLENGES.length)];
}

function challengeContext(dateS = today()) {
  const txs = state.transactions.filter(byDate(dateS));
  return {
    spent: sum(txs.filter(isSpend).map(t => t.amount)),
    allowance: dailyAllowance(),
    spendTxs: txs.filter(isSpend),
    avoided: txs.filter(isAvoided).length,
    extra: txs.filter(isExtra).length,
  };
}

function challengeCompleted(dateS = today()) {
  const ch = CHALLENGES[hashDayIdx(dateS, CHALLENGES.length)];
  const already = (state.challenges.completed[dateS] || []).includes(ch.id);
  return { challenge: ch, done: already || ch.check(challengeContext(dateS)) };
}

function markChallengeClaimed(dateS, chId) {
  state.challenges.completed[dateS] = state.challenges.completed[dateS] || [];
  if (!state.challenges.completed[dateS].includes(chId)) {
    state.challenges.completed[dateS].push(chId);
  }
}

// ── XP & Achievements ────────────────────────────────────────────
function xpForLevel(level) { return level * 1000; }
function currentLevelProgress() {
  const lvl = state.xp.level;
  const totalNeededBefore = sum(Array.from({ length: lvl - 1 }, (_, i) => xpForLevel(i + 1)));
  const intoLevel = state.xp.total - totalNeededBefore;
  const need = xpForLevel(lvl);
  return { intoLevel, need, pct: Math.min(100, (intoLevel / need) * 100) };
}
function addXP(amount, source) {
  state.xp.total = Math.max(0, state.xp.total + amount);
  state.xp.history.push({ date: today(), source, xp: amount });
  // Level up: recompute level from total
  let lvl = 1, running = 0;
  while (running + xpForLevel(lvl) <= state.xp.total) { running += xpForLevel(lvl); lvl++; }
  state.xp.level = lvl;
  save();
}

function checkAchievements() {
  const saved = totalSaved();
  const { current: streak } = calculateStreaks();
  const { underBudget } = weeklyStats();
  const { metGoal } = monthlyStats();
  const totalExtra = sum(state.transactions.filter(isExtra).map(t => t.amount));

  const newly = new Map([
    ['first-day',     state.transactions.length > 0],
    ['streak-5',      streak >= 5],
    ['streak-14',     streak >= 14],
    ['streak-30',     streak >= 30],
    ['perfect-week',  underBudget === 7],
    ['no-spend-day',  [...new Set(state.transactions.map(t => t.date))].some(d => spentOnDay(d) === 0 && state.transactions.some(t => t.date === d)) ],
    ['monthly-goal',  metGoal],
    ['extra-100',     totalExtra >= 100],
    ['milestone-5k',  saved >= 5000],
    ['milestone-10k', saved >= 10000],
    ['milestone-15k', saved >= 15000],
    ['milestone-goal',saved >= state.config.goalAmount],
  ]);
  newly.forEach((unlocked, id) => {
    if (unlocked && !state.achievements.unlockedIds.includes(id)) {
      state.achievements.unlockedIds.push(id);
      state.achievements.unlockedAt[id] = today();
    }
  });
}

// ── Transaction Actions ──────────────────────────────────────────
function addTransaction({ date, amount, category, note, type }) {
  const tx = {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    date: date || today(),
    amount: Number(amount) || 0,
    category: category || 'Other',
    note: note || '',
    type: type || 'spending',
    timestamp: new Date().toISOString(),
  };
  state.transactions.push(tx);

  // XP rules
  if (type === 'avoided')    addXP(10, 'avoided');
  else if (type === 'savings')   addXP(Math.floor(tx.amount), 'extra-savings');
  else if (type === 'withdrawal')addXP(-Math.floor(tx.amount), 'withdrawal');
  else if (type === 'spending') {
    // Award if today's total is still under allowance
    const spent = spentOnDay(tx.date);
    const allowance = dailyAllowance();
    if (tx.date === today() && spent <= allowance) {
      const gain = Math.max(1, Math.floor((allowance - spent) * 2));
      addXP(gain, 'under-budget');
    }
  } else {
    save();
  }

  // Challenge auto-claim
  const { challenge, done } = challengeCompleted(tx.date);
  if (done && !(state.challenges.completed[tx.date] || []).includes(challenge.id)) {
    markChallengeClaimed(tx.date, challenge.id);
    addXP(challenge.xp, `challenge-${challenge.id}`);
  }

  checkAchievements();
  save();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  save();
}

function updateTransaction(id, changes) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  Object.assign(tx, changes);
  save();
}

// ── Subscription Actions ─────────────────────────────────────────
function addSubscription(data) {
  state.subscriptions.push({
    id: String(Date.now()),
    ...data,
  });
  save();
}
function deleteSubscription(id) {
  state.subscriptions = state.subscriptions.filter(s => s.id !== id);
  save();
}
function toggleSubscription(id) {
  const s = state.subscriptions.find(s => s.id === id);
  if (s) { s.active = !s.active; save(); }
}

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════
function render() {
  renderHeader();
  renderHero();
  renderToday();
  renderCalendar();
  renderStats();
  renderSubs();
  renderReports();
  renderAchievements();
  renderSettings();
  if (modalDate) renderDayModal();
}

// ── Header ───────────────────────────────────────────────────────
function renderHeader() {
  const saved = totalSaved();
  const remaining = Math.max(0, state.config.goalAmount - saved);
  const proj = projectedGoalDate();
  set('goalName', state.config.goalName);
  set('heroEmoji', state.config.goalEmoji);
  set('headerSaved', fmt0(saved));
  set('headerRemaining', fmt0(remaining));
  if (proj.possible && proj.daysLeft !== Infinity) {
    set('countdown', `${proj.daysLeft.toLocaleString()} days until your ${state.config.goalName}`);
  } else if (proj.possible && proj.daysLeft === 0) {
    set('countdown', 'You did it. Go get your car.');
  } else {
    set('countdown', 'Start logging to see your projection');
  }
}

// ── Hero ─────────────────────────────────────────────────────────
function renderHero() {
  const saved = totalSaved();
  const pct = Math.min(100, (saved / state.config.goalAmount) * 100);
  set('totalSaved', fmt0(saved));
  set('goalAmount', fmt0(state.config.goalAmount));
  set('progressBarFill', `${pct}%`, 'style');
  $('progressBarFill').style.width = `${pct}%`;
  set('progressPercent', `${pct.toFixed(1)}%`);

  $$('.journey__stage').forEach(stage => {
    const amt = parseInt(stage.dataset.stage);
    stage.classList.toggle('active', saved >= amt);
  });

  const cur = currentMilestone();
  const nxt = nextMilestone();
  set('currentEmoji', cur.emoji);
  set('currentMilestone', cur.label);
  set('currentDesc', cur.desc);
  if (nxt) {
    set('nextEmoji', nxt.emoji);
    set('nextMilestone', nxt.label);
    set('nextAmount', `${fmt0(nxt.amount - saved)} to go`);
    $('nextMilestoneCard').style.display = '';
  } else {
    $('nextMilestoneCard').style.display = 'none';
  }
}

// ── Today ────────────────────────────────────────────────────────
function renderToday() {
  const t = today();
  const allowance = dailyAllowance();
  const spent = spentOnDay(t);
  const remaining = allowance - spent;
  const under = spent <= allowance;
  const pct = allowance > 0 ? Math.max(0, 100 - (spent / allowance) * 100) : 0;

  // Countdown card
  const proj = projectedGoalDate();
  if (proj.possible && proj.date) {
    set('projDateBig', proj.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    set('projDaysBig', proj.daysLeft === Infinity ? '—' : `${proj.daysLeft.toLocaleString()} days`);
  } else {
    set('projDateBig', 'Keep logging');
    set('projDaysBig', '—');
  }

  // Status banner
  const banner = $('statusBanner');
  banner.className = `status-banner ${under ? 'is-good' : 'is-bad'}`;
  set('statusTitle', under ? '✅ On track today' : '⚠️ Over your allowance');
  set('statusText', under
    ? 'Stay focused. Every dollar you hold onto moves you forward.'
    : `You're ${fmt(spent - allowance)} over your ${fmt(allowance)} allowance. Tomorrow is a new day.`);

  // Stats
  set('dailyAllowance', fmt(allowance));
  set('spentToday', fmt(spent));
  const remEl = $('remaining');
  if (remEl) {
    remEl.textContent = remaining < 0 ? `-${fmt(Math.abs(remaining))}` : fmt(remaining);
    remEl.className = 'stat-box__value ' + (remaining < 0 ? 'is-neg' : 'is-pos');
  }
  set('dailyProgress', `${pct.toFixed(0)}%`);

  // Progress bar with color
  const bar = $('dailyBarFill');
  if (bar) {
    bar.style.width = `${pct}%`;
    bar.style.background = pct >= 50 ? '#10b981' : pct >= 25 ? '#f97316' : '#ef4444';
  }

  // XP
  const lvl = currentLevelProgress();
  set('currentLevel', state.xp.level);
  set('totalXP', `${state.xp.total.toLocaleString()} XP`);
  set('xpPercent', `${Math.round(lvl.pct)}%`);
  set('nextXPLevel', `${(lvl.need - lvl.intoLevel).toLocaleString()} XP to level ${state.xp.level + 1}`);
  if ($('xpBarFill')) $('xpBarFill').style.width = `${lvl.pct}%`;

  // Daily challenge
  const { challenge, done } = challengeCompleted(t);
  set('challengeName', challenge.name);
  set('challengeDesc', challenge.desc);
  set('challengeXP', `+${challenge.xp} XP`);
  const chCard = $('challengeCard');
  if (chCard) chCard.classList.toggle('is-done', done);
  set('challengeStatus', done ? '✅ Completed' : 'In progress');

  // Daily quote
  const q = QUOTES[hashDayIdx(t, QUOTES.length)];
  set('quoteText', `"${q.text}"`);
  set('quoteBy', `— ${q.by}`);

  // Weekly
  const w = weeklyStats();
  set('weeklyAllocation', fmt(w.allocation));
  set('weeklySpent', fmt(w.totalSpent));
  const wr = w.allocation - w.totalSpent;
  const wrEl = $('weeklyRemaining');
  if (wrEl) {
    wrEl.textContent = wr < 0 ? `-${fmt(Math.abs(wr))}` : fmt(wr);
    wrEl.className = 'stat-box__value ' + (wr < 0 ? 'is-neg' : 'is-pos');
  }
  const wpct = Math.min(100, (w.totalSpent / w.allocation) * 100);
  if ($('weeklyBarFill')) $('weeklyBarFill').style.width = `${wpct}%`;
  set('weeklyPercent', `${Math.round(wpct)}%`);

  // Today's transactions
  renderTxList($('transactionsList'), state.transactions.filter(byDate(t)), { canDelete: true });

  // Mini week strip
  renderWeekStrip();
}

function renderWeekStrip() {
  const strip = $('weekStrip');
  if (!strip) return;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const allowance = dailyAllowance();
  strip.innerHTML = '';
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const ds = dateStr(d);
    const spent = spentOnDay(ds);
    const hasTx = state.transactions.some(t => t.date === ds);
    const cls = ds === today() ? 'is-today'
              : !hasTx ? 'is-empty'
              : spent === 0 ? 'is-zero'
              : spent <= allowance ? 'is-under'
              : 'is-over';
    const cell = document.createElement('button');
    cell.className = `strip__day ${cls}`;
    cell.innerHTML = `<span class="strip__label">${labels[i]}</span><span class="strip__date">${d.getDate()}</span>`;
    cell.addEventListener('click', () => openDayModal(ds));
    strip.appendChild(cell);
  }
}

function renderTxList(container, txs, { canDelete = true, showDate = false } = {}) {
  if (!container) return;
  if (!txs.length) {
    container.innerHTML = '<p class="empty-state">No transactions yet</p>';
    return;
  }
  container.innerHTML = txs
    .slice()
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .map(tx => {
      const t = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateLabel = showDate ? `<span class="tx__date">${parseDate(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : '';
      const sign = tx.type === 'savings' ? '+' : tx.type === 'avoided' ? '' : '-';
      const amt = tx.type === 'avoided' ? '$0.00' : `${sign}${fmt(tx.amount)}`;
      return `
        <div class="tx tx--${tx.type}">
          <div class="tx__info">
            ${dateLabel}
            <span class="tx__tag">${tx.category}</span>
            ${tx.note ? `<span class="tx__note">${escapeHtml(tx.note)}</span>` : ''}
            <span class="tx__time">${t}</span>
          </div>
          <span class="tx__amt">${amt}</span>
          ${canDelete ? `<button class="tx__del" data-del="${tx.id}" aria-label="Delete">✕</button>` : ''}
        </div>`;
    }).join('');
  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this transaction?')) deleteTransaction(btn.dataset.del);
    });
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ── Calendar ─────────────────────────────────────────────────────
function renderCalendar() {
  const grid = $('calGrid');
  if (!grid) return;
  const { year, month } = calView;
  const first = new Date(year, month, 1);
  const dayOfWeek = first.getDay();
  const total = daysInMonth(year, month);
  const allowance = dailyAllowance();

  set('calTitle', first.toLocaleString('en-US', { month: 'long', year: 'numeric' }));

  grid.innerHTML = '';
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal__head';
    h.textContent = d;
    grid.appendChild(h);
  });
  for (let i = 0; i < dayOfWeek; i++) grid.appendChild(Object.assign(document.createElement('div'), { className: 'cal__pad' }));

  const t = today();
  for (let day = 1; day <= total; day++) {
    const d = new Date(year, month, day);
    const ds = dateStr(d);
    const spent = spentOnDay(ds);
    const hasAny = state.transactions.some(tx => tx.date === ds);
    const zero = hasAny && spent === 0;
    const under = hasAny && spent > 0 && spent <= allowance;
    const over = hasAny && spent > allowance;
    let cls = 'cal__day';
    if (ds === t) cls += ' is-today';
    if (zero) cls += ' is-zero';
    else if (under) cls += ' is-under';
    else if (over) cls += ' is-over';
    else if (!hasAny) cls += ' is-empty';

    const cell = document.createElement('button');
    cell.className = cls;
    cell.dataset.date = ds;
    cell.innerHTML = `
      <span class="cal__num">${day}</span>
      ${hasAny ? `<span class="cal__amt">${zero ? '✨' : fmt(spent).replace('.00', '')}</span>` : ''}
    `;
    cell.addEventListener('click', () => openDayModal(ds));
    grid.appendChild(cell);
  }
}

// ── Day Modal ────────────────────────────────────────────────────
function openDayModal(ds) {
  modalDate = ds;
  const modal = $('dayModal');
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add('no-scroll');
  renderDayModal();
}

function closeDayModal() {
  modalDate = null;
  $('dayModal').hidden = true;
  document.body.classList.remove('no-scroll');
}

function renderDayModal() {
  if (!modalDate) return;
  const d = parseDate(modalDate);
  const txs = state.transactions.filter(byDate(modalDate));
  const spent = spentOnDay(modalDate);
  const allowance = dailyAllowance();
  const extra = sum(txs.filter(isExtra).map(t => t.amount));
  const withd = sum(txs.filter(isWithdraw).map(t => t.amount));

  set('modalDate', d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  set('modalSpent', fmt(spent));
  set('modalAllowance', fmt(allowance));
  set('modalExtra', fmt(extra));
  set('modalWithd', fmt(withd));

  const status = spent === 0 && txs.length > 0 ? '✨ No-Spend Day'
               : spent === 0 ? '—'
               : spent <= allowance ? `✅ ${fmt(allowance - spent)} under`
               : `⚠️ ${fmt(spent - allowance)} over`;
  set('modalStatus', status);

  renderTxList($('modalTxList'), txs, { canDelete: true });

  // Pre-fill date on inner form
  if ($('modalDatePick')) $('modalDatePick').value = modalDate;
}

// ── Stats ────────────────────────────────────────────────────────
function renderStats() {
  const { current, longest } = calculateStreaks();
  const w = weeklyStats();
  const m = monthlyStats();
  set('currentStreak', current);
  set('longestStreak', longest);
  set('weekUnderBudget', `${w.underBudget}/7`);
  set('weekSpent', fmt(w.totalSpent));
  set('weekAvg', fmt(w.totalSpent / 7));
  set('weekStatus', w.totalSpent <= w.allocation ? '✅' : '⚠️');
  set('monthSpent', fmt(m.spent));
  set('monthSaved', fmt(m.saved));
  set('monthAdditionalSavings', fmt(m.extra));
  set('targetSavings', fmt(state.config.monthlySavingsTarget));

  const subTotal = subscriptionMonthlyImpact();
  const avail = state.config.monthlyBudget - state.config.monthlySavingsTarget - subTotal;
  set('monthlyBudget', fmt(state.config.monthlyBudget));
  set('targetMonthly', `-${fmt(state.config.monthlySavingsTarget)}`);
  set('subTotal', `-${fmt(subTotal)}`);
  const availEl = $('availableSpending');
  if (availEl) {
    availEl.textContent = avail < 0 ? `-${fmt(Math.abs(avail))}` : fmt(avail);
    availEl.className = 'breakdown__value ' + (avail < 0 ? 'is-neg' : 'is-pos');
  }
  set('dailyAllowanceBreakdown', fmt(dailyAllowance()));

  // Trend chart (last 30 days spending)
  renderTrend();
}

function renderTrend() {
  const svg = $('trendChart');
  if (!svg) return;
  const days = 30;
  const allowance = dailyAllowance();
  const points = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    points.push({ date: dateStr(d), spent: spentOnDay(dateStr(d)) });
  }
  const max = Math.max(allowance * 2, ...points.map(p => p.spent), 1);
  const w = 600, h = 160, pad = 20;
  const step = (w - pad * 2) / (days - 1);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * step} ${h - pad - (p.spent / max) * (h - pad * 2)}`).join(' ');
  const allowY = h - pad - (allowance / max) * (h - pad * 2);
  const bars = points.map((p, i) => {
    const x = pad + i * step - step * 0.35;
    const bh = (p.spent / max) * (h - pad * 2);
    const color = p.spent === 0 ? '#334155' : p.spent <= allowance ? '#10b981' : '#ef4444';
    return `<rect x="${x}" y="${h - pad - bh}" width="${step * 0.7}" height="${bh}" fill="${color}" opacity="0.6" />`;
  }).join('');
  svg.innerHTML = `
    <line x1="${pad}" y1="${allowY}" x2="${w - pad}" y2="${allowY}" stroke="#f59e0b" stroke-dasharray="4 4" stroke-width="1"/>
    <text x="${w - pad}" y="${allowY - 4}" text-anchor="end" fill="#f59e0b" font-size="10">Daily allowance: ${fmt(allowance)}</text>
    ${bars}
    <path d="${path}" fill="none" stroke="#60a5fa" stroke-width="2" />
  `;
}

// ── Subscriptions ────────────────────────────────────────────────
function renderSubs() {
  const impact = subscriptionMonthlyImpact();
  set('subMonthlyTotal', fmt(impact));
  set('subDailyImpact', fmt(impact / 30));

  const list = $('subscriptionsList');
  if (!list) return;
  if (!state.subscriptions.length) {
    list.innerHTML = '<p class="empty-state">No subscriptions added yet</p>';
    return;
  }
  list.innerHTML = state.subscriptions.map(s => {
    const cycleLabel = s.billingCycle === 'yearly' ? 'yr' : 'mo';
    const monthly = s.billingCycle === 'yearly' ? s.amount / 12 : s.amount;
    return `
      <div class="sub ${s.active ? '' : 'is-inactive'}">
        <div class="sub__info">
          <p class="sub__name">${escapeHtml(s.name)}</p>
          <p class="sub__meta">
            <strong>${fmt(s.amount)}</strong>/${cycleLabel}
            · ${fmt(monthly)}/mo equiv
            · day ${s.dayOfMonth}
            · ${escapeHtml(s.category)}
            ${!s.active ? '<span class="sub__badge">Inactive</span>' : ''}
          </p>
        </div>
        <div class="sub__actions">
          <button class="btn btn--ghost" data-sub-toggle="${s.id}">${s.active ? 'Pause' : 'Activate'}</button>
          <button class="btn btn--danger" data-sub-del="${s.id}">Remove</button>
        </div>
      </div>`;
  }).join('');
  list.querySelectorAll('[data-sub-del]').forEach(b => b.addEventListener('click', () => { if (confirm('Remove this subscription?')) deleteSubscription(b.dataset.subDel); }));
  list.querySelectorAll('[data-sub-toggle]').forEach(b => b.addEventListener('click', () => toggleSubscription(b.dataset.subToggle)));
}

// ── Reports ──────────────────────────────────────────────────────
function renderReports() {
  const { year, month } = reportView;
  const data = spendingByCategory(year, month);
  const total = sum(data.map(d => d.amount));
  const colors = ['#3b82f6', '#a855f7', '#ec4899', '#f97316', '#22c55e', '#ef4444', '#6366f1'];

  const subs = state.subscriptions.filter(s => s.active && (s.billingCycle === 'monthly' || s.billingMonth === month + 1));
  const subsEl = $('monthSubscriptions');
  if (subsEl) {
    subsEl.innerHTML = subs.length ? `
      <h3>Active Subscriptions</h3>
      ${subs.map(s => `<div class="report-sub"><span><strong>${escapeHtml(s.name)}</strong> · ${escapeHtml(s.category)}</span><span>${fmt(s.amount)}/${s.billingCycle === 'yearly' ? 'yr' : 'mo'}</span></div>`).join('')}
    ` : '';
  }

  const breakdown = $('categoryBreakdown');
  if (breakdown) {
    breakdown.innerHTML = data.length ? data.map((d, i) => {
      const pct = (d.amount / total) * 100;
      return `
        <div class="cat">
          <div class="cat__head"><span>${escapeHtml(d.category)}</span><span>${fmt(d.amount)} (${pct.toFixed(1)}%)</span></div>
          <div class="cat__bar"><div class="cat__fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div></div>
        </div>`;
    }).join('') : '<p class="empty-state">No spending this month</p>';
  }

  const avgSpend = averageMonthlySpend();
  const projMonthly = projectedMonthlySavings();
  set('monthlyAvg', fmt(avgSpend));
  const spendTxs = state.transactions.filter(isSpend);
  const months = new Set(spendTxs.map(t => { const d = parseDate(t.date); return `${d.getFullYear()}-${d.getMonth()}`; })).size;
  set('monthsOfData', `Based on ${months} month${months !== 1 ? 's' : ''}`);
  set('projectedSavings', fmt(projMonthly));
  set('avgAdditionalSavings', fmt(averageMonthlyExtra()));
  set('totalAdditionalSavings', fmt(totalSaved()));

  const proj = projectedGoalDate();
  const projCard = $('projectionCard');
  if (projCard) {
    if (proj.possible && proj.date) {
      projCard.style.display = '';
      set('projectedDate', proj.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }));
      set('monthsUntil', proj.months === Infinity ? '—' : `~${Math.ceil(proj.months)} months`);
    } else {
      projCard.style.display = 'none';
    }
  }
}

// ── Achievements ─────────────────────────────────────────────────
function renderAchievements() {
  const unlocked = new Set(state.achievements.unlockedIds);
  const saved = totalSaved();
  set('achievementCount', `${unlocked.size}/${ACHIEVEMENTS.length}`);
  set('milestoneCount', `${MILESTONES.filter(m => saved >= m.amount).length}/${MILESTONES.length}`);
  set('achievementTotal', fmt0(saved));

  const list = $('achievementsList');
  if (list) {
    list.innerHTML = ACHIEVEMENTS.map(a => {
      const u = unlocked.has(a.id);
      const at = u ? state.achievements.unlockedAt[a.id] : null;
      return `
        <div class="ach ${u ? 'is-unlocked' : ''}">
          <div class="ach__emoji">${a.icon}</div>
          <div class="ach__body">
            <p class="ach__name">${a.name}</p>
            <p class="ach__desc">${a.desc}</p>
            ${u ? `<span class="ach__badge">Unlocked${at ? ' · ' + parseDate(at).toLocaleDateString() : ''}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  const mList = $('milestonesList');
  if (mList) {
    mList.innerHTML = MILESTONES.map((m, i) => {
      const reached = saved >= m.amount;
      const prev = i > 0 ? MILESTONES[i - 1].amount : 0;
      const pct = reached ? 100 : Math.max(0, Math.min(100, ((saved - prev) / (m.amount - prev)) * 100));
      return `
        <div class="ms ${reached ? 'is-reached' : ''}">
          <div class="ms__head">
            <div class="ms__left">
              <span class="ms__emoji">${m.emoji}</span>
              <div><h4>${m.label}</h4><p>${m.desc}</p></div>
            </div>
            <div class="ms__right">
              <p class="ms__amt">${fmt0(m.amount)}</p>
              ${reached ? '<span class="ms__badge">Reached</span>' : ''}
            </div>
          </div>
          ${!reached ? `<div class="ms__bar"><div class="ms__fill" style="width:${pct}%"></div></div><p class="ms__rem">${fmt0(Math.max(0, m.amount - saved))} away</p>` : ''}
        </div>`;
    }).join('');
  }
}

// ── Settings ─────────────────────────────────────────────────────
function renderSettings() {
  set('setBudget', state.config.monthlyBudget, 'value');
  set('setTarget', state.config.monthlySavingsTarget, 'value');
  set('setGoal', state.config.goalAmount, 'value');
  set('setGoalName', state.config.goalName, 'value');
  set('setGoalEmoji', state.config.goalEmoji, 'value');
  set('setStartDate', state.config.startDate, 'value');
}

// ═══════════════════════════════════════════════════════════════
// WIRING
// ═══════════════════════════════════════════════════════════════
function setupTabs() {
  $$('.tabs__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      $$('.tabs__btn').forEach(b => b.classList.toggle('active', b === btn));
      $$('.tab').forEach(p => p.hidden = p.dataset.pane !== id);
      // Scroll to top of content when switching
      window.scrollTo({ top: $('tabsNav')?.offsetTop || 0, behavior: 'smooth' });
    });
  });
}

function setupForms() {
  // Populate category/day/month selects
  const catOpts = CATEGORIES.map(c => `<option>${c}</option>`).join('');
  $('category').innerHTML = catOpts;
  $('subCategory').innerHTML = ['Subscriptions', 'Entertainment', 'Other'].map(c => `<option>${c}</option>`).join('');
  $('subDay').innerHTML = Array.from({ length: 31 }, (_, i) => `<option>${i + 1}</option>`).join('');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  $('subBillingMonth').innerHTML = months.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
  $('reportMonth').innerHTML = months.map((m, i) => `<option value="${i}"${i === new Date().getMonth() ? ' selected' : ''}>${m}</option>`).join('');
  $('reportYear').innerHTML = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => `<option${y === new Date().getFullYear() ? ' selected' : ''}>${y}</option>`).join('');

  // Default dates to today
  const td = today();
  ['spendDate', 'savingsDate', 'withdrawDate', 'avoidedDate'].forEach(id => { if ($(id)) $(id).value = td; });

  // Form toggles
  const toggles = [
    ['toggleSpend',    'spendForm'],
    ['toggleAvoided',  'avoidedForm'],
    ['toggleSavings',  'savingsForm'],
    ['toggleWithdraw', 'withdrawForm'],
    ['toggleSub',      'subForm'],
  ];
  toggles.forEach(([btnId, formId]) => {
    const btn = $(btnId), form = $(formId);
    if (btn && form) btn.addEventListener('click', () => form.classList.toggle('hidden'));
  });

  // Spend form
  $('spendForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat($('spendAmount').value);
    if (!(amount > 0)) return;
    addTransaction({
      date: $('spendDate').value || today(),
      amount,
      category: $('category').value,
      note: $('spendNote').value,
      type: 'spending',
    });
    e.target.reset();
    $('spendDate').value = today();
    e.target.classList.add('hidden');
  });

  // Avoided form
  $('avoidedForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const item = $('avoidedItem').value.trim();
    const cost = parseFloat($('avoidedCost').value);
    if (!item || !(cost > 0)) return;
    addTransaction({
      date: $('avoidedDate').value || today(),
      amount: 0,
      category: 'Avoided',
      note: `${item} ($${cost.toFixed(2)})`,
      type: 'avoided',
    });
    e.target.reset();
    $('avoidedDate').value = today();
    e.target.classList.add('hidden');
  });

  // Savings form
  $('savingsForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const dollars = parseInt($('extraDollars').value) || 0;
    const cents   = parseInt($('extraCents').value) || 0;
    if (dollars === 0 && cents === 0) return;
    const amount = dollars + cents / 100;
    addTransaction({
      date: $('savingsDate').value || today(),
      amount,
      category: 'Extra Savings',
      note: '',
      type: 'savings',
    });
    e.target.reset();
    $('savingsDate').value = today();
    e.target.classList.add('hidden');
  });

  // Withdraw form
  $('withdrawForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat($('withdrawAmount').value);
    if (!(amount > 0)) return;
    addTransaction({
      date: $('withdrawDate').value || today(),
      amount,
      category: 'Withdrawal',
      note: $('withdrawReason').value,
      type: 'withdrawal',
    });
    e.target.reset();
    $('withdrawDate').value = today();
    e.target.classList.add('hidden');
  });

  // Sub cycle toggle
  $('subBillingCycle')?.addEventListener('change', e => {
    $('billingMonthGroup').style.display = e.target.value === 'yearly' ? '' : 'none';
  });

  // Sub form
  $('subForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('subName').value.trim();
    const amount = parseFloat($('subAmount').value);
    if (!name || !(amount > 0)) return;
    const cycle = $('subBillingCycle').value;
    addSubscription({
      name,
      amount,
      dayOfMonth: parseInt($('subDay').value),
      category: $('subCategory').value,
      billingCycle: cycle,
      billingMonth: cycle === 'yearly' ? parseInt($('subBillingMonth').value) : null,
      active: $('subActive').checked,
    });
    e.target.reset();
    $('billingMonthGroup').style.display = 'none';
    e.target.classList.add('hidden');
  });

  // Report dropdowns
  $('reportMonth')?.addEventListener('change', () => { reportView.month = parseInt($('reportMonth').value); renderReports(); });
  $('reportYear')?.addEventListener('change', () => { reportView.year = parseInt($('reportYear').value); renderReports(); });

  // Calendar nav
  $('calPrev')?.addEventListener('click', () => { calView.month--; if (calView.month < 0) { calView.month = 11; calView.year--; } renderCalendar(); });
  $('calNext')?.addEventListener('click', () => { calView.month++; if (calView.month > 11) { calView.month = 0; calView.year++; } renderCalendar(); });
  $('calToday')?.addEventListener('click', () => { const n = new Date(); calView = { year: n.getFullYear(), month: n.getMonth() }; renderCalendar(); });

  // Modal
  $('modalClose')?.addEventListener('click', closeDayModal);
  $('dayModal')?.addEventListener('click', e => { if (e.target.id === 'dayModal') closeDayModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDayModal(); });

  // Modal quick-add
  $('modalAddForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat($('modalAmount').value);
    if (!(amount > 0)) return;
    addTransaction({
      date: modalDate || $('modalDatePick').value || today(),
      amount,
      category: $('modalCat').value,
      note: $('modalNote').value,
      type: $('modalType').value,
    });
    e.target.reset();
    if ($('modalDatePick')) $('modalDatePick').value = modalDate;
  });
  $('modalCat')?.replaceChildren(...CATEGORIES.map(c => Object.assign(document.createElement('option'), { textContent: c })));

  // Settings
  $('settingsForm')?.addEventListener('submit', e => {
    e.preventDefault();
    state.config.monthlyBudget         = parseFloat($('setBudget').value) || DEFAULTS.monthlyBudget;
    state.config.monthlySavingsTarget  = parseFloat($('setTarget').value) || DEFAULTS.monthlySavingsTarget;
    state.config.goalAmount            = parseFloat($('setGoal').value) || DEFAULTS.goalAmount;
    state.config.goalName              = $('setGoalName').value.trim() || DEFAULTS.goalName;
    state.config.goalEmoji             = $('setGoalEmoji').value.trim() || DEFAULTS.goalEmoji;
    state.config.startDate             = $('setStartDate').value || DEFAULTS.startDate;
    save();
    alert('Settings saved.');
  });

  // Export / Import
  $('exportBtn')?.addEventListener('click', exportData);
  $('importInput')?.addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); });

  // Reset
  $('resetDataBtn')?.addEventListener('click', () => {
    if (confirm('⚠️ Delete ALL data? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });
}

// ── PWA Service Worker ───────────────────────────────────────────
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

// ── Sync UI ──────────────────────────────────────────────────────
function updateSyncUI(user) {
  const signedOut = $('syncSignedOut');
  const signedIn  = $('syncSignedIn');
  const status    = $('syncStatus');
  if (user) {
    if (signedOut) signedOut.hidden = true;
    if (signedIn)  signedIn.hidden  = false;
    set('syncUserEmail', user.email);
    if (status) status.textContent = 'Synced across all your signed-in devices.';
  } else {
    if (signedOut) signedOut.hidden = false;
    if (signedIn)  signedIn.hidden  = true;
    const form = $('syncSignInForm');
    const verify = $('syncVerifyForm');
    if (form) form.hidden = false;
    if (verify) verify.hidden = true;
    if (status) status.textContent = 'Sign in to sync across devices. We email you a 6-digit code.';
  }
}

function setupSync() {
  if (!window.StingraySync) return;

  let pendingEmail = null;

  function showVerifyStep(email) {
    pendingEmail = email;
    set('syncVerifyEmail', email);
    const form = $('syncSignInForm');
    const verify = $('syncVerifyForm');
    if (form) form.hidden = true;
    if (verify) { verify.hidden = false; $('syncCode')?.focus(); }
  }

  function showEmailStep() {
    pendingEmail = null;
    const form = $('syncSignInForm');
    const verify = $('syncVerifyForm');
    if (form) form.hidden = false;
    if (verify) verify.hidden = true;
    const code = $('syncCode');
    if (code) code.value = '';
  }

  async function sendCode(email, btn) {
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await window.StingraySync.signIn(email);
      showVerifyStep(email);
    } catch (err) {
      alert('Could not send code: ' + (err?.message || err));
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  }

  $('syncSignInForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('syncEmail')?.value.trim();
    if (!email) return;
    await sendCode(email, e.target.querySelector('button[type="submit"]'));
  });

  $('syncVerifyForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const code = $('syncCode')?.value.trim();
    if (!code || !pendingEmail) return;
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Verifying…';
    try {
      await window.StingraySync.verifyCode(pendingEmail, code);
      showEmailStep();
      $('syncEmail').value = '';
    } catch (err) {
      alert('Invalid code: ' + (err?.message || err));
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  });

  $('syncResendBtn')?.addEventListener('click', async e => {
    if (!pendingEmail) return;
    await sendCode(pendingEmail, e.target);
  });

  $('syncSignOutBtn')?.addEventListener('click', async () => {
    if (!confirm('Sign out of this device? Your data stays on other signed-in devices and in the cloud.')) return;
    await window.StingraySync.signOut();
  });

  window.StingraySync.init({
    onRemoteState: remote => applyRemoteState(remote),
    onAuthChange: user => updateSyncUI(user),
  });
}

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  load();
  setupTabs();
  setupForms();
  checkAchievements();
  render();
  registerSW();
  setupSync();
});
