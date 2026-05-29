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
              <stop offset="0%" stopColor="#0A84FF" />
              <stop offset="100%" stopColor="#5E5CE6" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(10,132,255,0.08)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6E7889" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#A3ADBF" }}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 5", "dataMax + 5"]}
            width={28}
          />
          <Tooltip
            cursor={{ stroke: "rgba(10,132,255,0.20)", strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(10,132,255,0.15)",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(10,60,120,0.12)",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#4C5566", fontSize: "11px", marginBottom: "2px" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#lineGrad)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#0066E6", stroke: "white", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#0A84FF", stroke: "white", strokeWidth: 2 }}
          />
          {emphasizeLast && last ? (
            <ReferenceDot
              x={last.label}
              y={last.value}
              r={6}
              fill="#0A84FF"
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
