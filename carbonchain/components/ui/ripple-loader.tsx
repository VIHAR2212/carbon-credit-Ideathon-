export function RippleLoader({
  className,
  cellSize = 8,
  cellSpacing = 1,
}: {
  className?: string;
  cellSize?: number;
  cellSpacing?: number;
}) {
  return (
    <div
      className={className}
      style={{
        ["--cell-size" as string]: `${cellSize}px`,
        ["--cell-spacing" as string]: `${cellSpacing}px`,
      }}
    >
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
