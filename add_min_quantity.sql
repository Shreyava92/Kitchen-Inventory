alter table items add column if not exists min_quantity numeric;
alter table items drop column if exists low_stock_flag;
