import { createComponent } from 'liteforge';
import { effect } from '@liteforge/core';

interface LineChartProps {
  data: () => number[][];
  colors: string[];
  labels: string[];
  yMax?: number;
  height?: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 560;
const GRID_PCTS = [0, 25, 50, 75, 100];

function makeSvgEl<T extends SVGElement>(tag: string, attrs: Record<string, string | number>): T {
  const el = document.createElementNS(SVG_NS, tag) as T;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export const LineChart = createComponent<LineChartProps>({
  name: 'LineChart',
  component({ props }) {
    const H = props.height ?? 120;
    const yMax = props.yMax ?? 100;

    // --- SVG ---
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H + 20}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.width = '100%';
    svg.style.height = `${H + 20}px`;
    svg.style.display = 'block';

    // Grid lines
    for (const pct of GRID_PCTS) {
      const y = H - (pct / 100) * H;
      const g = document.createElementNS(SVG_NS, 'g');
      g.appendChild(makeSvgEl('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#1e1e1e', 'stroke-width': 1 }));
      const txt = makeSvgEl<SVGTextElement>('text', { x: 4, y: y - 2, 'font-size': 9, fill: '#444', 'font-family': 'monospace' });
      txt.textContent = String(Math.round((pct / 100) * yMax));
      g.appendChild(txt);
      svg.appendChild(g);
    }

    // Polylines (reactive)
    const polylines: SVGPolylineElement[] = props.colors.map((color) => {
      const poly = makeSvgEl<SVGPolylineElement>('polyline', {
        fill: 'none', stroke: color, 'stroke-width': 1.5,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round', points: '',
      });
      svg.appendChild(poly);
      return poly;
    });

    effect(() => {
      const series = props.data();
      series.forEach((values, i) => {
        const poly = polylines[i];
        if (!poly || values.length < 2) return;
        const pts = values.map((v, idx) => {
          const x = (idx / (values.length - 1)) * W;
          const y = H - (v / yMax) * H;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        poly.setAttribute('points', pts);
      });
    });

    // --- Legend ---
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.gap = '16px';
    legend.style.marginTop = '4px';

    props.labels.forEach((label, i) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '6px';

      const swatch = document.createElement('span');
      swatch.style.display = 'inline-block';
      swatch.style.width = '12px';
      swatch.style.height = '2px';
      swatch.style.borderRadius = '1px';
      swatch.style.background = props.colors[i] ?? '#00C49A';

      const lbl = document.createElement('span');
      lbl.style.fontSize = '10px';
      lbl.style.fontFamily = 'monospace';
      lbl.style.color = '#666';
      lbl.textContent = label;

      item.appendChild(swatch);
      item.appendChild(lbl);
      legend.appendChild(item);
    });

    // --- Wrapper ---
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.appendChild(svg);
    wrapper.appendChild(legend);
    return wrapper;
  },
});
