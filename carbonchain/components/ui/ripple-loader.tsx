export function RippleLoader({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="ripple-loader">
        <div className="cell d-0" />
        <div className="cell d-1" />
        <div className="cell d-2" />
        <div className="cell d-1" />
        <div className="cell d-2" />
        <div className="cell d-2" />
        <div className="cell d-3" />
        <div className="cell d-3" />
        <div className="cell d-4" />
      </div>
    </div>
  );
}
