export default function Loading() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="cp-skeleton" style={{ aspectRatio: "1/1", width: "100%" }} />
      <div className="flex flex-col gap-4">
        <div className="cp-skeleton" style={{ height: 36, width: "70%" }} />
        <div className="cp-skeleton" style={{ height: 18, width: "40%" }} />
        <div className="cp-skeleton" style={{ height: 100, width: "100%" }} />
        <div className="grid grid-cols-4 gap-3">
          <div className="cp-skeleton" style={{ height: 80 }} />
          <div className="cp-skeleton" style={{ height: 80 }} />
          <div className="cp-skeleton" style={{ height: 80 }} />
          <div className="cp-skeleton" style={{ height: 80 }} />
        </div>
      </div>
    </div>
  );
}
