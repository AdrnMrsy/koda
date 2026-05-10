/**
 * Category keyword mappings for the Smart Parser.
 * Maps common Filipino merchant names, keywords, and phrases to category names.
 *
 * The key is the category name (must match the DB categories exactly).
 * The values are arrays of lowercase keywords/phrases that indicate the category.
 */

export const EXPENSE_KEYWORDS: Record<string, string[]> = {
  'Food & Drinks': [
    // Fast food & restaurants
    'jollibee', 'mcdonalds', 'mcdonald', 'mcdo', 'kfc', 'burger king',
    'wendy', 'subway', 'pizza hut', 'dominos', 'greenwich', 'chowking',
    'mang inasal', 'bonchon', 'yellow cab', 'army navy', 'shakeys',
    'starbucks', 'coffee bean', 'tim hortons', 'dunkin', 'krispy kreme',
    // General food keywords
    'food', 'lunch', 'dinner', 'breakfast', 'brunch', 'snack', 'meal',
    'eat', 'ate', 'restaurant', 'resto', 'dine', 'dining', 'kain',
    'coffee', 'milk tea', 'milktea', 'boba', 'drink', 'drinks',
    'beer', 'wine', 'pulutan', 'inuman',
  ],

  'Transport': [
    // Ride-hailing & transport
    'grab', 'angkas', 'joyride', 'moveit', 'lalamove',
    'uber', 'taxi', 'cab',
    // Public transport
    'jeep', 'jeepney', 'bus', 'mrt', 'lrt', 'train', 'fx',
    'tricycle', 'trike', 'pedicab', 'habal',
    // General
    'gas', 'gasoline', 'fuel', 'diesel', 'petrol', 'shell', 'petron',
    'caltex', 'parking', 'toll', 'fare', 'ride', 'commute',
    'transport', 'transportation', 'travel',
  ],

  'Shopping': [
    // Malls & stores
    'sm', 'robinsons', 'ayala', 'uniqlo', 'h&m', 'zara',
    'nike', 'adidas', 'bench', 'penshoppe', 'forever 21',
    'miniso', 'daiso', 'watsons', 'mercury drug',
    // Online shopping
    'lazada', 'shopee', 'zalora', 'shein', 'temu',
    'amazon', 'aliexpress',
    // General
    'shop', 'shopping', 'buy', 'bought', 'purchase', 'mall',
    'store', 'clothes', 'clothing', 'shoes', 'bag', 'gadget',
  ],

  'Entertainment': [
    'movie', 'movies', 'cinema', 'netflix', 'spotify',
    'youtube', 'disney', 'hbo', 'game', 'games', 'gaming',
    'playstation', 'ps5', 'xbox', 'nintendo', 'steam',
    'concert', 'gig', 'event', 'party', 'bar', 'club',
    'bowling', 'arcade', 'karaoke', 'ktv',
    'entertainment', 'fun', 'hobby', 'hobby',
  ],

  'Bills & Utilities': [
    'electric', 'electricity', 'meralco', 'water', 'maynilad', 'manila water',
    'internet', 'wifi', 'pldt', 'globe', 'converge', 'sky',
    'phone', 'load', 'prepaid', 'postpaid', 'plan',
    'rent', 'rental', 'apartment', 'condo', 'mortgage',
    'bill', 'bills', 'utility', 'utilities', 'insurance',
    'hmo', 'sss', 'pagibig', 'pag-ibig', 'philhealth',
  ],

  'Health': [
    'doctor', 'hospital', 'clinic', 'checkup', 'check-up',
    'medicine', 'meds', 'pharmacy', 'drugstore',
    'dental', 'dentist', 'eye', 'optometrist',
    'gym', 'fitness', 'workout', 'exercise',
    'health', 'medical', 'vitamins', 'supplement',
  ],

  'Education': [
    'school', 'tuition', 'college', 'university',
    'book', 'books', 'textbook', 'notebook',
    'course', 'class', 'lesson', 'tutorial',
    'udemy', 'coursera', 'skillshare',
    'education', 'study', 'studying', 'exam',
  ],

  'Groceries': [
    'grocery', 'groceries', 'supermarket', 'palengke', 'market',
    'puregold', 'savemore', 'landers', 'snr', 's&r',
    'metro', 'ever', 'waltermart', 'landmark',
    'rice', 'meat', 'fish', 'vegetables', 'fruit', 'fruits',
    'egg', 'eggs', 'milk', 'bread', 'cooking', 'ingredients',
  ],
};

export const INCOME_KEYWORDS: Record<string, string[]> = {
  'Salary': [
    'salary', 'sahod', 'sweldo', 'payroll', 'pay', 'wage', 'wages',
    'compensation', 'paycheck',
  ],

  'Freelance': [
    'freelance', 'freelancing', 'gig', 'project', 'client',
    'commission', 'consulting', 'contract', 'side hustle',
    'sideline', 'raket',
  ],

  'Investment': [
    'investment', 'invest', 'dividend', 'stock', 'stocks',
    'crypto', 'bitcoin', 'interest', 'return', 'roi',
    'mutual fund', 'bond', 'bonds', 'trading', 'profit',
  ],

  'Gift': [
    'gift', 'regalo', 'birthday', 'christmas', 'bonus',
    'aguinaldo', 'cash gift', 'received', 'given',
    'allowance', 'baon', 'padala', 'remittance',
  ],

  'Other Income': [
    'sold', 'selling', 'sale', 'refund', 'rebate',
    'cashback', 'reward', 'prize', 'won', 'lottery',
    'income', 'earn', 'earned', 'earnings',
  ],
};

/**
 * Expense-related trigger words that indicate spending.
 */
export const EXPENSE_TRIGGERS = [
  'spent', 'spend', 'paid', 'pay', 'bought', 'buy',
  'cost', 'charged', 'expense', 'gastos', 'binayaran',
  'nagbayad', 'bumili', 'ginastos', 'loss', 'lost',
];

/**
 * Income-related trigger words that indicate earning.
 */
export const INCOME_TRIGGERS = [
  'earned', 'earn', 'received', 'got', 'income',
  'salary', 'sahod', 'sweldo', 'nakuha', 'natanggap',
  'profit', 'gain', 'gained', 'sold', 'refund',
];
