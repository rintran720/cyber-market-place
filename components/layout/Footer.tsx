export function Footer() {
  return (
    <footer className="border-t border-cp-border mt-16 py-6">
      <div className="cp-container flex items-center justify-between text-xs text-cp-fg-muted">
        <span>© 2185 NeonMarket · Licensed by VOTEK</span>
        <span className="cp-status cp-status--online cp-status--pill">
          <span className="cp-status__dot" />
          <span className="cp-status__label">ONLINE</span>
        </span>
      </div>
    </footer>
  );
}
