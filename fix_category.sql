alter table items drop constraint if exists items_category_check;
alter table items add constraint items_category_check
  check (category in ('food','supplement','beverage','other'));
