create table if not exists compliance_issue_resolutions (
  id bigserial primary key,
  issue_type text not null,
  category_node_id bigint not null references category_nodes(id),
  fiscal_period_year smallint not null,
  fiscal_period_month smallint,
  fiscal_period_kind text not null,
  payment_rule_id bigint references payment_rules(id),
  duplicate_document_ids bigint[],
  fingerprint text not null,
  resolution_kind text not null default 'acknowledged',
  note text,
  resolved_by_user_id bigint references users(id),
  resolved_at timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint compliance_issue_resolutions_issue_type_check
    check (issue_type in ('missing', 'duplicate')),
  constraint compliance_issue_resolutions_fiscal_period_kind_check
    check (fiscal_period_kind in ('month', 'year', 'unknown')),
  constraint compliance_issue_resolutions_resolution_kind_check
    check (resolution_kind in ('acknowledged', 'waived', 'compensated_next_period')),
  constraint compliance_issue_resolutions_month_check
    check (fiscal_period_month is null or fiscal_period_month between 1 and 12),
  constraint compliance_issue_resolutions_missing_documents_check
    check (issue_type <> 'missing' or duplicate_document_ids is null),
  constraint compliance_issue_resolutions_duplicate_documents_check
    check (issue_type <> 'duplicate' or coalesce(cardinality(duplicate_document_ids), 0) >= 2)
);

create unique index if not exists ux_compliance_issue_resolutions_active_fingerprint
  on compliance_issue_resolutions (fingerprint)
  where active = true;

create index if not exists idx_compliance_issue_resolutions_lookup
  on compliance_issue_resolutions (
    active,
    issue_type,
    category_node_id,
    fiscal_period_year,
    fiscal_period_month,
    fiscal_period_kind
  );

create index if not exists idx_compliance_issue_resolutions_rule
  on compliance_issue_resolutions (payment_rule_id)
  where payment_rule_id is not null;
