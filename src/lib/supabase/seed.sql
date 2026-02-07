-- Run this AFTER database.sql to seed the customization options
-- Menu items can be seeded from the Admin panel using the "Seed Default Menu" button

-- Customization Options: Size
INSERT INTO public.customization_options (name, type, price_modifier) VALUES
  ('Small', 'size', 0),
  ('Medium', 'size', 0.50),
  ('Large', 'size', 1.00);

-- Customization Options: Milk
INSERT INTO public.customization_options (name, type, price_modifier) VALUES
  ('Whole', 'milk', 0),
  ('2%', 'milk', 0),
  ('Skim', 'milk', 0),
  ('Oat', 'milk', 0.70),
  ('Almond', 'milk', 0.70),
  ('Soy', 'milk', 0.70);

-- Customization Options: Shots
INSERT INTO public.customization_options (name, type, price_modifier) VALUES
  ('1 Shot', 'shots', 0),
  ('2 Shots', 'shots', 0.75),
  ('3 Shots', 'shots', 1.50),
  ('4 Shots', 'shots', 2.25);

-- Customization Options: Sweetness
INSERT INTO public.customization_options (name, type, price_modifier) VALUES
  ('None', 'sweetness', 0),
  ('Light', 'sweetness', 0),
  ('Regular', 'sweetness', 0),
  ('Extra', 'sweetness', 0);

-- Customization Options: Temperature
INSERT INTO public.customization_options (name, type, price_modifier) VALUES
  ('Hot', 'temperature', 0),
  ('Iced', 'temperature', 0),
  ('Blended', 'temperature', 0.50);

-- Customization Options: Extras
INSERT INTO public.customization_options (name, type, price_modifier) VALUES
  ('Whipped Cream', 'extras', 0.50),
  ('Vanilla', 'extras', 0.50),
  ('Caramel', 'extras', 0.50),
  ('Hazelnut', 'extras', 0.50),
  ('Mocha', 'extras', 0.50);
