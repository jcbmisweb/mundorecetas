import React from 'react';
import { ProSensoryRadar } from '../types';

interface ProSensoryRadarChartProps {
  radar: ProSensoryRadar;
  size?: number;
  interactive?: boolean;
  onChange?: (updated: ProSensoryRadar) => void;
  className?: string;
}

const AXES: { key: keyof ProSensoryRadar; label: string }[] = [
  { key: 'complexity', label: 'Complejidad' },
  { key: 'acidity', label: 'Acidez' },
  { key: 'sweetness', label: 'Dulzor' },
  { key: 'bitterness', label: 'Amargor' },
  { key: 'salinity', label: 'Salinidad' },
  { key: 'umami', label: 'Umami' },
  { key: 'fatBalance', label: 'Grasa/Cuerpo' },
  { key: 'crunchiness', label: 'Crujiente' }
];

export const ProSensoryRadarChart: React.FC<ProSensoryRadarChartProps> = ({
  radar,
  size = 280,
  interactive = false,
  onChange,
  className = ''
}) => {
  const center = size / 2;
  const radius = (size / 2) - 42; // leave margin for labels
  const totalAxes = AXES.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Calculate polygon points for grid levels (1 to 5)
  const getGridPolygon = (level: number) => {
    const r = (radius / 5) * level;
    return AXES.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  // Calculate data polygon points
  const dataPoints = AXES.map((axis, i) => {
    const val = Math.max(0, Math.min(5, radar[axis.key] || 0));
    const r = (radius / 5) * val;
    const angle = i * angleStep - Math.PI / 2;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, val, key: axis.key, angle };
  });

  const polygonPointsString = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const handlePointClick = (key: keyof ProSensoryRadar, currentVal: number) => {
    if (!interactive || !onChange) return;
    const nextVal = currentVal >= 5 ? 1 : currentVal + 1;
    onChange({
      ...radar,
      [key]: nextVal
    });
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background circular guide grid */}
        {[1, 2, 3, 4, 5].map(level => (
          <polygon
            key={level}
            points={getGridPolygon(level)}
            fill={level === 5 ? '#f8fafc' : 'none'}
            stroke={level === 5 ? '#cbd5e1' : '#e2e8f0'}
            strokeWidth={level === 5 ? '1.5' : '0.8'}
            strokeDasharray={level < 5 ? '3 3' : undefined}
          />
        ))}

        {/* Axis radial lines */}
        {AXES.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon filled shape */}
        <polygon
          points={polygonPointsString}
          fill="rgba(217, 119, 6, 0.22)" // amber-600 with transparency
          stroke="#d97706"
          strokeWidth="2.5"
          className="transition-all duration-300"
        />

        {/* Data points & clickable circles */}
        {dataPoints.map((pt, i) => {
          return (
            <g
              key={pt.key}
              onClick={() => handlePointClick(pt.key, pt.val)}
              className={interactive ? 'cursor-pointer group' : ''}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={interactive ? 6 : 4}
                fill="#ffffff"
                stroke="#b45309"
                strokeWidth="2"
                className="transition-all duration-200 group-hover:scale-125"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={2}
                fill="#b45309"
              />
            </g>
          );
        })}

        {/* Axis labels */}
        {AXES.map((axis, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDist = radius + 22;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);

          const currentVal = radar[axis.key] || 0;

          return (
            <text
              key={axis.key}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              className={`text-[10px] font-mono tracking-tight font-bold ${
                interactive ? 'cursor-pointer hover:fill-amber-600' : ''
              }`}
              fill="#334155"
              onClick={() => handlePointClick(axis.key, currentVal)}
            >
              {axis.label} ({currentVal})
            </text>
          );
        })}
      </svg>
      {interactive && (
        <span className="text-[10px] text-slate-400 mt-1 font-mono">
          * Haz clic en los ejes o vértices para graduar la intensidad (1 a 5)
        </span>
      )}
    </div>
  );
};
