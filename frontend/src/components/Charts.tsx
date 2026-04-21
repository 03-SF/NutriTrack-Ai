import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useMemo } from "react";

type Props = {
  dailyGoal: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  nutritionHistory: any[];
};

// Switched to purple palette:
// primary purple: #7c3aed
// lighter purple:  #a78bfa
// vivid purple:    #8b5cf6
const MACRO_COLORS = ["#7c3aed", "#a78bfa", "#8b5cf6"];

export default function Charts({
  dailyGoal,
  caloriesConsumed,
  caloriesBurned,
  proteinConsumed,
  carbsConsumed,
  fatConsumed,
  nutritionHistory,
}: Props) {
  // Generate weekly data from nutrition history
  const weeklyData = useMemo(() => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = daysOfWeek[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      
      // Find matching history entry
      const historyEntry = nutritionHistory.find((h: any) => {
        const hDate = new Date(h.date).toISOString().split('T')[0];
        return hDate === dateStr;
      });
      
      // Use history data if available, otherwise 0 for past days or current consumed for today
      const isToday = i === 0;
      const actual = historyEntry 
        ? historyEntry.totalCalories 
        : (isToday ? Math.max(caloriesConsumed - caloriesBurned, 0) : 0);
      
      data.push({ day: dayName, actual });
    }
    
    return data;
  }, [nutritionHistory, caloriesConsumed, caloriesBurned]);

  // Macro distribution - uses real data from nutrition entries
  const macroData = useMemo(() => {
    // Calculate total grams
    const totalGrams = proteinConsumed + carbsConsumed + fatConsumed;
    
    // If no macros logged yet, show placeholder
    if (totalGrams === 0) {
      return [
        { name: "Protein", value: 0, grams: 0 },
        { name: "Carbs", value: 0, grams: 0 },
        { name: "Fats", value: 0, grams: 0 },
      ];
    }
    
    // Calculate percentages
    return [
      { 
        name: "Protein", 
        value: Math.round((proteinConsumed / totalGrams) * 100),
        grams: Math.round(proteinConsumed * 10) / 10
      },
      { 
        name: "Carbs", 
        value: Math.round((carbsConsumed / totalGrams) * 100),
        grams: Math.round(carbsConsumed * 10) / 10
      },
      { 
        name: "Fats", 
        value: Math.round((fatConsumed / totalGrams) * 100),
        grams: Math.round(fatConsumed * 10) / 10
      },
    ];
  }, [proteinConsumed, carbsConsumed, fatConsumed]);

  // Check if user has any data
  const hasWeeklyData = weeklyData.some(d => d.actual > 0);
  const hasMacroData = proteinConsumed + carbsConsumed + fatConsumed > 0;

  return (
    <div className="charts-grid">
      {/* Left: Weekly Calorie Intake */}
      <div className="chart-panel">
        <div className="chart-header">
          <div className="chart-title">Weekly Calorie Intake</div>
          <div className="chart-subtitle">Actual vs target ({dailyGoal} kcal)</div>
        </div>

        <div className="chart-body">
          {!hasWeeklyData ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '260px',
              color: 'var(--text-soft)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No meals logged yet</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Start tracking your nutrition to see your weekly progress
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(189,195,200,0.5)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#7d9196", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#bdc3c8" }}
              />
              <YAxis
                tick={{ fill: "#7d9196", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#bdc3c8" }}
                width={60}
                tickFormatter={(v) => `${v} kcal`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #bdc3c8",
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: "0 8px 18px rgba(50,81,88,0.08)",
                }}
                labelStyle={{ color: "#325158", fontWeight: 600 }}
                itemStyle={{ color: "#325158" }}
                formatter={(value: number) => [`${value} kcal`, "Actual intake"]}
              />

              {/* Target line */}
              <ReferenceLine y={dailyGoal} stroke="#bdc3c8" strokeDasharray="4 4" />

              <Area
                type="monotone"
                dataKey="actual"
                stroke="#6d28d9"
                strokeWidth={2}
                fill="url(#colorActual)"
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#ffffff",
                  fill: "#7c3aed",
                }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}

          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: "#7c3aed" }} />
              <span>Actual intake</span>
            </div>
            <div className="legend-item">
              <span
                className="legend-dot"
                style={{
                  borderColor: "#bdc3c8",
                  borderWidth: 2,
                  borderStyle: "dashed",
                  background: "transparent",
                }}
              />
              <span>Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Macro Distribution Donut */}
      <div className="chart-panel">
        <div className="chart-header">
          <div className="chart-title">Macro Distribution</div>
          <div className="chart-subtitle">Today’s intake by macros</div>
        </div>

        <div className="chart-body chart-body-center">
          {!hasMacroData ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '260px',
              color: 'var(--text-soft)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🥗</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No macros tracked yet</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Log your meals to see your protein, carbs, and fat breakdown
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={macroData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {macroData.map((entry, index) => (
                  <Cell key={entry.name} fill={MACRO_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #bdc3c8",
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: "0 8px 18px rgba(50,81,88,0.08)",
                }}
                labelStyle={{ color: "#325158", fontWeight: 600 }}
                itemStyle={{ color: "#325158" }}
                formatter={(value: number, name: string, props: any) => {
                  const grams = props.payload.grams || 0;
                  return grams > 0 ? [`${value}% (${grams}g)`, name] : [`${value}%`, name];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={40}
                formatter={(value, entry: any) => {
                  const grams = entry.payload?.grams || 0;
                  return (
                    <span style={{ color: "#7d9196", fontSize: 12 }}>
                      {value} {grams > 0 && `(${grams}g)`}
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}