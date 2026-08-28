import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Card({ title, children, actions }: CardProps) {
  return (
    <section className="panel">
      {title || actions ? (
        <div className="panel-header">
          {title ? <h2>{title}</h2> : <span />}
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="panel-body">{children}</div>
    </section>
  );
}
