import * as SQLite from 'expo-sqlite';

const DB_NAME = 'koda.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(db);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      category_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      amount_limit REAL NOT NULL,
      month_year TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      description TEXT,
      category_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'monthly')),
      next_date TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      streak INTEGER NOT NULL DEFAULT 0,
      last_active TEXT,
      streak_freeze INTEGER NOT NULL DEFAULT 1,
      ai_parsed_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      badge_key TEXT NOT NULL UNIQUE,
      unlocked_at TEXT,
      progress REAL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS daily_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      target INTEGER NOT NULL DEFAULT 1,
      current INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0
    );
  `);

  // ── Migrations ──────────────────────────────────────────────────
  // Add ai_parsed_count column if it doesn't exist
  const tableInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(user_stats)`);
  const hasAiParsedCount = tableInfo.some(col => col.name === 'ai_parsed_count');
  
  if (!hasAiParsedCount) {
    try {
      await db.execAsync(
        `ALTER TABLE user_stats ADD COLUMN ai_parsed_count INTEGER NOT NULL DEFAULT 0;`
      );
    } catch (e) {
      console.error('Migration failed for ai_parsed_count:', e);
    }
  }

  // Migrate existing category emojis to Lucide icon names
  try {
    await db.execAsync(`
      UPDATE categories SET icon = 'Pizza' WHERE icon = '🍔';
      UPDATE categories SET icon = 'Car' WHERE icon = '🚗';
      UPDATE categories SET icon = 'ShoppingBag' WHERE icon = '🛍️';
      UPDATE categories SET icon = 'Gamepad2' WHERE icon = '🎮';
      UPDATE categories SET icon = 'Lightbulb' WHERE icon = '💡';
      UPDATE categories SET icon = 'HeartPulse' WHERE icon = '🏥';
      UPDATE categories SET icon = 'Book' WHERE icon = '📚';
      UPDATE categories SET icon = 'ShoppingCart' WHERE icon = '🛒';
      UPDATE categories SET icon = 'Briefcase' WHERE icon = '💼';
      UPDATE categories SET icon = 'Laptop' WHERE icon = '💻';
      UPDATE categories SET icon = 'TrendingUp' WHERE icon = '📈';
      UPDATE categories SET icon = 'Gift' WHERE icon = '🎁';
      UPDATE categories SET icon = 'Coins' WHERE icon = '💰';
      UPDATE categories SET icon = 'Package' WHERE icon = '📦';
    `);
  } catch (e) {
    console.error('Migration failed for category icons:', e);
  }

  // Seed default categories if empty
  const categoryCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (categoryCount && categoryCount.count === 0) {
    await db.execAsync(`
      INSERT INTO categories (name, type, icon) VALUES
        ('Food & Drinks', 'expense', 'Pizza'),
        ('Transport', 'expense', 'Car'),
        ('Shopping', 'expense', 'ShoppingBag'),
        ('Entertainment', 'expense', 'Gamepad2'),
        ('Bills & Utilities', 'expense', 'Lightbulb'),
        ('Health', 'expense', 'HeartPulse'),
        ('Education', 'expense', 'Book'),
        ('Groceries', 'expense', 'ShoppingCart'),
        ('Salary', 'income', 'Briefcase'),
        ('Freelance', 'income', 'Laptop'),
        ('Investment', 'income', 'TrendingUp'),
        ('Gift', 'income', 'Gift'),
        ('Other Income', 'income', 'Coins'),
        ('Other Expense', 'expense', 'Package');
    `);
  }

  // Seed initial user stats if empty
  const userStats = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_stats'
  );
  if (userStats && userStats.count === 0) {
    await db.execAsync(`
      INSERT INTO user_stats (id, xp, level, streak, streak_freeze, ai_parsed_count) VALUES (1, 0, 1, 0, 1, 0);
    `);
  }

  // Seed default achievements
  const achievementCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM achievements'
  );
  if (achievementCount && achievementCount.count === 0) {
    await db.execAsync(`
      INSERT INTO achievements (badge_key, progress) VALUES
        ('first_steps', 0.0),
        ('on_fire', 0.0),
        ('budget_boss', 0.0),
        ('ai_whisperer', 0.0),
        ('penny_pincher', 0.0),
        ('century_club', 0.0);
    `);
  }
}

// ── Type Definitions ──────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
}

export interface Transaction {
  id: number;
  amount: number;
  description: string | null;
  date: string;
  category_id: number;
  type: 'income' | 'expense';
}

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_icon: string | null;
}

export interface UserStats {
  id: number;
  xp: number;
  level: number;
  streak: number;
  last_active: string | null;
  streak_freeze: number;
  ai_parsed_count: number;
}

export interface Achievement {
  id: number;
  badge_key: string;
  unlocked_at: string | null;
  progress: number;
}

