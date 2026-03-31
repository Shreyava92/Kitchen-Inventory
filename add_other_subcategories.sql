-- Expand subcategory constraint to include other subcategories
alter table items drop constraint if exists items_subcategory_check;

alter table items add constraint items_subcategory_check check (
  subcategory is null or subcategory in (
    -- food
    'dairy', 'produce', 'meat & seafood', 'grains & bread',
    'sauces & condiments', 'snacks', 'canned & jarred',
    'frozen', 'spices & seasonings',
    -- other
    'clothing', 'medicine', 'toiletries',
    -- shared
    'other'
  )
);
