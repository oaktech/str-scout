import { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import type { RentalIncome, OperatingExpense, CalculationResult } from '../types';
import {
  calculateAlosSensitivity,
  findSweetSpot,
  findBreakEvenAlos,
  calcSensitivityScore,
  hasPerStayExpenses,
} from '../utils/alosAnalysis';

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pctFmt = (v: number) => `${(v * 100).toFixed(1)}%`;

// Scout design tokens for charts
const COLORS = {
  mint: '#3DD9A0',
  rose: '#F07070',
  amber: '#E5A84B',
  blue: '#6B9FFF',
  ash: '#2A2725',
  fossil: '#9A938C',
  soot: '#161514',
  bone: '#F5F1EC',
  chalk: '#E8E3DC',
  carbon: '#1E1C1A',
};

const AXIS_STYLE = {
  fontSize: 11,
  fontFamily: 'IBM Plex Mono, monospace',
  fill: COLORS.fossil,
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-scout-soot border border-scout-ash rounded-lg px-3 py-2 shadow-xl">
      <p className="text-scout-fossil text-[10px] font-mono mb-1">{label}-night stay</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-scout-bone text-xs font-mono">
          <span style={{ color: entry.color }}>{entry.name}</span>{': '}
          {entry.name.includes('%') ? pctFmt(entry.value) : fmt(entry.value)}
        </p>
      ))}
    </div>
  );
}

interface Props {
  income: RentalIncome;
  expenses: OperatingExpense[];
  calculations: CalculationResult;
}

