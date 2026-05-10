import {
  getMonthlyTotals,
  getTodayTransactions,
  getTransactions,
  getUserStats,
  getCategorySpending,
  getBudgets,
  getCategories,
  addTransaction,
  type TransactionWithCategory,
  type Category,
} from '@/db/database';
import { parseTransaction, isNaturalLanguageInput } from './smartParser';

// ── Types ─────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  action?: 'transaction_logged' | 'query_result';
}

// ── Intent Detection ──────────────────────────────────────────────

type Intent =
  | 'greeting'
  | 'how_much_spent'
  | 'how_much_earned'
  | 'monthly_summary'
  | 'today_summary'
  | 'top_spending'
  | 'budget_status'
  | 'streak_status'
  | 'xp_status'
  | 'level_status'
  | 'log_transaction'
  | 'help'
  | 'unknown';

function detectIntent(text: string): Intent {
  const lower = text.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|yo|sup|kumusta|musta|good\s*(morning|afternoon|evening))/.test(lower)) {
    return 'greeting';
  }

  // Help
  if (/\b(help|what can you do|commands|how to use)\b/.test(lower)) {
    return 'help';
  }

  // Spending queries
  if (/how\s*much.*(spent|spend|expense|gastos)/i.test(lower) || /total\s*(expenses?|spending)/i.test(lower)) {
    return 'how_much_spent';
  }

  // Income queries
  if (/how\s*much.*(earn|income|salary|sahod|received)/i.test(lower) || /total\s*income/i.test(lower)) {
    return 'how_much_earned';
  }

  // Monthly summary
  if (/\b(summary|overview|report|breakdown|month)\b/i.test(lower) && !/today/i.test(lower)) {
    return 'monthly_summary';
  }

  // Today
  if (/\b(today|ngayon)\b/i.test(lower)) {
    return 'today_summary';
  }

  // Top spending
  if (/\b(top|biggest|most|highest|where|ano)\b.*\b(spend|spent|expense|gastos|category)\b/i.test(lower)) {
    return 'top_spending';
  }

  // Budget
  if (/\b(budget|limit)\b/i.test(lower)) {
    return 'budget_status';
  }

  // Streak
  if (/\b(streak|day|days)\b/i.test(lower)) {
    return 'streak_status';
  }

  // XP
  if (/\b(xp|experience|points)\b/i.test(lower)) {
    return 'xp_status';
  }

  // Level
  if (/\b(level|rank)\b/i.test(lower)) {
    return 'level_status';
  }

  // Check if it looks like a transaction to log
  const parsed = parseTransaction(lower);
  if (parsed.amount && parsed.confidence >= 0.4) {
    return 'log_transaction';
  }

  return 'unknown';
}

// ── Response Generators ───────────────────────────────────────────

const KODA_GREETINGS = [
  "Hey there! I'm Koda, your finance buddy! Ask me anything about your spending, or just tell me what you spent today!",
  "Hi friend! ✨ Ready to talk money? I can check your spending, track your budget, or log a transaction!",
  "Kumusta! I'm here to help with your finances. What would you like to know?",
];

const KODA_UNKNOWNS = [
  "Hmm, I'm not sure what you mean 🤔 Try asking things like:\n\n• \"How much did I spend this month?\"\n• \"What's my budget status?\"\n• \"spent 500 on groceries\"\n• \"What's my streak?\"",
  "I didn't quite get that! I can help with spending questions, budgets, or logging transactions. Try asking me something specific!",
];

