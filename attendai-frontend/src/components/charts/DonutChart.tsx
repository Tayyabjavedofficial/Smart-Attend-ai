"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Slice {
  name: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 180,
}: {
  data: Slice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={size * 0.36}
            outerRadius={size * 0.48}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) ? (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center leading-tight">
            {centerLabel ? <p className="text-[0.62rem] uppercase tracking-wider text-ink-400">{centerLabel}</p> : null}
            {centerValue ? <p className="font-display text-[2rem] text-ink-900 numeral">{centerValue}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