export default function AlosAnalysis({ income, expenses, calculations }: Props) {
  const currentAlos = income.avg_stay_nights || 3;
  const [selectedAlos, setSelectedAlos] = useState(3);
  const hasPerStay = hasPerStayExpenses(expenses);

  const data = useMemo(
    () => calculateAlosSensitivity({ income, expenses, calculations }),
    [income, expenses, calculations],
  );

  const selectedPoint = data.find((d) => d.alos === selectedAlos) || data[0];
  const sweetSpot = useMemo(() => findSweetSpot(data), [data]);
  const breakEvenAlos = useMemo(() => findBreakEvenAlos(data), [data]);
  const sensitivity = useMemo(() => calcSensitivityScore(data), [data]);

  // Chart data with percentage values scaled for display
  const chartData = useMemo(
    () => data.map((d) => ({
      ...d,
      noiMarginPct: d.noiMargin * 100,
      perStayCostPctDisplay: d.perStayCostPct * 100,
    })),
    [data],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="font-display text-lg text-scout-bone">ALOS Margin Analysis</h3>
          <div className="divider flex-1" />
          <span className="text-xs text-scout-fossil font-mono">
            Current: <span className="text-scout-mint font-semibold">{selectedAlos} nights</span>
          </span>
        </div>
        <p className="text-sm text-scout-fossil">
          How does average length of stay affect your bottom line? Properties with high per-stay costs
          are dramatically more sensitive to shorter guest stays.
        </p>
      </div>

      {/* Slider + Metric Cards */}
      <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
        <div className="flex items-center gap-4 mb-5">
          <label className="text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium whitespace-nowrap">
            Simulate ALOS
          </label>
          <input
            type="range"
            min={2}
            max={14}
            step={1}
            value={selectedAlos}
            onChange={(e) => setSelectedAlos(parseInt(e.target.value))}
            className="flex-1 accent-scout-mint h-1.5 cursor-pointer"
          />
          <span className="text-lg text-scout-mint font-mono font-semibold w-16 text-right">
            {selectedAlos}n
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-scout-soot border border-scout-ash rounded-lg p-3.5">
            <div className="text-[10px] text-scout-drift uppercase tracking-[0.12em] font-medium mb-1">Stays / Year</div>
            <div className="text-xl font-semibold font-mono text-scout-bone">{selectedPoint.staysPerYear}</div>
          </div>
          <div className="bg-scout-soot border border-scout-ash rounded-lg p-3.5">
            <div className="text-[10px] text-scout-drift uppercase tracking-[0.12em] font-medium mb-1">Annual Cleaning</div>
            <div className="text-xl font-semibold font-mono text-scout-amber">{fmt(selectedPoint.perStayCostsAnnual)}</div>
          </div>
          <div className="bg-scout-soot border border-scout-ash rounded-lg p-3.5">
            <div className="text-[10px] text-scout-drift uppercase tracking-[0.12em] font-medium mb-1">NOI</div>
            <div className={`text-xl font-semibold font-mono ${selectedPoint.noi >= 0 ? 'text-scout-mint' : 'text-scout-rose'}`}>
              {fmt(selectedPoint.noi)}
            </div>
          </div>
          <div className="bg-scout-soot border border-scout-ash rounded-lg p-3.5">
            <div className="text-[10px] text-scout-drift uppercase tracking-[0.12em] font-medium mb-1">NOI Margin</div>
            <div className={`text-xl font-semibold font-mono ${selectedPoint.noiMargin >= 0.2 ? 'text-scout-mint' : selectedPoint.noiMargin >= 0 ? 'text-scout-amber' : 'text-scout-rose'}`}>
              {pctFmt(selectedPoint.noiMargin)}
            </div>
          </div>
        </div>
      </div>

      {/* Charts 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NOI by ALOS */}
        <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
          <h4 className="text-xs text-scout-drift uppercase tracking-[0.08em] font-medium mb-4">NOI by ALOS</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ash} />
              <XAxis dataKey="alos" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: COLORS.ash }} />
              <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
                            <ReferenceLine x={selectedAlos} stroke={COLORS.mint} strokeDasharray="6 4" label={{ value: `${selectedAlos}n`, fill: COLORS.mint, fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
              <defs>
                <linearGradient id="noiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.mint} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.mint} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="noi" name="NOI" stroke={COLORS.mint} fill="url(#noiGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Stay Cost % */}
        <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
          <h4 className="text-xs text-scout-drift uppercase tracking-[0.08em] font-medium mb-4">Per-Stay Cost %</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ash} />
              <XAxis dataKey="alos" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: COLORS.ash }} />
              <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip content={<ChartTooltip />} />
                            <ReferenceLine x={selectedAlos} stroke={COLORS.mint} strokeDasharray="6 4" label={{ value: `${selectedAlos}n`, fill: COLORS.mint, fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
              <Line type="monotone" dataKey="perStayCostPctDisplay" name="Per-Stay Cost %" stroke={COLORS.amber} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* NOI Margin % */}
        <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
          <h4 className="text-xs text-scout-drift uppercase tracking-[0.08em] font-medium mb-4">NOI Margin %</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ash} />
              <XAxis dataKey="alos" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: COLORS.ash }} />
              <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip content={<ChartTooltip />} />
                            <ReferenceLine x={selectedAlos} stroke={COLORS.mint} strokeDasharray="6 4" label={{ value: `${selectedAlos}n`, fill: COLORS.mint, fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
              <defs>
                <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.mint} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS.mint} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="noiMarginPct" name="NOI Margin %" stroke={COLORS.mint} fill="url(#marginGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Annual Cleaning Cost */}
        <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
          <h4 className="text-xs text-scout-drift uppercase tracking-[0.08em] font-medium mb-4">Annual Turnover Costs</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ash} />
              <XAxis dataKey="alos" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: COLORS.ash }} />
              <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
                            <ReferenceLine x={selectedAlos} stroke={COLORS.mint} strokeDasharray="6 4" label={{ value: `${selectedAlos}n`, fill: COLORS.mint, fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
              <Bar dataKey="perStayCostsAnnual" name="Turnover Costs" fill={COLORS.amber} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Impact Table */}
      <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="font-display text-lg text-scout-bone">ALOS Impact Breakdown</h3>
          <div className="divider flex-1" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-scout-drift border-b border-scout-ash">
                <th className="text-left py-2.5 pr-4 uppercase tracking-[0.08em] font-medium text-[10px]">ALOS</th>
                <th className="text-right py-2.5 px-2 uppercase tracking-[0.08em] font-medium text-[10px]">Stays/yr</th>
                <th className="text-right py-2.5 px-2 uppercase tracking-[0.08em] font-medium text-[10px]">Turnover Cost</th>
                <th className="text-right py-2.5 px-2 uppercase tracking-[0.08em] font-medium text-[10px]">Total Expenses</th>
                <th className="text-right py-2.5 px-2 uppercase tracking-[0.08em] font-medium text-[10px]">NOI</th>
                <th className="text-right py-2.5 px-2 uppercase tracking-[0.08em] font-medium text-[10px]">Margin</th>
                <th className="text-right py-2.5 pl-2 uppercase tracking-[0.08em] font-medium text-[10px]">Pre-Tax CF</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const isSelected = row.alos === selectedAlos;
                const isActual = row.alos === Math.round(currentAlos);
                return (
                  <tr key={row.alos}
                    className={`border-b border-scout-ash/40 transition-colors
                      ${isSelected ? 'bg-scout-mint/10' : 'hover:bg-scout-ash/20'}`}>
                    <td className="py-2 pr-4 font-mono text-scout-fossil">
                      {row.alos}n
                      {isSelected && <span className="ml-1.5 text-scout-mint text-[9px]">selected</span>}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-scout-chalk">{row.staysPerYear}</td>
                    <td className="py-2 px-2 text-right font-mono text-scout-amber">{fmt(row.perStayCostsAnnual)}</td>
                    <td className="py-2 px-2 text-right font-mono text-scout-chalk">{fmt(row.totalExpenses)}</td>
                    <td className={`py-2 px-2 text-right font-mono ${row.noi >= 0 ? 'text-scout-mint' : 'text-scout-rose'}`}>{fmt(row.noi)}</td>
                    <td className={`py-2 px-2 text-right font-mono ${row.noiMargin >= 0.2 ? 'text-scout-mint' : row.noiMargin >= 0 ? 'text-scout-amber' : 'text-scout-rose'}`}>{pctFmt(row.noiMargin)}</td>
                    <td className={`py-2 pl-2 text-right font-mono ${row.cashFlow >= 0 ? 'text-scout-mint' : 'text-scout-rose'}`}>{fmt(row.cashFlow)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategy Insight Card */}
      <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="font-display text-lg text-scout-bone">Strategy Insights</h3>
          <div className="divider flex-1" />
        </div>
        {!hasPerStay ? (
          <p className="text-sm text-scout-fossil italic">
            No per-stay expenses configured. Add turnover costs (cleaning, laundry, etc.) in the Financials tab
            to see how ALOS impacts your margins.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sweet Spot */}
            <div className="bg-scout-soot border border-scout-ash rounded-lg p-4">
              <div className="text-[10px] text-scout-drift uppercase tracking-[0.12em] font-medium mb-1">Sweet Spot</div>
              <div className="text-xl font-semibold font-mono text-scout-mint">
                {sweetSpot ? `${sweetSpot} nights` : 'N/A'}
              </div>
              <p className="text-[11px] text-scout-fossil mt-1.5">
                {sweetSpot
                  ? 'ALOS where margin gains start plateauing'
                  : 'Margin keeps improving across full range'}
              </p>
            </div>

            {/* Break-Even ALOS */}
            <div className="bg-scout-soot border border-scout-ash rounded-lg p-4">
              <div className="text-[10px] text-scout-drift uppercase tracking-[0.12em] font-medium mb-1">Break-Even ALOS</div>
              <div className={`text-xl font-semibold font-mono ${breakEvenAlos ? 'text-scout-amber' : 'text-scout-rose'}`}>
                {breakEvenAlos ? `${breakEvenAlos} nights` : '> 14 nights'}
              </div>
              <p className="text-[11px] text-scout-fossil mt-1.5">
                {breakEvenAlos
                  ? 'Minimum ALOS for positive cash flow'
                  : 'Cash flow negative across entire range'}
              </p>
            </div>

            {/* Sensitivity */}
            <div className="bg-scout-soot border border-scout-ash rounded-lg p-4">
              <div className="text-[10px] text-scout-drift uppercase tracking-[0.12em] font-medium mb-1">Sensitivity</div>
              <div className={`text-xl font-semibold font-mono ${Math.abs(sensitivity) > 1000 ? 'text-scout-rose' : 'text-scout-chalk'}`}>
                {fmt(Math.abs(sensitivity))}/night
              </div>
              <p className="text-[11px] text-scout-fossil mt-1.5">
                {Math.abs(sensitivity) > 2000
                  ? 'High sensitivity \u2014 ALOS strongly impacts NOI'
                  : Math.abs(sensitivity) > 500
                    ? 'Moderate sensitivity to stay length'
                    : 'Low sensitivity \u2014 ALOS has minimal impact'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
