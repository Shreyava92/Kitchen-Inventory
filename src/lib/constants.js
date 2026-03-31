export const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)

const EMOJI_KEYWORDS = [
  // Non-food categories first — prevent food substrings matching (e.g. "ham" in "shampoo")
  // Toiletries
  ['🧴', ['shampoo', 'conditioner', 'body wash', 'lotion', 'moisturizer', 'face wash', 'cleanser', 'toner', 'serum', 'sunscreen']],
  ['🪥', ['toothpaste', 'toothbrush', 'mouthwash', 'floss', 'whitening']],
  ['🧼', ['soap', 'hand wash', 'hand sanitizer', 'sanitizer']],
  ['🪒', ['razor', 'shaving cream', 'shaving gel', 'aftershave']],
  ['🧻', ['toilet paper', 'paper towel', 'tissue', 'kleenex', 'napkin']],
  ['💄', ['lipstick', 'mascara', 'foundation', 'concealer', 'blush', 'eyeliner', 'eyeshadow', 'makeup', 'nail polish']],
  ['🧽', ['sponge', 'scrubber', 'cleaning pad']],
  ['🫧', ['deodorant', 'antiperspirant', 'perfume', 'cologne', 'body spray']],
  // Medicine
  ['💊', ['ibuprofen', 'tylenol', 'aspirin', 'acetaminophen', 'allergy relief', 'antacid', 'cough', 'cold medicine', 'antibiotic', 'prescription', 'tablet', 'capsule', 'pill']],
  ['🩹', ['band-aid', 'bandage', 'gauze', 'first aid', 'antiseptic', 'neosporin']],
  ['🌡️', ['thermometer', 'thermomtr']],
  // Clothing
  ['👕', ['t-shirt', 'tshirt', 'shirt', 'top', 'blouse', 'tank']],
  ['👖', ['pants', 'jeans', 'trousers', 'jogger', 'shorts', 'legging']],
  ['🧥', ['jacket', 'coat', 'hoodie', 'sweater', 'sweatshirt', 'cardigan']],
  ['👗', ['dress', 'skirt', 'gown']],
  ['🧦', ['socks', 'sock']],
  ['🩲', ['boxer briefs', 'underwear', 'boxer', 'briefs', 'panties', 'bra']],
  ['👟', ['shoes', 'sneakers', 'boots', 'sandals', 'slippers']],
  ['🧣', ['scarf', 'hat', 'beanie', 'gloves', 'mittens']],
  // Specific multi-word phrases first (prevent "orange" matching before "orange juice", etc.)
  // Indian food — specific multi-word phrases
  ['🧈', ['ghee', 'clarified butter', 'desi ghee']],
  ['☕', ['masala chai', 'chai tea', 'kadak chai']],
  ['🥛', ['lassi', 'chaas', 'buttermilk lassi']],
  ['🍲', ['dal makhani', 'dal tadka', 'dal fry', 'matar dal', 'toor dal', 'moong dal', 'chana dal', 'urad dal', 'masoor dal']],
  ['🫘', ['chole', 'chana masala', 'rajma masala', 'pav bhaji', 'dal']],
  ['🍚', ['biryani', 'khichdi', 'pulao', 'jeera rice', 'dum biryani']],
  ['🫓', ['roti', 'chapati', 'chapatti', 'naan', 'paratha', 'puri', 'poori', 'kulcha', 'bhatura', 'phulka', 'lachha paratha']],
  ['🥟', ['samosa', 'modak', 'kachori', 'gujiya', 'pakora', 'pakoda', 'bhajia']],
  ['🥗', ['pani puri', 'pani poori', 'bhel puri', 'sev puri', 'dahi puri', 'chaat', 'aloo chaat', 'papdi chaat']],
  ['🍮', ['halwa', 'kheer', 'payasam', 'rasgulla', 'rasmalai', 'gulab jamun', 'jalebi', 'shrikhand', 'mishti doi']],
  ['🍡', ['ladoo', 'laddoo', 'barfi', 'barfee', 'mithai', 'peda', 'burfi', 'chakli', 'chikki']],
  ['🍗', ['tandoori', 'tikka', 'butter chicken', 'chicken tikka', 'murgh', 'seekh kebab', 'reshmi kebab']],
  ['🥘', ['paneer tikka', 'paneer butter masala', 'shahi paneer', 'palak paneer', 'matar paneer', 'kadai paneer', 'sabzi', 'sabji', 'bhindi', 'aloo gobi', 'aloo matar', 'baingan bharta', 'korma', 'vindaloo']],
  ['🍛', ['curry', 'masala', 'gravy', 'mughlai']],
  ['🫙', ['chutney', 'achar', 'pickle', 'murabba', 'papad', 'papadum', 'pappadam']],
  ['🧂', ['garam masala', 'chaat masala', 'kitchen king', 'sambhar masala', 'rasam powder', 'curry powder', 'turmeric', 'haldi', 'jeera', 'ajwain', 'hing', 'asafoetida', 'methi', 'fenugreek', 'amchur', 'mango powder']],
  ['🧀', ['paneer', 'cottage cheese']],
  ['🥬', ['palak', 'saag', 'methi leaves', 'curry leaves']],
  ['🥔', ['aloo', 'batata']],
  ['🥦', ['gobi', 'cauliflower']],
  ['🫛', ['edamame', 'matar', 'chana']],
  // Regular specific multi-word phrases
  ['🧃', ['orange juice', 'apple juice', 'fruit juice', 'tomato juice', 'grape juice', 'cranberry juice']],
  ['🍅', ['tomato sauce', 'pasta sauce', 'pizza sauce', 'tomato paste', 'marinara', 'arrabiata']],
  ['🌶️', ['hot sauce', 'sriracha', 'chili sauce', 'buffalo sauce']],
  ['🫘', ['soy sauce', 'fish sauce', 'oyster sauce', 'hoisin', 'teriyaki']],
  ['🍖', ['bbq sauce', 'bbq', 'worcestershire']],
  // Dairy
  ['🥛', ['milk', 'oat milk', 'almond milk', 'soy milk']],
  ['🧀', ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'brie', 'gouda']],
  ['🥚', ['egg', 'eggs']],
  ['🧈', ['butter']],
  ['🍦', ['ice cream']],
  ['🥣', ['yogurt', 'kefir']],
  ['🍶', ['cream', 'sour cream', 'cottage cheese', 'ricotta']],
  // Produce
  ['🍎', ['apple', 'gala', 'fuji']],
  ['🍌', ['banana']],
  ['🍊', ['orange']],
  ['🍇', ['grape', 'berry', 'berries', 'blueberr', 'raspberr']],
  ['🍓', ['strawberr']],
  ['🥭', ['mango']],
  ['🍍', ['pineapple']],
  ['🍉', ['watermelon']],
  ['🍑', ['peach']],
  ['🍐', ['pear']],
  ['🍒', ['cherry']],
  ['🍋', ['lemon', 'lime']],
  ['🥑', ['avocado']],
  ['🍅', ['tomato', 'cherry tomato']],
  ['🥬', ['spinach', 'kale', 'lettuce', 'arugula', 'cabbage', 'bok choy']],
  ['🥦', ['broccoli', 'cauliflower']],
  ['🥕', ['carrot']],
  ['🥒', ['cucumber', 'zucchini']],
  ['🫑', ['pepper', 'bell pepper']],
  ['🧅', ['onion', 'leek', 'shallot']],
  ['🧄', ['garlic']],
  ['🍄', ['mushroom']],
  ['🥔', ['potato']],
  ['🍠', ['sweet potato']],
  ['🫚', ['ginger']],
  ['🌽', ['corn']],
  ['🫛', ['pea', 'edamame']],
  ['🌿', ['basil', 'cilantro', 'parsley', 'herb', 'thyme', 'rosemary']],
  ['🥝', ['kiwi']],
  ['🫐', ['cranberr']],
  // Meat & Seafood
  ['🍗', ['chicken', 'breast', 'thigh', 'wing']],
  ['🥩', ['beef', 'steak', 'ground', 'brisket', 'roast', 'pork', 'lamb', 'tenderloin']],
  ['🥓', ['bacon', 'ham', 'prosciutto']],
  ['🌭', ['sausage', 'hot dog']],
  ['🍣', ['salmon', 'tuna', 'sushi', 'sashimi']],
  ['🍤', ['shrimp', 'prawn']],
  ['🐟', ['fillet', 'tilapia', 'cod', 'halibut', 'fish']],
  ['🦞', ['lobster', 'crab', 'scallop']],
  // Grains & Bread
  ['🍞', ['bread', 'sourdough', 'loaf', 'bun', 'roll', 'bagel', 'pita', 'rye']],
  ['🥐', ['croissant']],
  ['🥖', ['baguette']],
  ['🫓', ['wrap', 'tortilla']],
  ['🍚', ['rice']],
  ['🍝', ['pasta', 'penne', 'noodle', 'spaghetti', 'linguine']],
  ['🥞', ['waffle', 'pancake']],
  ['🌾', ['oat', 'flour', 'wheat', 'grain', 'barley', 'quinoa', 'couscous']],
  ['🥣', ['cereal', 'granola']],
  ['🍘', ['cracker', 'pretzel', 'rice cake']],
  // Sauces & Condiments
  ['🫒', ['olive oil', 'coconut oil', 'vegetable oil', 'oil']],
  ['🍯', ['honey', 'syrup', 'maple']],
  ['🍅', ['ketchup']],
  ['🌭', ['mustard']],
  ['🫙', ['mayo', 'mayonnaise', 'ranch', 'dressing', 'tahini', 'hummus', 'jam', 'jelly', 'pickle', 'relish', 'chutney', 'paste', 'jarred']],
  ['🌿', ['pesto', 'chimichurri']],
  ['🍋', ['vinegar', 'lemon juice']],
  ['🌶️', ['salsa', 'hot', 'chili']],
  ['🍲', ['broth', 'stock', 'soup', 'gravy']],
  // Snacks
  ['🍫', ['chocolate', 'cocoa']],
  ['🍬', ['candy', 'gummy']],
  ['🍪', ['cookie', 'brownie']],
  ['🍿', ['popcorn']],
  ['🥜', ['almond', 'cashew', 'walnut', 'peanut', 'pistachio', 'pecan', 'nut']],
  ['🧂', ['chip', 'crisp', 'pretzel']],
  ['🥗', ['trail mix', 'dried fruit', 'raisin']],
  ['🍫', ['protein bar', 'granola bar', 'energy bar']],
  // Beverages
  ['🍶', ['sake']],
  ['🧃', ['juice', 'orange juice', 'apple juice', 'fruit juice', 'tomato juice']],
  ['🍾', ['sparkling', 'champagne', 'prosecco']],
  ['🍵', ['tea', 'kombucha', 'matcha']],
  ['☕', ['coffee', 'espresso', 'latte']],
  ['🍺', ['beer', 'ale', 'lager']],
  ['🍷', ['wine', 'rosé']],
  ['🥛', ['milk', 'oat milk', 'almond milk', 'soy milk', 'coconut milk beverage']],
  ['🍶', ['water', 'sparkling water', 'mineral water']],
  ['🍶', ['soda', 'sports drink', 'energy drink', 'gatorade', 'powerade']],
  ['🍶', ['smoothie', 'lemonade', 'cider']],
  // Supplements
  ['💪', ['protein', 'whey', 'creatine', 'preworkout', 'pre-workout', 'bcaa']],
  ['🧴', ['collagen', 'supplement']],
  ['💊', ['vitamin', 'omega', 'fish oil', 'magnesium', 'zinc', 'probiotic', 'multivitamin', 'melatonin']],
  // Spices
  ['🧂', ['salt', 'pepper', 'spice', 'seasoning', 'cumin', 'paprika', 'turmeric', 'cinnamon', 'oregano', 'curry', 'nutmeg', 'vanilla']],
]