export interface DailyGoal {
  id: number;
  date: string;
  target: number;
  current: number;
  completed: number;
}

export interface RecurringTransaction {
  id: number;
  amount: number;
  description: string | null;
  category_id: number;
  type: 'income' | 'expense';
  frequency: 'weekly' | 'monthly';
  next_date: string;
}

export interface RecurringTransactionWithCategory extends RecurringTransaction {
  category_name: string;
  category_icon: string | null;
}

// ── Query Helpers ─────────────────────────────────────────────────

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const db = await getDatabase();
  if (type) {
    return db.getAllAsync<Category>('SELECT * FROM categories WHERE type = ?', [type]);
  }
  return db.getAllAsync<Category>('SELECT * FROM categories');
}

export async function getTransactions(limit = 20): Promise<TransactionWithCategory[]> {
  const db = await getDatabase();
  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.date DESC, t.id DESC
     LIMIT ?`,
    [limit]
  );
}

export async function getTransactionsPaginated(
  offset: number,
  limit: number,
  typeFilter?: 'income' | 'expense' | null,
  categoryIdFilter?: number | null
): Promise<TransactionWithCategory[]> {
  const db = await getDatabase();
  let query = `SELECT t.*, c.name as category_name, c.icon as category_icon
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE 1=1`;
  const params: any[] = [];

  if (typeFilter) {
    query += ` AND t.type = ?`;
    params.push(typeFilter);
  }
  if (categoryIdFilter) {
    query += ` AND t.category_id = ?`;
    params.push(categoryIdFilter);
  }

  query += ` ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.getAllAsync<TransactionWithCategory>(query, params);
}

export async function getAllTransactions(): Promise<TransactionWithCategory[]> {
  const db = await getDatabase();
  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.date DESC, t.id DESC`
  );
}

export async function getRecurringTransactions(): Promise<RecurringTransactionWithCategory[]> {
  const db = await getDatabase();
  return db.getAllAsync<RecurringTransactionWithCategory>(
    `SELECT r.*, c.name as category_name, c.icon as category_icon
     FROM recurring_transactions r
     LEFT JOIN categories c ON r.category_id = c.id
     ORDER BY r.next_date ASC`
  );
}

export async function addRecurringTransaction(
  amount: number,
  description: string | null,
  categoryId: number,
  type: 'income' | 'expense',
  frequency: 'weekly' | 'monthly',
  nextDate: string
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO recurring_transactions (amount, description, category_id, type, frequency, next_date) VALUES (?, ?, ?, ?, ?, ?)',
    [amount, description, categoryId, type, frequency, nextDate]
  );
  return result.lastInsertRowId;
}

export async function deleteRecurringTransaction(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recurring_transactions WHERE id = ?', [id]);
}

export async function processRecurringTransactions(): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  
  const dueTransactions = await db.getAllAsync<RecurringTransaction>(
    'SELECT * FROM recurring_transactions WHERE next_date <= ?',
    [today]
  );

  let processedCount = 0;
  for (const recurring of dueTransactions) {
    await addTransaction(
      recurring.amount,
      recurring.description,
      today,
      recurring.category_id,
      recurring.type,
      false
    );
    
    const d = new Date(recurring.next_date);
    if (recurring.frequency === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    const newNextDate = d.toISOString().split('T')[0];
    
    await db.runAsync(
      'UPDATE recurring_transactions SET next_date = ? WHERE id = ?',
      [newNextDate, recurring.id]
    );
    processedCount++;
  }
  
  return processedCount;
}

export async function getTodayTransactions(): Promise<TransactionWithCategory[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.date = ?
     ORDER BY t.id DESC`,
    [today]
  );
}

export async function addTransaction(
  amount: number,
  description: string | null,
  date: string,
  categoryId: number,
  type: 'income' | 'expense',
  aiParsed: boolean = false
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO transactions (amount, description, date, category_id, type) VALUES (?, ?, ?, ?, ?)',
    [amount, description, date, categoryId, type]
  );

  // Award XP: +15 for AI parsed, +10 for manual
  await addXP(aiParsed ? 15 : 10);

  // Track AI usage
  if (aiParsed) {
    await db.runAsync(
      'UPDATE user_stats SET ai_parsed_count = ai_parsed_count + 1 WHERE id = 1'
    );
  }

  // Update daily goal
  await updateDailyGoal();

  // Check achievements
  await checkAchievements();

  return result.lastInsertRowId;
}

export async function getUserStats(): Promise<UserStats> {
  const db = await getDatabase();
  const stats = await db.getFirstAsync<UserStats>('SELECT * FROM user_stats WHERE id = 1');
  if (stats) return stats;
  
  // Return a safe default if not found (should be seeded, but this prevents crashes)
  return {
    id: 1,
    xp: 0,
    level: 1,
    streak: 0,
    last_active: null,
    streak_freeze: 1,
    ai_parsed_count: 0
  };
}

