export function RippleLoader({ className, cellSize = 8 }: { className?: string; cellSize?: number }) {
  return (
    <div className={className} style={{ ["--cell-size" as string]: `${cellSize}px` }}>
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
