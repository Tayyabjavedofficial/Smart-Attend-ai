"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from "recharts";

interface Point {
  label: string;
  value: number;
}

export function TrendChart({
  data,
  height = 200,
  emphasizeLast = true,
}: {
  data: Point[];
  height?: number;
  emphasizeLast?: boolean;
}) {
  const last = data[data.length - 1];
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1D9E75" />
              <stop offset="100%" stopColor="#0F6E56" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(15,110,86,0.08)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#73726C" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#A8A496" }}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 5", "dataMax + 5"]}
            width={28}
          />
          <Tooltip
            cursor={{ stroke: "rgba(15,110,86,0.18)", strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(15,110,86,0.15)",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(6,56,40,0.10)",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#4F4E4A", fontSize: "11px", marginBottom: "2px" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#lineGrad)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#0F6E56", stroke: "white", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#1D9E75", stroke: "white", strokeWidth: 2 }}
          />
          {emphasizeLast && last ? (
            <ReferenceDot
              x={last.label}
              y={last.value}
              r={6}
              fill="#1D9E75"
              stroke="white"
              strokeWidth={3}
              isFront
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
