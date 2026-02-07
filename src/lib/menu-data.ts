export interface MenuItemData {
  name: string
  description: string
  price: number
  category: string
  customizable: boolean
}

export const MENU_CATEGORIES = [
  'Espresso Drinks',
  'Brewed Coffee & Tea',
  'Specialty Drinks',
  'Iced Drinks',
  'Food - Breakfast',
  'Food - Pastries',
  'Food - Lunch',
  'Kids Menu',
] as const

export const MENU_ITEMS: MenuItemData[] = [
  // Espresso Drinks
  { name: 'Espresso (Single)', description: 'A bold, rich shot of our signature espresso', price: 2.50, category: 'Espresso Drinks', customizable: true },
  { name: 'Espresso (Double)', description: 'Two shots of our smooth, full-bodied espresso', price: 3.50, category: 'Espresso Drinks', customizable: true },
  { name: 'Americano', description: 'Espresso with hot water for a smooth, rich flavor', price: 3.75, category: 'Espresso Drinks', customizable: true },
  { name: 'Cappuccino', description: 'Espresso with steamed milk and a deep layer of foam', price: 4.50, category: 'Espresso Drinks', customizable: true },
  { name: 'Latte', description: 'Espresso with steamed milk and a light layer of foam', price: 4.75, category: 'Espresso Drinks', customizable: true },
  { name: 'Mocha', description: 'Espresso, chocolate, steamed milk, and whipped cream', price: 5.25, category: 'Espresso Drinks', customizable: true },
  { name: 'Vanilla Latte', description: 'Espresso with vanilla syrup and steamed milk', price: 5.25, category: 'Espresso Drinks', customizable: true },
  { name: 'Caramel Macchiato', description: 'Vanilla, steamed milk, espresso, and caramel drizzle', price: 5.50, category: 'Espresso Drinks', customizable: true },
  { name: 'Flat White', description: 'Ristretto shots with steamed whole milk', price: 4.75, category: 'Espresso Drinks', customizable: true },
  { name: 'Cortado', description: 'Equal parts espresso and warm silky milk', price: 4.00, category: 'Espresso Drinks', customizable: true },

  // Brewed Coffee & Tea
  { name: 'Drip Coffee (Regular)', description: 'Freshly brewed house blend', price: 2.50, category: 'Brewed Coffee & Tea', customizable: true },
  { name: 'Drip Coffee (Large)', description: 'Freshly brewed house blend', price: 3.25, category: 'Brewed Coffee & Tea', customizable: true },
  { name: 'Cold Brew', description: 'Slow-steeped for 20 hours, smooth and bold', price: 4.25, category: 'Brewed Coffee & Tea', customizable: true },
  { name: 'Pour Over', description: "Hand-crafted single cup, ask about today's selection", price: 4.50, category: 'Brewed Coffee & Tea', customizable: true },
  { name: 'Hot Tea', description: 'Selection of black, green, and herbal teas', price: 2.75, category: 'Brewed Coffee & Tea', customizable: true },
  { name: 'Chai Latte', description: 'Spiced chai concentrate with steamed milk', price: 4.75, category: 'Brewed Coffee & Tea', customizable: true },
  { name: 'Matcha Latte', description: 'Ceremonial grade matcha with steamed milk', price: 5.25, category: 'Brewed Coffee & Tea', customizable: true },
  { name: 'London Fog', description: 'Earl Grey tea with vanilla and steamed milk', price: 4.75, category: 'Brewed Coffee & Tea', customizable: true },

  // Specialty Drinks
  { name: 'Moonbeam Signature Latte', description: 'Lavender, vanilla, espresso, and oat milk', price: 5.75, category: 'Specialty Drinks', customizable: true },
  { name: 'Honey Cinnamon Latte', description: 'Local honey, cinnamon, espresso, and steamed milk', price: 5.50, category: 'Specialty Drinks', customizable: true },
  { name: 'Brown Sugar Oat Latte', description: 'Brown sugar syrup, espresso, and oat milk', price: 5.50, category: 'Specialty Drinks', customizable: true },
  { name: 'Maple Pecan Latte', description: 'Maple syrup, pecan flavor, espresso, and cream', price: 5.75, category: 'Specialty Drinks', customizable: true },
  { name: 'Rose Cardamom Latte', description: 'Rose water, cardamom, espresso, and steamed milk', price: 5.75, category: 'Specialty Drinks', customizable: true },
  { name: 'Lavender Mocha', description: 'Lavender syrup, chocolate, espresso, and steamed milk', price: 5.75, category: 'Specialty Drinks', customizable: true },
  { name: 'Seasonal Special', description: 'Ask your barista about our rotating seasonal creation', price: 5.50, category: 'Specialty Drinks', customizable: true },

  // Iced Drinks
  { name: 'Iced Latte', description: 'Espresso and cold milk over ice', price: 5.00, category: 'Iced Drinks', customizable: true },
  { name: 'Iced Vanilla Latte', description: 'Vanilla, espresso, and cold milk over ice', price: 5.50, category: 'Iced Drinks', customizable: true },
  { name: 'Iced Caramel Latte', description: 'Caramel, espresso, and cold milk over ice', price: 5.50, category: 'Iced Drinks', customizable: true },
  { name: 'Iced Mocha', description: 'Chocolate, espresso, milk, and whipped cream over ice', price: 5.50, category: 'Iced Drinks', customizable: true },
  { name: 'Iced Chai', description: 'Spiced chai and cold milk over ice', price: 5.00, category: 'Iced Drinks', customizable: true },
  { name: 'Iced Matcha', description: 'Matcha and cold milk over ice', price: 5.50, category: 'Iced Drinks', customizable: true },
  { name: 'Iced Cold Brew', description: '20-hour steeped cold brew over ice', price: 4.25, category: 'Iced Drinks', customizable: true },
  { name: 'Nitro Cold Brew', description: 'Cold brew infused with nitrogen for a creamy finish', price: 5.25, category: 'Iced Drinks', customizable: true },
  { name: 'Iced Moonbeam Latte', description: 'Our signature lavender vanilla latte over ice', price: 6.00, category: 'Iced Drinks', customizable: true },

  // Food - Breakfast
  { name: 'Avocado Toast', description: 'Sourdough, smashed avocado, everything seasoning, microgreens', price: 8.50, category: 'Food - Breakfast', customizable: false },
  { name: 'Breakfast Sandwich', description: 'Egg, cheese, choice of bacon or sausage on brioche', price: 7.50, category: 'Food - Breakfast', customizable: false },
  { name: 'Veggie Breakfast Wrap', description: 'Scrambled eggs, peppers, onions, spinach, cheese', price: 7.50, category: 'Food - Breakfast', customizable: false },
  { name: 'Overnight Oats', description: 'Oats, almond milk, chia seeds, fresh berries, honey', price: 5.50, category: 'Food - Breakfast', customizable: false },
  { name: 'Yogurt Parfait', description: 'Greek yogurt, house granola, seasonal fruit, honey', price: 5.50, category: 'Food - Breakfast', customizable: false },
  { name: 'Bagel with Cream Cheese', description: 'Choice of plain, everything, or blueberry', price: 3.50, category: 'Food - Breakfast', customizable: false },
  { name: 'Bagel with Lox', description: 'Everything bagel, cream cheese, smoked salmon, capers, onion', price: 9.50, category: 'Food - Breakfast', customizable: false },

  // Food - Pastries
  { name: 'Butter Croissant', description: 'Flaky, buttery, baked fresh daily', price: 3.75, category: 'Food - Pastries', customizable: false },
  { name: 'Chocolate Croissant', description: 'Butter croissant filled with dark chocolate', price: 4.25, category: 'Food - Pastries', customizable: false },
  { name: 'Almond Croissant', description: 'Croissant with almond cream and sliced almonds', price: 4.50, category: 'Food - Pastries', customizable: false },
  { name: 'Blueberry Muffin', description: 'Loaded with fresh blueberries', price: 3.50, category: 'Food - Pastries', customizable: false },
  { name: 'Banana Nut Muffin', description: 'Made with ripe bananas and walnuts', price: 3.50, category: 'Food - Pastries', customizable: false },
  { name: 'Cinnamon Roll', description: 'Warm, gooey, with cream cheese frosting', price: 4.50, category: 'Food - Pastries', customizable: false },
  { name: 'Scone of the Day', description: "Ask about today's flavor", price: 3.75, category: 'Food - Pastries', customizable: false },
  { name: 'Brownie', description: 'Rich, fudgy, made with dark chocolate', price: 3.50, category: 'Food - Pastries', customizable: false },
  { name: 'Cookie', description: 'Chocolate chip, oatmeal raisin, or snickerdoodle', price: 2.50, category: 'Food - Pastries', customizable: false },

  // Food - Lunch
  { name: 'Turkey & Brie Sandwich', description: 'Sliced turkey, brie, arugula, fig jam on ciabatta', price: 10.50, category: 'Food - Lunch', customizable: false },
  { name: 'Caprese Sandwich', description: 'Fresh mozzarella, tomato, basil, balsamic on focaccia', price: 9.50, category: 'Food - Lunch', customizable: false },
  { name: 'Chicken Pesto Panini', description: 'Grilled chicken, pesto, mozzarella, roasted peppers', price: 10.50, category: 'Food - Lunch', customizable: false },
  { name: 'Grilled Cheese', description: 'Three cheese blend on sourdough, served with tomato soup', price: 7.50, category: 'Food - Lunch', customizable: false },
  { name: 'Soup of the Day (Cup)', description: "Ask about today's selection", price: 4.50, category: 'Food - Lunch', customizable: false },
  { name: 'Soup of the Day (Bowl)', description: "Ask about today's selection", price: 6.50, category: 'Food - Lunch', customizable: false },
  { name: 'Garden Salad', description: 'Mixed greens, cucumber, tomato, carrot, house vinaigrette', price: 8.50, category: 'Food - Lunch', customizable: false },
  { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, house-made caesar dressing', price: 9.00, category: 'Food - Lunch', customizable: false },
  { name: 'Add Chicken to Salad', description: 'Grilled chicken breast', price: 3.00, category: 'Food - Lunch', customizable: false },

  // Kids Menu
  { name: 'Kids Hot Chocolate', description: 'Steamed milk with chocolate, not too hot', price: 2.50, category: 'Kids Menu', customizable: false },
  { name: 'Kids Steamer', description: 'Steamed milk with choice of vanilla or caramel', price: 2.50, category: 'Kids Menu', customizable: false },
  { name: 'PB&J', description: 'Classic peanut butter and jelly on white bread', price: 4.50, category: 'Kids Menu', customizable: false },
  { name: 'Grilled Cheese Kids', description: 'American cheese on white bread with fruit', price: 5.00, category: 'Kids Menu', customizable: false },
  { name: 'Kids Yogurt Cup', description: 'Vanilla yogurt with granola and berries', price: 3.00, category: 'Kids Menu', customizable: false },
]

export const CUSTOMIZATION_OPTIONS = {
  size: [
    { name: 'Small', price_modifier: 0 },
    { name: 'Medium', price_modifier: 0.50 },
    { name: 'Large', price_modifier: 1.00 },
  ],
  milk: [
    { name: 'Whole', price_modifier: 0 },
    { name: '2%', price_modifier: 0 },
    { name: 'Skim', price_modifier: 0 },
    { name: 'Oat', price_modifier: 0.70 },
    { name: 'Almond', price_modifier: 0.70 },
    { name: 'Soy', price_modifier: 0.70 },
  ],
  shots: [
    { name: '1 Shot', price_modifier: 0 },
    { name: '2 Shots', price_modifier: 0.75 },
    { name: '3 Shots', price_modifier: 1.50 },
    { name: '4 Shots', price_modifier: 2.25 },
  ],
  sweetness: [
    { name: 'None', price_modifier: 0 },
    { name: 'Light', price_modifier: 0 },
    { name: 'Regular', price_modifier: 0 },
    { name: 'Extra', price_modifier: 0 },
  ],
  temperature: [
    { name: 'Hot', price_modifier: 0 },
    { name: 'Iced', price_modifier: 0 },
    { name: 'Blended', price_modifier: 0.50 },
  ],
  extras: [
    { name: 'Whipped Cream', price_modifier: 0.50 },
    { name: 'Vanilla', price_modifier: 0.50 },
    { name: 'Caramel', price_modifier: 0.50 },
    { name: 'Hazelnut', price_modifier: 0.50 },
    { name: 'Mocha', price_modifier: 0.50 },
  ],
} as const
