export function ItemCardSkeleton() {
  return (
    <div className="cp-card cp-card--cut" aria-hidden="true">
      <div className="cp-skeleton" style={{ height: 200, width: "100%" }} />
      <div className="cp-card__body">
        <div className="cp-skeleton" style={{ height: 18, width: "70%", marginBottom: 8 }} />
        <div className="cp-skeleton" style={{ height: 14, width: "40%" }} />
      </div>
    </div>
  );
}

export function ItemGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="cp-grid cp-grid--auto" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
