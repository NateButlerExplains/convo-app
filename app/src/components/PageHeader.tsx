export function PageHeader({
  title,
  children,
  eyebrow: _eyebrow,
}: {
  title: string;
  children: React.ReactNode;
  /** @deprecated unused; kept optional for compatibility */
  eyebrow?: string;
}) {
  return (
    <section className="page-header">
      <h1>{title}</h1>
      <div className="page-header-body">{children}</div>
    </section>
  );
}
