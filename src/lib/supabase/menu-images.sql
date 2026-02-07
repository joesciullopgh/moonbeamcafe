-- Run this in Supabase SQL Editor to add product photos to all menu items
-- Uses free Unsplash images (no attribution required)

-- Espresso Drinks
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&h=800&fit=crop' WHERE name = 'Espresso (Single)';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1485808191679-5f86510681a1?w=800&h=800&fit=crop' WHERE name = 'Espresso (Double)';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=800&h=800&fit=crop' WHERE name = 'Americano';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=800&fit=crop' WHERE name = 'Cappuccino';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&h=800&fit=crop' WHERE name = 'Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&h=800&fit=crop' WHERE name = 'Mocha';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1485808191679-5f86510681a1?w=800&h=800&fit=crop' WHERE name = 'Vanilla Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&h=800&fit=crop' WHERE name = 'Caramel Macchiato';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&h=800&fit=crop' WHERE name = 'Flat White';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1514066558159-fc8c737ef259?w=800&h=800&fit=crop' WHERE name = 'Cortado';

-- Brewed Coffee & Tea
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=800&fit=crop' WHERE name = 'Drip Coffee (Regular)';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=800&fit=crop' WHERE name = 'Drip Coffee (Large)';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop' WHERE name = 'Cold Brew';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop' WHERE name = 'Pour Over';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=800&fit=crop' WHERE name = 'Hot Tea';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=800&h=800&fit=crop' WHERE name = 'Chai Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&h=800&fit=crop' WHERE name = 'Matcha Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&h=800&fit=crop' WHERE name = 'London Fog';

-- Specialty Drinks
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&h=800&fit=crop' WHERE name = 'Moonbeam Signature Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=800&fit=crop' WHERE name = 'Honey Cinnamon Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1534687941688-651ccaafbff8?w=800&h=800&fit=crop' WHERE name = 'Brown Sugar Oat Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?w=800&h=800&fit=crop' WHERE name = 'Maple Pecan Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=800&fit=crop' WHERE name = 'Rose Cardamom Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&h=800&fit=crop' WHERE name = 'Lavender Mocha';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop' WHERE name = 'Seasonal Special';

-- Iced Drinks
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&h=800&fit=crop' WHERE name = 'Iced Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=800&h=800&fit=crop' WHERE name = 'Iced Vanilla Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=800&h=800&fit=crop' WHERE name = 'Iced Caramel Latte';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&h=800&fit=crop' WHERE name = 'Iced Mocha';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=800&h=800&fit=crop' WHERE name = 'Iced Chai';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&h=800&fit=crop' WHERE name = 'Iced Matcha';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop' WHERE name = 'Iced Cold Brew';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop' WHERE name = 'Nitro Cold Brew';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&h=800&fit=crop' WHERE name = 'Iced Moonbeam Latte';

-- Food - Breakfast
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&h=800&fit=crop' WHERE name = 'Avocado Toast';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=800&h=800&fit=crop' WHERE name = 'Breakfast Sandwich';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=800&fit=crop' WHERE name = 'Veggie Breakfast Wrap';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800&h=800&fit=crop' WHERE name = 'Overnight Oats';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=800&fit=crop' WHERE name = 'Yogurt Parfait';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1585445490387-f47934b73b54?w=800&h=800&fit=crop' WHERE name = 'Bagel with Cream Cheese';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1585445490387-f47934b73b54?w=800&h=800&fit=crop' WHERE name = 'Bagel with Lox';

-- Food - Pastries
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=800&h=800&fit=crop' WHERE name = 'Butter Croissant';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=800&h=800&fit=crop' WHERE name = 'Chocolate Croissant';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1509365390695-33aee754301f?w=800&h=800&fit=crop' WHERE name = 'Almond Croissant';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&h=800&fit=crop' WHERE name = 'Blueberry Muffin';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&h=800&fit=crop' WHERE name = 'Banana Nut Muffin';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=800&h=800&fit=crop' WHERE name = 'Cinnamon Roll';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1558303276-dc0f7e93b8c0?w=800&h=800&fit=crop' WHERE name = 'Scone of the Day';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=800&fit=crop' WHERE name = 'Brownie';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&h=800&fit=crop' WHERE name = 'Cookie';

-- Food - Lunch
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop' WHERE name = 'Turkey & Brie Sandwich';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop' WHERE name = 'Caprese Sandwich';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop' WHERE name = 'Chicken Pesto Panini';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop' WHERE name = 'Grilled Cheese';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=800&fit=crop' WHERE name = 'Soup of the Day (Cup)';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=800&fit=crop' WHERE name = 'Soup of the Day (Bowl)';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop' WHERE name = 'Garden Salad';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&h=800&fit=crop' WHERE name = 'Caesar Salad';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&h=800&fit=crop' WHERE name = 'Add Chicken to Salad';

-- Kids Menu
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&h=800&fit=crop' WHERE name = 'Kids Hot Chocolate';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&h=800&fit=crop' WHERE name = 'Kids Steamer';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1553909489-ec2175ef3f52?w=800&h=800&fit=crop' WHERE name = 'PB&J';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop' WHERE name = 'Grilled Cheese Kids';
UPDATE menu_items SET image_url = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=800&fit=crop' WHERE name = 'Kids Yogurt Cup';