export async function generateResponse(userMessage: string): Promise<ChatMessage> {
  const intent = detectIntent(userMessage);
  let text = '';
  let action: ChatMessage['action'] = undefined;

  try {
    switch (intent) {
      case 'greeting': {
        text = KODA_GREETINGS[Math.floor(Math.random() * KODA_GREETINGS.length)];
        break;
      }

      case 'help': {
        text = "Here's what I can do!\n\n" +
          "💬 **Ask me about your finances:**\n" +
          "• \"How much did I spend this month?\"\n" +
          "• \"What's my income this month?\"\n" +
          "• \"Show me today's transactions\"\n" +
          "• \"What's my top spending category?\"\n" +
          "• \"Budget status?\"\n\n" +
          "📊 **Check your stats:**\n" +
          "• \"What's my streak?\"\n" +
          "• \"How much XP do I have?\"\n" +
          "• \"What level am I?\"\n\n" +
          "💰 **Log a transaction:**\n" +
          "• \"spent 500 on groceries\"\n" +
          "• \"earned 2000 from freelance\"\n" +
          "• \"100 grab\"";
        break;
      }

      case 'how_much_spent': {
        const totals = await getMonthlyTotals();
        const catSpending = await getCategorySpending();
        const topCat = catSpending.length > 0 ? catSpending[0] : null;

        text = `📉 This month you've spent **₱${totals.expense.toLocaleString()}**`;
        if (topCat) {
          text += `\n\nYour top category is ${topCat.icon} **${topCat.name}** at ₱${topCat.total.toLocaleString()}`;
        }
        if (totals.income > 0) {
          const savings = totals.income - totals.expense;
          text += `\n\n${savings >= 0 ? '✅' : '⚠️'} Net: ${savings >= 0 ? '+' : ''}₱${savings.toLocaleString()}`;
        }
        action = 'query_result';
        break;
      }

      case 'how_much_earned': {
        const totals = await getMonthlyTotals();
        text = `📈 This month you've earned **₱${totals.income.toLocaleString()}**`;
        if (totals.expense > 0) {
          const rate = Math.round(((totals.income - totals.expense) / totals.income) * 100);
          text += `\n\nSavings rate: **${rate}%** ${rate >= 20 ? '🎉' : rate >= 0 ? '👍' : '😬'}`;
        }
        action = 'query_result';
        break;
      }

      case 'monthly_summary': {
        const totals = await getMonthlyTotals();
        const net = totals.income - totals.expense;
        const catSpending = await getCategorySpending();

        text = `📊 **Monthly Summary**\n\n` +
          `📈 Income: ₱${totals.income.toLocaleString()}\n` +
          `📉 Expenses: ₱${totals.expense.toLocaleString()}\n` +
          `${net >= 0 ? '✅' : '🚨'} Net: ${net >= 0 ? '+' : ''}₱${net.toLocaleString()}\n`;

        if (catSpending.length > 0) {
          text += `\n**Top Categories:**\n`;
          catSpending.slice(0, 5).forEach((cat, i) => {
            text += `${i + 1}. ${cat.icon} ${cat.name}: ₱${cat.total.toLocaleString()}\n`;
          });
        }
        action = 'query_result';
        break;
      }

      case 'today_summary': {
        const txns = await getTodayTransactions();
        if (txns.length === 0) {
          text = "No transactions today yet!\n\nTap the + button or tell me what you spent to get started and earn XP! ✨";
        } else {
          const totalSpent = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const totalEarned = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

          text = `📋 **Today's Activity** (${txns.length} transaction${txns.length > 1 ? 's' : ''})\n\n`;
          txns.forEach(tx => {
            const prefix = tx.type === 'income' ? '+' : '-';
            text += `${tx.category_icon || '📦'} ${tx.description || tx.category_name}: ${prefix}₱${tx.amount.toLocaleString()}\n`;
          });
          if (totalSpent > 0) text += `\n💸 Spent: ₱${totalSpent.toLocaleString()}`;
          if (totalEarned > 0) text += `\n💰 Earned: ₱${totalEarned.toLocaleString()}`;
        }
        action = 'query_result';
        break;
      }

      case 'top_spending': {
        const catSpending = await getCategorySpending();
        if (catSpending.length === 0) {
          text = "No spending data this month yet! Start logging expenses to see your breakdown.";
        } else {
          text = `🏆 **Top Spending Categories**\n\n`;
          const total = catSpending.reduce((s, c) => s + c.total, 0);
          catSpending.slice(0, 6).forEach((cat, i) => {
            const pct = Math.round((cat.total / total) * 100);
            text += `${i + 1}. ${cat.icon} **${cat.name}**: ₱${cat.total.toLocaleString()} (${pct}%)\n`;
          });
        }
        action = 'query_result';
        break;
      }

      case 'budget_status': {
        const budgets = await getBudgets();
        if (budgets.length === 0) {
          text = "You haven't set any budgets yet!\n\nGo to the Budget screen to set spending limits and earn the Budget Boss badge! 🏆";
        } else {
          text = `💰 **Budget Status**\n\n`;
          budgets.forEach(b => {
            const pct = Math.round(b.progress * 100);
            const status = b.progress >= 1 ? '🚨' : b.progress >= 0.8 ? '⚠️' : '✅';
            text += `${status} ${b.category_icon || '📦'} **${b.category_name}**: ₱${b.spent.toLocaleString()} / ₱${b.amount_limit.toLocaleString()} (${pct}%)\n`;
          });
        }
        action = 'query_result';
        break;
      }

      case 'streak_status': {
        const stats = await getUserStats();
        if (stats.streak === 0) {
          text = "You don't have a streak yet!\n\nLog a transaction today to start your streak! 🔥";
        } else {
          text = `🔥 You're on a **${stats.streak}-day streak**! ${stats.streak >= 7 ? 'Amazing!' : 'Keep it going!'}\n\n❄️ Streak freezes: ${stats.streak_freeze}`;
        }
        action = 'query_result';
        break;
      }

      case 'xp_status': {
        const stats = await getUserStats();
        text = `⭐ You have **${stats.xp.toLocaleString()} XP**!\n\n🤖 AI-parsed transactions: ${stats.ai_parsed_count}\n\nKeep logging to level up! 🚀`;
        action = 'query_result';
        break;
      }

      case 'level_status': {
        const stats = await getUserStats();
        text = `🏅 You're **Level ${stats.level}**!\n\n⭐ ${stats.xp.toLocaleString()} XP total\n🔥 ${stats.streak}-day streak\n\nKeep going! 💪`;
        action = 'query_result';
        break;
      }

      case 'log_transaction': {
        const parsed = parseTransaction(userMessage);
        if (parsed.amount && parsed.categoryName) {
          // Find the category ID
          const cats = await getCategories(parsed.type);
          const matchedCat = cats.find(
            c => c.name.toLowerCase() === parsed.categoryName!.toLowerCase()
          );

          if (matchedCat) {
            const today = new Date().toISOString().split('T')[0];
            await addTransaction(
              parsed.amount,
              parsed.description,
              today,
              matchedCat.id,
              parsed.type,
              true // AI parsed
            );

            text = `Logged!\n\n` +
              `**₱${parsed.amount.toLocaleString()}** → ${matchedCat.icon || '📦'} ${matchedCat.name}\n` +
              (parsed.description ? `📝 ${parsed.description}\n` : '') +
              `\n+15 XP earned!`;
            action = 'transaction_logged';
          } else {
            text = `I found ₱${parsed.amount.toLocaleString()} but couldn't match a category for "${parsed.categoryName}".\n\nTry the + tab to pick a category manually!`;
          }
        } else if (parsed.amount) {
          text = `I see ₱${parsed.amount.toLocaleString()} but I'm not sure about the category.\n\nTry being more specific, like "spent ${parsed.amount} on food" or use the + tab!`;
        } else {
          text = KODA_UNKNOWNS[Math.floor(Math.random() * KODA_UNKNOWNS.length)];
        }
        break;
      }

      default: {
        text = KODA_UNKNOWNS[Math.floor(Math.random() * KODA_UNKNOWNS.length)];
      }
    }
  } catch (error) {
    console.error('Chat error:', error);
    text = "Oops, something went wrong! 😅 Try again?";
  }

  return {
    id: Date.now().toString(),
    role: 'assistant',
    text,
    timestamp: new Date(),
    action,
  };
}