export async function addXP(amount: number): Promise<UserStats> {
  const db = await getDatabase();

  await db.runAsync('UPDATE user_stats SET xp = xp + ? WHERE id = 1', [amount]);

  // Check for level up
  const stats = await getUserStats();
  const newLevel = calculateLevel(stats.xp);
  if (newLevel > stats.level) {
    await db.runAsync('UPDATE user_stats SET level = ? WHERE id = 1', [newLevel]);
  }

  return getUserStats();
}

export function calculateLevel(xp: number): number {
  if (xp >= 2000) return 6;
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
}

export function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: '💰 Penny Starter',
    2: '💵 Cash Tracker',
    3: '📊 Budget Builder',
    4: '🏦 Money Manager',
    5: '👑 Finance Master',
    6: '🌟 Koda Legend',
  };
  return titles[level] || '💰 Penny Starter';
}

export function getXPForNextLevel(level: number): number {
  const thresholds: Record<number, number> = {
    1: 100,
    2: 300,
    3: 600,
    4: 1000,
    5: 2000,
    6: 9999,
  };
  return thresholds[level] || 100;
}

export function getXPForCurrentLevel(level: number): number {
  const thresholds: Record<number, number> = {
    1: 0,
    2: 100,
    3: 300,
    4: 600,
    5: 1000,
    6: 2000,
  };
  return thresholds[level] || 0;
}

export async function updateStreak(): Promise<void> {
  const db = await getDatabase();
  const stats = await getUserStats();
  const today = new Date().toISOString().split('T')[0];

  if (stats.last_active === today) return; // Already updated today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (stats.last_active === yesterdayStr) {
    // Continue streak
    await db.runAsync(
      'UPDATE user_stats SET streak = streak + 1, last_active = ? WHERE id = 1',
      [today]
    );
    await addXP(10); // Streak bonus
  } else if (stats.last_active && stats.last_active !== today) {
    // Streak broken — check for freeze
    if (stats.streak_freeze > 0) {
      await db.runAsync(
        'UPDATE user_stats SET streak_freeze = streak_freeze - 1, last_active = ? WHERE id = 1',
        [today]
      );
    } else {
      await db.runAsync(
        'UPDATE user_stats SET streak = 1, last_active = ? WHERE id = 1',
        [today]
      );
    }
  } else {
    // First time
    await db.runAsync(
      'UPDATE user_stats SET streak = 1, last_active = ? WHERE id = 1',
      [today]
    );
  }
}

async function updateDailyGoal(): Promise<void> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const goal = await db.getFirstAsync<DailyGoal>(
    'SELECT * FROM daily_goals WHERE date = ?',
    [today]
  );

  if (goal) {
    const newCurrent = goal.current + 1;
    const completed = newCurrent >= goal.target ? 1 : 0;
    await db.runAsync(
      'UPDATE daily_goals SET current = ?, completed = ? WHERE id = ?',
      [newCurrent, completed, goal.id]
    );
    if (completed && !goal.completed) {
      await addXP(25); // Daily goal bonus
    }
  } else {
    await db.runAsync(
      'INSERT INTO daily_goals (date, target, current, completed) VALUES (?, 1, 1, 1)',
      [today]
    );
    await addXP(25);
  }
}

export async function getDailyGoal(): Promise<DailyGoal | null> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  return db.getFirstAsync<DailyGoal>(
    'SELECT * FROM daily_goals WHERE date = ?',
    [today]
  );
}

export async function getAchievements(): Promise<Achievement[]> {
  const db = await getDatabase();
  return db.getAllAsync<Achievement>('SELECT * FROM achievements');
}

async function checkAchievements(): Promise<void> {
  const db = await getDatabase();

  // First Steps — log first transaction
  const txCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions'
  );
  if (txCount && txCount.count >= 1) {
    await db.runAsync(
      `UPDATE achievements SET progress = 1.0, unlocked_at = COALESCE(unlocked_at, ?)
       WHERE badge_key = 'first_steps'`,
      [new Date().toISOString()]
    );
  }

  // On Fire — 7-day streak
  const stats = await getUserStats();
  if (stats.streak >= 7) {
    await db.runAsync(
      `UPDATE achievements SET progress = 1.0, unlocked_at = COALESCE(unlocked_at, ?)
       WHERE badge_key = 'on_fire'`,
      [new Date().toISOString()]
    );
  } else {
    await db.runAsync(
      `UPDATE achievements SET progress = ? WHERE badge_key = 'on_fire' AND unlocked_at IS NULL`,
      [Math.min(stats.streak / 7, 1.0)]
    );
  }

  // Century Club — 100-day streak
  if (stats.streak >= 100) {
    await db.runAsync(
      `UPDATE achievements SET progress = 1.0, unlocked_at = COALESCE(unlocked_at, ?)
       WHERE badge_key = 'century_club'`,
      [new Date().toISOString()]
    );
  } else {
    await db.runAsync(
      `UPDATE achievements SET progress = ? WHERE badge_key = 'century_club' AND unlocked_at IS NULL`,
      [Math.min(stats.streak / 100, 1.0)]
    );
  }

  // AI Whisperer — 50 AI-parsed transactions
  if (stats.ai_parsed_count >= 50) {
    await db.runAsync(
      `UPDATE achievements SET progress = 1.0, unlocked_at = COALESCE(unlocked_at, ?)
       WHERE badge_key = 'ai_whisperer'`,
      [new Date().toISOString()]
    );
  } else {
    await db.runAsync(
      `UPDATE achievements SET progress = ? WHERE badge_key = 'ai_whisperer' AND unlocked_at IS NULL`,
      [Math.min(stats.ai_parsed_count / 50, 1.0)]
    );
  }
}

