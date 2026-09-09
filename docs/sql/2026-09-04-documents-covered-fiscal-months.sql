alter table documents
  add column if not exists covered_fiscal_months integer[];

update documents
set covered_fiscal_months = array[fiscal_period_month]
where covered_fiscal_months is null
  and fiscal_period_month is not null;

alter table documents
  drop constraint if exists documents_covered_fiscal_months_check,
  add constraint documents_covered_fiscal_months_check
    check (
      covered_fiscal_months is null
      or (
        cardinality(covered_fiscal_months) > 0
        and covered_fiscal_months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]
      )
    );
