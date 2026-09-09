alter table payment_rules
  drop constraint if exists payment_rules_interval_months_check,
  add constraint payment_rules_interval_months_check
    check (interval_months is null or interval_months in (1, 2, 3, 4, 6, 12));

alter table payment_rules
  drop constraint if exists payment_rules_anchor_period_month_check,
  add constraint payment_rules_anchor_period_month_check
    check (anchor_period_month is null or anchor_period_month between 1 and 12);

alter table payment_rules
  drop constraint if exists payment_rules_custom_period_months_check,
  add constraint payment_rules_custom_period_months_check
    check (
      custom_period_months is null
      or (
        cardinality(custom_period_months) > 0
        and custom_period_months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]
      )
    );

alter table payment_rules
  drop constraint if exists payment_rules_payment_month_check,
  add constraint payment_rules_payment_month_check
    check (payment_month is null or payment_month between 1 and 12);

alter table payment_rules
  drop constraint if exists payment_rules_payment_day_check,
  add constraint payment_rules_payment_day_check
    check (payment_day is null or payment_day between 1 and 31);

alter table payment_rules
  drop constraint if exists payment_rules_non_negative_offsets_check,
  add constraint payment_rules_non_negative_offsets_check
    check (
      payment_year_offset >= 0
      and payment_month_offset >= 0
      and grace_days >= 0
      and reminder_days_before >= 0
    );