export async function getMonthlyTotals(): Promise<{ income: number; expense: number }> {
  const db = await getDatabase();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const income = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND date >= ? AND date <= ?`,
    [firstDay, lastDay]
  );

  const expense = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= ? AND date <= ?`,
    [firstDay, lastDay]
  );

  return {
    income: income?.total || 0,
    expense: expense?.total || 0,
  };
}

// ── Budget Types & Queries ────────────────────────────────────────

export interface Budget {
  id: number;
  category_id: number;
  amount_limit: number;
  month_year: string;
}

export interface BudgetWithProgress extends Budget {
  category_name: string;
  category_icon: string | null;
  spent: number;
  progress: number; // 0 to 1+
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${month}-${now.getFullYear()}`;
}

export async function getBudgets(monthYear?: string): Promise<BudgetWithProgress[]> {
  const db = await getDatabase();
  const my = monthYear || getCurrentMonthYear();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const budgets = await db.getAllAsync<Budget & { category_name: string; category_icon: string | null }>(
    `SELECT b.*, c.name as category_name, c.icon as category_icon
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.month_year = ?
     ORDER BY c.name`,
    [my]
  );

  const result: BudgetWithProgress[] = [];
  for (const b of budgets) {
    const spentRow = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions
       WHERE category_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
      [b.category_id, firstDay, lastDay]
    );
    const spent = spentRow?.total || 0;
    result.push({
      ...b,
      spent,
      progress: b.amount_limit > 0 ? spent / b.amount_limit : 0,
    });
  }

  return result;
}

export async function setBudget(
  categoryId: number,
  amountLimit: number,
  monthYear?: string
): Promise<void> {
  const db = await getDatabase();
  const my = monthYear || getCurrentMonthYear();

  const existing = await db.getFirstAsync<Budget>(
    'SELECT * FROM budgets WHERE category_id = ? AND month_year = ?',
    [categoryId, my]
  );

  if (existing) {
    await db.runAsync(
      'UPDATE budgets SET amount_limit = ? WHERE id = ?',
      [amountLimit, existing.id]
    );
  } else {
    await db.runAsync(
      'INSERT INTO budgets (category_id, amount_limit, month_year) VALUES (?, ?, ?)',
      [categoryId, amountLimit, my]
    );
    await addXP(20); // Budget creation XP
  }
}

export async function deleteBudget(budgetId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budgets WHERE id = ?', [budgetId]);
}

// ── Chart Data Helpers ────────────────────────────────────────────

export interface DailySpending {
  date: string;
  dayLabel: string;
  amount: number;
}

export async function getWeeklySpending(): Promise<DailySpending[]> {
  const db = await getDatabase();
  const days: DailySpending[] = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const row = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date = ?`,
      [dateStr]
    );
    days.push({
      date: dateStr,
      dayLabel: dayLabels[d.getDay()],
      amount: row?.total || 0,
    });
  }

  return days;
}

export interface CategorySpending {
  name: string;
  icon: string;
  total: number;
  color: string;
}

const CATEGORY_COLORS = [
  '#58CC02', '#1CB0F6', '#CE82FF', '#FFC800',
  '#FF4B4B', '#FF9600', '#4B4B4B', '#AFAFAF',
];

export async function getCategorySpending(): Promise<CategorySpending[]> {
  const db = await getDatabase();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const rows = await db.getAllAsync<{ category_name: string; category_icon: string | null; total: number }>(
    `SELECT c.name as category_name, c.icon as category_icon, SUM(t.amount) as total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY t.category_id
     ORDER BY total DESC`,
    [firstDay, lastDay]
  );

  return rows.map((row, index) => ({
    name: row.category_name,
    icon: row.category_icon || '📦',
    total: row.total,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
}
