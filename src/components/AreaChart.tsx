import { createComponent } from '@liteforge/runtime';

interface AreaChartProps {
  data: () => number[][];
  colors: string[];
  labels: string[];
  yMax?: number;
  height?: number;
}

const W = 560;
const GRID_PCTS = [0, 25, 50, 75, 100];

function toAreaPath(values: number[], H: number, yMax: number): string {
  if (values.length < 2) return '';
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - (v / yMax) * H,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1]!;
  const first = pts[0]!;
  return `${line} L${last.x.toFixed(1)},${H} L${first.x.toFixed(1)},${H} Z`;
}

function toLinePath(values: number[], H: number, yMax: number): string {
  if (values.length < 2) return '';
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - (v / yMax) * H;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export const AreaChart = createComponent<AreaChartProps>({
  name: 'AreaChart',
  component({ props }) {
    const H = props.height ?? 120;
    const yMax = props.yMax ?? 100;

    return (
      <div style="width:100%">
        <svg
          viewBox={`0 0 ${W} ${H + 20}`}
          preserveAspectRatio="none"
          style={`width:100%;height:${H + 20}px;display:block`}
        >
          {GRID_PCTS.map(pct => {
            const y = H - (pct / 100) * H;
            return (
              <g>
                <line x1={0} y1={y} x2={W} y2={y} style="stroke:#1e1e1e;stroke-width:1" />
                <text x={4} y={y - 2} style="font-size:9px;fill:#444;font-family:monospace">
                  {`${Math.round((pct / 100) * yMax)}%`}
                </text>
              </g>
            );
          })}
          {props.colors.map((color, i) => (
            <g>
              <path
                style={`fill:${color};fill-opacity:0.12;stroke:none`}
                d={() => toAreaPath(props.data()[i] ?? [], H, yMax)}
              />
              <path
                style={`fill:none;stroke:${color};stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round`}
                d={() => toLinePath(props.data()[i] ?? [], H, yMax)}
              />
            </g>
          ))}
        </svg>
        <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:4px">
          {props.labels.map((label, i) => (
            <div style="display:flex;align-items:center;gap:6px">
              <span style={`display:inline-block;width:12px;height:8px;border-radius:2px;opacity:0.6;background:${props.colors[i] ?? '#00C49A'}`} />
              <span style="font-size:10px;font-family:monospace;color:#666">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
});
