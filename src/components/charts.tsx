"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  BracketStat,
  DeckStat,
  Overview,
  TimeStat,
  TurnStat,
  WinTypeStat,
} from "@/lib/stats";
import { useTheme } from "./theme";

// Validated categorical palettes (see dataviz reference palette), one stepped
// for each surface. Chosen by the resolved theme so charts match light/dark.
function usePalette() {
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const C = dark
    ? {
        blue: "#3987e5",
        good: "#0ca30c",
        critical: "#d03b3b",
        violet: "#9085e9",
        muted: "#898781",
        grid: "#2c2c2a",
        axis: "#383835",
        ink: "#c3c2b7",
        sep: "#020617",
      }
    : {
        blue: "#2a78d6",
        good: "#0ca30c",
        critical: "#d03b3b",
        violet: "#4a3aa7",
        muted: "#898781",
        grid: "#e1e0d9",
        axis: "#c3c2b7",
        ink: "#52514e",
        sep: "#ffffff",
      };
  const AXIS_PROPS = {
    stroke: C.axis,
    tick: { fill: C.muted, fontSize: 12 },
    tickLine: false,
  } as const;
  const tooltipStyle = {
    contentStyle: {
      background: dark ? "#0f172a" : "#ffffff",
      border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}`,
      borderRadius: 8,
      color: dark ? "#e2e8f0" : "#0f172a",
      fontSize: 12,
    },
    labelStyle: { color: C.muted },
    cursor: { fill: dark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)" },
  } as const;
  return { C, AXIS_PROPS, tooltipStyle };
}

function ChartFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-subtle">
      {label}
    </div>
  );
}

/** Win / Loss / Draw split. */
export function WinRateDonut({ overview }: { overview: Overview }) {
  const { C, tooltipStyle } = usePalette();
  if (overview.total === 0) return <EmptyChart label="Noch keine Spiele" />;
  const data = [
    { name: "Siege", value: overview.wins, color: C.good },
    { name: "Niederlagen", value: overview.losses, color: C.critical },
    { name: "Unentschieden", value: overview.draws, color: C.muted },
  ].filter((d) => d.value > 0);

  return (
    <ChartFrame>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          stroke={C.sep}
          strokeWidth={2}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: C.ink }}
        />
      </PieChart>
    </ChartFrame>
  );
}

/** How games are won — total vs. my own wins. */
export function WinTypeChart({ data }: { data: WinTypeStat[] }) {
  const { C, AXIS_PROPS, tooltipStyle } = usePalette();
  if (data.length === 0) return <EmptyChart label="Noch keine Sieg-Daten" />;
  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis
          dataKey="label"
          {...AXIS_PROPS}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={64}
        />
        <YAxis allowDecimals={false} {...AXIS_PROPS} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: C.ink }} />
        <Bar dataKey="total" name="Gesamt" fill={C.blue} radius={[4, 4, 0, 0]} />
        <Bar dataKey="mine" name="Davon ich" fill={C.good} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

/** Wins by turn, split into my wins vs. opponents' wins (stacked). */
export function TurnChart({ data }: { data: TurnStat[] }) {
  const { C, AXIS_PROPS, tooltipStyle } = usePalette();
  if (data.length === 0) return <EmptyChart label="Noch keine Turn-Daten" />;
  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="turn" {...AXIS_PROPS} tickFormatter={(t) => `T${t}`} />
        <YAxis allowDecimals={false} {...AXIS_PROPS} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: C.ink }} />
        <Bar
          dataKey="mine"
          name="Meine Siege"
          stackId="t"
          fill={C.good}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="opponents"
          name="Gegner-Siege"
          stackId="t"
          fill={C.critical}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartFrame>
  );
}

/** Per-deck win rate (%). Single series, direct-labelled by the deck axis. */
export function DeckWinRateChart({ data }: { data: DeckStat[] }) {
  const { C, AXIS_PROPS, tooltipStyle } = usePalette();
  const withGames = data.filter((d) => d.games > 0);
  if (withGames.length === 0)
    return <EmptyChart label="Noch keine gespielten Decks" />;
  const rows = withGames.map((d) => ({
    name: d.name,
    winRate: Math.round(d.winRate * 100),
    games: d.games,
  }));

  return (
    <ChartFrame>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid stroke={C.grid} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} unit="%" {...AXIS_PROPS} />
        <YAxis type="category" dataKey="name" width={110} {...AXIS_PROPS} />
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number, _name, item) => [
            `${value}% (${item.payload.games} Spiele)`,
            "Winrate",
          ]}
        />
        <Bar dataKey="winRate" fill={C.blue} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

/** Games and wins over time (by month). */
export function TimeChart({ data }: { data: TimeStat[] }) {
  const { C, AXIS_PROPS, tooltipStyle } = usePalette();
  if (data.length === 0) return <EmptyChart label="Noch kein Verlauf" />;
  return (
    <ChartFrame>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gamesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
            <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="period" {...AXIS_PROPS} />
        <YAxis allowDecimals={false} {...AXIS_PROPS} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: C.ink }} />
        <Area
          type="monotone"
          dataKey="games"
          name="Spiele"
          stroke={C.blue}
          strokeWidth={2}
          fill="url(#gamesFill)"
        />
        <Line
          type="monotone"
          dataKey="wins"
          name="Siege"
          stroke={C.good}
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ChartFrame>
  );
}

/** Bracket distribution. */
export function BracketChart({ data }: { data: BracketStat[] }) {
  const { C, AXIS_PROPS, tooltipStyle } = usePalette();
  if (data.length === 0) return <EmptyChart label="Noch keine Bracket-Daten" />;
  const rows = data.map((d) => ({
    bracket: d.bracket === "—" ? "Ohne" : `Bracket ${d.bracket}`,
    games: d.games,
    wins: d.wins,
  }));
  return (
    <ChartFrame>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="bracket" {...AXIS_PROPS} />
        <YAxis allowDecimals={false} {...AXIS_PROPS} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: C.ink }} />
        <Bar dataKey="games" name="Spiele" fill={C.violet} radius={[4, 4, 0, 0]} />
        <Bar dataKey="wins" name="Siege" fill={C.good} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}
