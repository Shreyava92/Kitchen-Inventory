const RULES = [
  ['other', 'clothing', 'count', ['boxer briefs', 'boxer brief', 'underwear briefs', 't-shirt', 'athletic socks', 'jogger pants', 'sweat pants', 'tank top']],
  ['beverage', '', 'bottles', ['orange juice', 'apple juice', 'tomato juice', 'fruit juice', 'sparkling water', 'coconut water', 'almond milk', 'oat milk', 'soy milk', 'sports drink', 'energy drink']],
  ['food', 'sauces & condiments', 'bottles', ['olive oil', 'vegetable oil', 'coconut oil', 'tomato sauce', 'tomato paste', 'soy sauce', 'hot sauce', 'fish sauce', 'oyster sauce', 'bbq sauce', 'pasta sauce', 'pizza sauce', 'diced tomato']],
  ['food', 'snacks', 'count', ['granola bar', 'granola bars', 'protein bar', 'energy bar', 'cereal bar']],
  ['food', 'dairy', 'count', ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'cheddar', 'mozzarella', 'parmesan', 'brie', 'gouda', 'kefir', 'sour cream', 'cottage cheese', 'ricotta']],
  ['food', 'produce', 'count', ['apple', 'banana', 'orange', 'grape', 'berry', 'berries', 'strawberr', 'blueberr', 'raspberr', 'mango', 'pineapple', 'watermelon', 'melon', 'peach', 'pear', 'plum', 'cherry', 'lemon', 'lime', 'avocado', 'tomato', 'spinach', 'kale', 'lettuce', 'broccoli', 'cauliflower', 'carrot', 'celery', 'cucumber', 'zucchini', 'pepper', 'onion', 'garlic', 'mushroom', 'potato', 'sweet potato', 'ginger', 'basil', 'cilantro', 'parsley', 'arugula', 'asparagus', 'beet', 'cabbage', 'eggplant', 'leek', 'pea', 'corn']],
  ['food', 'meat & seafood', 'lbs', ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'steak', 'ground', 'sausage', 'bacon', 'ham', 'salami', 'pepperoni', 'salmon', 'tuna', 'shrimp', 'tilapia', 'cod', 'halibut', 'lobster', 'crab', 'scallop', 'fillet', 'breast', 'thigh', 'wing', 'rib', 'brisket', 'roast', 'tenderloin']],
  ['food', 'grains & bread', 'count', ['bread', 'rice', 'pasta', 'noodle', 'oat', 'cereal', 'flour', 'tortilla', 'wrap', 'bagel', 'muffin', 'croissant', 'roll', 'bun', 'loaf', 'sourdough', 'rye', 'wheat', 'quinoa', 'barley', 'couscous', 'granola', 'cracker', 'pretzel', 'pita']],
  ['food', 'sauces & condiments', 'count', ['sauce', 'ketchup', 'mustard', 'mayo', 'mayonnaise', 'dressing', 'vinegar', 'salsa', 'hummus', 'pesto', 'jam', 'jelly', 'honey', 'syrup', 'maple', 'oil', 'marinade', 'glaze', 'gravy', 'broth', 'stock', 'relish', 'chutney', 'tahini', 'ranch']],
  ['food', 'snacks', 'count', ['chip', 'crisp', 'popcorn', 'almond', 'cashew', 'walnut', 'peanut', 'pistachio', 'pecan', 'trail mix', 'snack', 'candy', 'chocolate', 'cookie', 'brownie', 'rice cake', 'dried fruit', 'raisin']],
  ['food', 'canned & jarred', 'cans', ['canned', 'beans', 'lentil', 'chickpea', 'soup', 'sardine', 'coconut milk', 'olives', 'pickles', 'pumpkin', 'artichoke']],
  ['food', 'frozen', 'count', ['frozen', 'ice cream', 'popsicle', 'pizza', 'burrito', 'edamame', 'waffles', 'fries']],
  ['food', 'spices & seasonings', 'count', ['spice', 'salt', 'pepper', 'cumin', 'paprika', 'turmeric', 'cinnamon', 'oregano', 'thyme', 'rosemary', 'bay leaf', 'chili powder', 'garlic powder', 'onion powder', 'seasoning', 'herb', 'curry', 'nutmeg', 'cardamom', 'clove', 'allspice', 'vanilla extract', 'baking soda', 'baking powder', 'yeast']],
  ['supplement', '', 'scoops', ['protein', 'whey', 'creatine', 'preworkout', 'pre-workout', 'bcaa', 'collagen', 'vitamin', 'supplement', 'omega', 'fish oil', 'magnesium', 'zinc', 'probiotic', 'multivitamin', 'melatonin']],
  ['beverage', '', 'bottles', ['juice', 'water', 'sparkling', 'soda', 'coffee', 'tea', 'kombucha', 'lemonade', 'smoothie', 'gatorade', 'powerade']],
  ['other', 'clothing', 'count', ['shirt', 't-shirt', 'tshirt', 'blouse', 'top', 'tank', 'pants', 'jeans', 'shorts', 'jogger', 'legging', 'dress', 'skirt', 'jacket', 'coat', 'hoodie', 'sweater', 'sweatshirt', 'cardigan', 'socks', 'sock', 'underwear', 'boxer', 'briefs', 'bra', 'shoes', 'sneakers', 'boots', 'sandals', 'hat', 'beanie', 'scarf', 'gloves', 'belt', 'pajama']],
  ['other', 'medicine', 'count', ['ibuprofen', 'tylenol', 'aspirin', 'acetaminophen', 'allergy', 'antacid', 'cough', 'cold medicine', 'antibiotic', 'band-aid', 'bandage', 'gauze', 'antiseptic', 'neosporin', 'thermometer', 'nasal', 'laxative', 'pepto', 'tums', 'advil', 'nyquil', 'dayquil', 'zyrtec', 'claritin']],
  ['other', 'toiletries', 'count', ['shampoo', 'conditioner', 'body wash', 'lotion', 'moisturizer', 'face wash', 'cleanser', 'toner', 'serum', 'sunscreen', 'toothpaste', 'toothbrush', 'mouthwash', 'floss', 'soap', 'hand wash', 'sanitizer', 'razor', 'shaving', 'deodorant', 'antiperspirant', 'perfume', 'cologne', 'toilet paper', 'paper towel', 'tissue', 'tampon', 'pad', 'nail polish', 'makeup', 'mascara', 'foundation', 'lipstick']],
]

export function autoFill(name) {
  const lower = name.toLowerCase()
  for (const [category, subcategory, unit, keywords] of RULES) {
    if (keywords.some(k => lower.includes(k))) {
      return { category, subcategory: subcategory || null, unit }
    }
  }
  return { category: 'food', subcategory: 'other', unit: 'count' }
}
