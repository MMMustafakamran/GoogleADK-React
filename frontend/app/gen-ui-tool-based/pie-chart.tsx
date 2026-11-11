"use client";
// HARNESS: `./pie-chart` (PieChart, pieChartPropsSchema) is imported by the page but never shown.
import { z } from "zod";
import { Cell, Pie, PieChart as RPieChart, Tooltip } from "recharts";

export const pieChartPropsSchema = z.object({
  title: z.string(),
  description: z.string(),
  data: z.array(z.object({ label: z.string(), value: z.number() })),
});

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

export function PieChart(props: Partial<z.infer<typeof pieChartPropsSchema>>) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <h3>{props.title}</h3>
      <p>{props.description}</p>
      <RPieChart width={320} height={240}>
        <Pie data={props.data ?? []} dataKey="value" nameKey="label" innerRadius={50} outerRadius={90}>
          {(props.data ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </RPieChart>
    </div>
  );
}
