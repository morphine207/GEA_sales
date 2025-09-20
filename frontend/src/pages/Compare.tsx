import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { apiCalculateProjectTCO, apiGetProject, mapBackendProjectToFrontend, TCOCalculationRequest } from "@/lib/api";
import { Project } from "@/types/project";

type ChartSeries = {
  name: string;
  colorVar: string;
  dataKey: string;
};

const currency = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export default function Compare() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState("projects");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Slider state
  const [years, setYears] = useState<number>(5);
  const [throughputPerDay, setThroughputPerDay] = useState<number>(0);
  const [electricityEurPerKwh, setElectricityEurPerKwh] = useState<number>(0.25);
  const [waterEurPerL, setWaterEurPerL] = useState<number>(0.002);
  const initialThroughputRef = useRef<number>(0);

  // Data
  const [series, setSeries] = useState<{ name: string; monthly_cum_total: number[]; ca: number; cc: number; co: number; cm: number }[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await apiGetProject(id!);
        const p = mapBackendProjectToFrontend(resp.project);
        setProject(p);
        setYears(p.years);
        setThroughputPerDay(p.capacityPerDay);
        // Store initial throughput to keep slider max at 5x the initial value
        initialThroughputRef.current = p.capacityPerDay;
        setElectricityEurPerKwh(p.energyPriceEurPerKwh);
        setWaterEurPerL(p.waterPriceEurPerL);
      } catch (e) {
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const fetchData = async (payloadOverrides?: Partial<TCOCalculationRequest>) => {
    if (!project) return;
    try {
      setIsFetching(true);
      const resp = await apiCalculateProjectTCO(project.projectName, {
        years,
        electricity_eur_per_kwh: electricityEurPerKwh,
        water_eur_per_l: waterEurPerL,
        throughput_per_day: throughputPerDay,
        workdays_per_week: project.workdaysPerWeek,
        ...(payloadOverrides || {}),
      });
      const combined = (resp.tco_results || []).map((r, i) => {
        const machine = (resp.relevant_machines || [])[i] as any;
        const name = (machine?.langtyp || "").toString().trim() || r.label;
        const total = r.monthly_cum_total?.[r.monthly_cum_total.length - 1] ?? 0;
        return { name, monthly_cum_total: r.monthly_cum_total, ca: r.ca, cc: r.cc, co: r.co, cm: r.cm, _total: total };
      });
      const top3 = combined
        .sort((a, b) => a._total - b._total)
        .slice(0, 3)
        .map(({ _total, ...rest }) => rest);
      setSeries(top3);
    } catch (e) {
      setError("Calculation failed");
      setSeries([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (project) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const chartData = useMemo(() => {
    if (!series.length) return [] as Array<Record<string, number | string>>;
    const maxLen = Math.max(...series.map(s => s.monthly_cum_total?.length || 0));
    const rows: Array<Record<string, number | string>> = [];
    for (let i = 0; i < maxLen; i++) {
      const row: Record<string, number | string> = { month: i + 1 };
      series.forEach((s, idx) => {
        row[`s${idx + 1}`] = s.monthly_cum_total?.[i] ?? null;
      });
      rows.push(row);
    }
    return rows;
  }, [series]);

  const chartConfig = useMemo(
    () => ({
      s1: { label: series[0]?.name || "#1", color: "#2563eb" },
      s2: { label: series[1]?.name || "#2", color: "#f59e0b" },
      s3: { label: series[2]?.name || "#3", color: "#10b981" },
    }),
    [series],
  );

  const lines: ChartSeries[] = useMemo(() => {
    const arr: ChartSeries[] = [];
    if (series[0]) arr.push({ name: series[0].name, colorVar: "var(--color-s1)", dataKey: "s1" });
    if (series[1]) arr.push({ name: series[1].name, colorVar: "var(--color-s2)", dataKey: "s2" });
    if (series[2]) arr.push({ name: series[2].name, colorVar: "var(--color-s3)", dataKey: "s3" });
    return arr;
  }, [series]);

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item);
    if (item === "projects") navigate("/");
    else if (item === "machines") navigate("/?section=machines");
    else if (item === "tco-formula") navigate("/?section=tco-formula");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onNewProject={() => navigate("/project/new")} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" onClick={() => navigate(`/project/${id}`)}>
                Back to Project
              </Button>
              <span className="text-muted-foreground">/</span>
              <div className="font-semibold">Compare top 3 machines</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {loading ? "Loading…" : error ? error : series.length ? `${series.length} variants` : "No results"}
            </div>
          </div>

          {/* Top: Left sliders, right chart */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Sliders */}
            <Card className="p-4 space-y-4 lg:col-span-1">
              <div>
                <div className="text-xs text-muted-foreground mb-2">Lifetime (years)</div>
                <Slider value={[years]} min={0} max={100} step={1} onValueChange={v => setYears(v[0])} onValueCommit={() => fetchData()} />
                <div className="text-xs mt-1">{years} years</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Input per day (L/day)</div>
                <Slider value={[throughputPerDay]} min={0} max={(initialThroughputRef.current || 0) * 5} step={100} onValueChange={v => setThroughputPerDay(v[0])} onValueCommit={() => fetchData()} />
                <div className="text-xs mt-1">{throughputPerDay} L/day</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Electricity cost (€/kWh)</div>
                <Slider value={[electricityEurPerKwh]} min={0.05} max={1.0} step={0.01} onValueChange={v => setElectricityEurPerKwh(v[0])} onValueCommit={() => fetchData()} />
                <div className="text-xs mt-1">{electricityEurPerKwh.toFixed(2)} €/kWh</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Water cost (€/L)</div>
                <Slider value={[waterEurPerL]} min={0.0001} max={0.01} step={0.0001} onValueChange={v => setWaterEurPerL(Number(v[0].toFixed(4)))} onValueCommit={() => fetchData()} />
                <div className="text-xs mt-1">{waterEurPerL.toFixed(4)} €/L</div>
              </div>
              <Button className="w-full" disabled={isFetching || loading} onClick={() => fetchData()}>
                {isFetching ? "Updating…" : "Recalculate"}
              </Button>
            </Card>

            {/* Chart */}
            <Card className="p-4 lg:col-span-3">
              <ChartContainer config={chartConfig} className="w-full h-[320px]">
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => currency(Number(v))} tickLine={false} axisLine={false} width={80} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => currency(Number(value))} />} />
                  {lines.map((l, i) => (
                    <Line key={l.dataKey} type="monotone" dataKey={l.dataKey} stroke={`var(--color-s${i + 1})`} strokeWidth={2} dot={false} isAnimationActive={false} />
                  ))}
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </Card>
          </div>

          {/* Bottom: machine breakdowns */}
          {series.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {series.slice(0, 3).map((s, idx) => {
                const total = s.monthly_cum_total?.[s.monthly_cum_total.length - 1] ?? 0;
                const borderColor = idx === 0 ? chartConfig.s1.color : idx === 1 ? chartConfig.s2.color : chartConfig.s3.color;
                return (
                  <Card key={idx} className="p-4 border-2" style={{ borderColor }}>
                    <div className="font-semibold mb-2">{s.name}</div>
                    <div className="text-sm text-muted-foreground mb-3">Total: <span className="font-semibold text-foreground">{currency(total)}</span></div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span>Acquisition</span><span>{currency(s.ca)}</span></div>
                      <div className="flex items-center justify-between"><span>Commissioning</span><span>{currency(s.cc)}</span></div>
                      <div className="flex items-center justify-between"><span>Operating</span><span>{currency(s.co)}</span></div>
                      <div className="flex items-center justify-between"><span>Maintenance</span><span>{currency(s.cm)}</span></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


