type Props = { stock: number };

export function StockIndicator({ stock }: Props) {
  if (stock === 0) {
    return <span className="cp-badge cp-badge--red">SOLD OUT</span>;
  }
  if (stock === 1) {
    return <span className="cp-badge cp-badge--magenta">1/1 — LAST UNIT</span>;
  }
  if (stock <= 5) {
    return <span className="cp-badge cp-badge--yellow">LOW · {stock} LEFT</span>;
  }
  return <span className="cp-badge cp-badge--green">IN STOCK</span>;
}