const CATEGORY_FALLBACK = {
  dairy: '🥛',
  produce: '🥦',
  'meat & seafood': '🥩',
  'grains & bread': '🍞',
  'sauces & condiments': '🍶',
  snacks: '🍿',
  'canned & jarred': '🫙',
  frozen: '🧊',
  'spices & seasonings': '🧂',
  other: '🛒',
  clothing: '👕',
  medicine: '💊',
  toiletries: '🧴',
  supplement: '💊',
  beverage: '🍶',
}

export function getItemEmoji(name = '', category = '', subcategory = '') {
  const lower = name.toLowerCase()
  for (const [emoji, keywords] of EMOJI_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return emoji
  }
  return CATEGORY_FALLBACK[subcategory] ?? CATEGORY_FALLBACK[category] ?? '🛒'
}

export function getEmojiImageUrl(emoji) {
  // Convert emoji to Noto Emoji CDN URL
  const codePoints = [...emoji]
    .map(c => c.codePointAt(0))
    .filter(cp => cp !== 0xFE0F) // strip variation selector
  const hex = codePoints.map(cp => cp.toString(16)).join('_')
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${hex}/emoji.svg`
}

export const LOCATION_TYPES = [
  'fridge',
  'freezer',
  'pantry',
  'cabinet',
  'counter',
  'other',
]

export const DEFAULT_LOCATIONS = [
  { name: 'Fridge', type: 'fridge' },
  { name: 'Freezer', type: 'freezer' },
  { name: 'Pantry', type: 'pantry' },
  { name: 'Cabinet', type: 'cabinet' },
]

export const CATEGORIES = [
  'food',
  'supplement',
  'beverage',
  'other',
]

export const OTHER_SUBCATEGORIES = [
  'clothing',
  'medicine',
  'toiletries',
  'other',
]

export const FOOD_SUBCATEGORIES = [
  'dairy',
  'produce',
  'meat & seafood',
  'grains & bread',
  'sauces & condiments',
  'snacks',
  'canned & jarred',
  'frozen',
  'spices & seasonings',
  'other',
]

export const UNITS = [
  'count',
  'dozen',
  'lbs',
  'oz',
  'g',
  'kg',
  'ml',
  'L',
  'gal',
  'cups',
  'tbsp',
  'tsp',
  'scoops',
  'servings',
  'bags',
  'boxes',
  'cans',
  'bottles',
  'jars',
  'packets',
]
