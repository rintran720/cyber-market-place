type Props = {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  cta?: React.ReactNode;
  color?: "cyan" | "magenta" | "purple";
};

export function EmptyState({ icon = "∅", title, desc, cta, color = "purple" }: Props) {
  return (
    <div className={`cp-empty cp-empty--boxed cp-empty--${color}`} role="status">
      <div className="cp-empty__icon">{icon}</div>
      <h3 className="cp-empty__title">{title}</h3>
      {desc && <p className="cp-empty__desc">{desc}</p>}
      {cta && <div className="cp-empty__action">{cta}</div>}
    </div>
  );
}
