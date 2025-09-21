import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { apiCalculateProjectTCO, apiGetProject, mapBackendProjectToFrontend, TCOCalculationRequest } from "@/lib/api";
import { Project } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { generateSalesInsights, SalesInsights } from "@/lib/llm";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, PiggyBank, Zap, TrendingDown, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ChartSeries = {
  name: string;
  colorVar: string;
  dataKey: string;
};

type SeriesItem = {
  name: string;
  monthly_cum_total: number[];
  ca: number;
  cc: number;
  co: number;
  cm: number;
  capacityOk: boolean;
  needed_hours_per_day?: number | null;
  available_hours_per_day?: number | null;
};

type DisplaySlot = {
  name: string;
  valid: boolean;
  reason?: string;
  data?: SeriesItem;
  color: string;
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
  const [operationHoursPerDay, setOperationHoursPerDay] = useState<number>(16);
  const [electricityEurPerKwh, setElectricityEurPerKwh] = useState<number>(0.25);
  const [waterEurPerL, setWaterEurPerL] = useState<number>(0.002);
  const initialThroughputRef = useRef<number>(0);

  // Data
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [displaySlots, setDisplaySlots] = useState<DisplaySlot[]>([]);

  // LLM modal state
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string>("");
  const DEFAULT_PROMPT = `You are a GEA Sales Assistant. Write a concise, plain-language summary for all stakeholders.\n\nRequirements:\n- Use short bullets (max 5 words), simple wording\n- Include a tiny comparison table\n- Highlight: best variant, total TCO, savings vs #2, operating cost share\n- Use a few emojis (💰⚡📉)\n- Max 200 words\n\nOutput in Markdown only.`;
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [insights, setInsights] = useState<SalesInsights | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // Stable color palette for slots #1, #2, #3
  const slotColors = ["#2563eb", "#f59e0b", "#10b981"] as const;

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
        operation_hours_per_day: operationHoursPerDay,
        ...(payloadOverrides || {}),
      });
      const combined = (resp.tco_results || []).map((r, i) => {
        const machine = (resp.relevant_machines || [])[i] as any;
        const name = (machine?.langtyp || "").toString().trim() || r.label;
        const total = r.monthly_cum_total?.[r.monthly_cum_total.length - 1] ?? 0;
        const maxPerHour = Number(machine?.capacity_max_inp) || 0;
        const maxPerDay = maxPerHour * (operationHoursPerDay || 16);
        const capacityOk = (throughputPerDay || 0) <= maxPerDay;
        return {
          name,
          monthly_cum_total: r.monthly_cum_total,
          ca: r.ca,
          cc: r.cc,
          co: r.co,
          cm: r.cm,
          capacityOk,
          needed_hours_per_day: r.needed_hours_per_day,
          available_hours_per_day: r.available_hours_per_day,
          _total: total,
        } as SeriesItem & { _total: number };
      });
      const top3All = combined
        .sort((a, b) => a._total - b._total)
        .slice(0, 3)
        .map(({ _total, ...rest }) => rest as SeriesItem);

      const top3Valid = top3All.filter(s => s.capacityOk);
      setSeries(top3Valid);

      // Update display slots: keep initial top3 as slots; on updates, gray out missing ones, don't auto-replace
      const currentMap = new Map(top3All.map(s => [s.name, s]));
      setDisplaySlots(prev => {
        if (!prev.length) {
          return top3All.map((s, idx) => ({
            name: s.name,
            valid: s.capacityOk,
            reason: s.capacityOk ? undefined : `Capacity surpassed at ${operationHoursPerDay} h/day`,
            data: s.capacityOk ? s : undefined,
            color: slotColors[idx] || "#9ca3af",
          })).slice(0, 3);
        }
        return prev.map(slot => {
          const s = currentMap.get(slot.name);
          if (s) return { name: slot.name, color: slot.color, valid: s.capacityOk, reason: s.capacityOk ? undefined : `Capacity surpassed at ${operationHoursPerDay} h/day`, data: s.capacityOk ? s : undefined };
          return { ...slot, valid: false, reason: "Not valid at current settings", data: undefined };
        });
      });
    } catch (e) {
      setError("Calculation failed");
      setSeries([]);
      // On error, keep existing displaySlots as-is
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

  const chartConfig = useMemo(() => {
    const colorFor = (idx: number): string => {
      const name = series[idx]?.name;
      if (!name) return slotColors[idx] || "#9ca3af";
      const slot = displaySlots.find(ds => ds.name === name);
      return slot?.color || (slotColors[idx] || "#9ca3af");
    };
    return {
      s1: { label: series[0]?.name || "#1", color: colorFor(0) },
      s2: { label: series[1]?.name || "#2", color: colorFor(1) },
      s3: { label: series[2]?.name || "#3", color: colorFor(2) },
    } as const;
  }, [series, displaySlots]);

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

  const bestKpis = useMemo(() => {
    if (!series.length) return null as null | {
      name: string;
      totals: { ca: number; cc: number; co: number; cm: number };
      totalSum: number;
      opSharePct: number;
      savingsVsNext: number;
    };
    const enriched = series.map(s => ({
      name: s.name,
      totals: { ca: s.ca, cc: s.cc, co: s.co, cm: s.cm },
      totalSum: s.ca + s.cc + s.co + s.cm,
    }));
    const sorted = [...enriched].sort((a, b) => a.totalSum - b.totalSum);
    const best = sorted[0];
    const next = sorted[1];
    const opSharePct = best.totalSum > 0 ? Math.round((best.totals.co / best.totalSum) * 100) : 0;
    const savingsVsNext = next ? Math.max(0, Math.round(next.totalSum - best.totalSum)) : 0;
    return { name: best.name, totals: best.totals, totalSum: best.totalSum, opSharePct, savingsVsNext };
  }, [series]);

  const buildLlmPayload = () => {
    const machines = displaySlots.map(s => ({
      name: s.name,
      valid: s.valid,
      totals: s.data ? { ca: s.data.ca, cc: s.data.cc, co: s.data.co, cm: s.data.cm } : null,
    }));
    const tcoResults = series.map(s => ({
      name: s.name,
      totals: { ca: s.ca, cc: s.cc, co: s.co, cm: s.cm },
      monthly_cum_total: s.monthly_cum_total,
    }));
    return {
      project: project,
      inputs: {
        years,
        throughput_per_day: throughputPerDay,
        electricity_eur_per_kwh: electricityEurPerKwh,
        water_eur_per_l: waterEurPerL,
        workdays_per_week: project?.workdaysPerWeek,
        operation_hours_per_day: operationHoursPerDay,
      },
      tcoResults,
      machines,
    };
  };

  const regenerateSummary = async () => {
    if (!project || !series.length) return;
    setLlmLoading(true);
    setLlmError("");
    try {
      const payload = buildLlmPayload();
      const json = await generateSalesInsights({ prompt, data: payload });
      setInsights(json);
    } catch (e: any) {
      setLlmError(e?.message || "Failed to generate summary");
      setInsights(null);
    } finally {
      setLlmLoading(false);
    }
  };

  const handleOpenAssistant = async () => {
    setAssistantOpen(true);
    // auto-generate on open
    await regenerateSummary();
  };

  const handleExportPDF = async () => {
    try {
      const node = (document.getElementById("assistant-print") as HTMLDivElement) || exportRef.current;
      if (!node) return;
      // Prepare donut chart image for print layout by drawing to offscreen canvas (large size for PDF)
      if (bestKpis) {
        const donutData = [
          { name: "Acquisition", value: bestKpis.totals.ca, color: "#2563eb" },
          { name: "Commissioning", value: bestKpis.totals.cc, color: "#f59e0b" },
          { name: "Operating", value: bestKpis.totals.co, color: "#10b981" },
          { name: "Maintenance", value: bestKpis.totals.cm, color: "#ef4444" },
        ];
        const totalVal = donutData.reduce((s, d) => s + (d.value || 0), 0) || 1;
        // Aim to fill near full A4 content width; generate high-res for crisp output
        const cw = 600, ch = 400;
        const cx = cw / 2, cy = ch / 2;
        const rOuter = Math.min(cx, cy) - 40; // generous margin
        const rInner = rOuter * 0.68;
        const cvs = document.createElement("canvas");
        cvs.width = cw; cvs.height = ch;
        const ctx = cvs.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, cw, ch);
          let angle = -Math.PI / 2;
          donutData.forEach(seg => {
            const segAngle = (seg.value / totalVal) * Math.PI * 2;
            const start = angle;
            const end = angle + segAngle;
            ctx.beginPath();
            // Outer arc
            ctx.arc(cx, cy, rOuter, start, end, false);
            // Inner arc (reverse)
            ctx.arc(cx, cy, rInner, end, start, true);
            ctx.closePath();
            ctx.fillStyle = seg.color;
            ctx.fill();
            angle = end;
          });
        }
        const imgEl = document.getElementById("print-donut-img") as HTMLImageElement | null;
        if (imgEl) {
          imgEl.src = cvs.toDataURL("image/png");
        }
      }
      // Ensure charts are fully rendered
      await new Promise(r => setTimeout(r, 250));
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const availW = pageWidth - 48; // 24pt margins
      const availH = pageHeight - 48;
      const scale = Math.min(availW / canvas.width, availH / canvas.height);
      const outW = Math.floor(canvas.width * scale);
      const outH = Math.floor(canvas.height * scale);
      const x = Math.floor((pageWidth - outW) / 2);
      const y = Math.floor((pageHeight - outH) / 2);
      pdf.addImage(imgData, "PNG", x, y, outW, outH, undefined, "FAST");
      pdf.save(`GEA_Sales_Assistant_${project?.projectName || "summary"}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    }
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
            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenAssistant}
                disabled={loading || isFetching}
                className="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white shadow-lg hover:from-sky-500 hover:via-cyan-400 hover:to-emerald-400 focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <Sparkles className="w-4 h-4 mr-2" /> AI Sales Assistant
              </Button>
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
                <div className="text-xs text-muted-foreground mb-2">Operation hours per day (h)</div>
                <Slider value={[operationHoursPerDay]} min={1} max={24} step={1} onValueChange={v => setOperationHoursPerDay(v[0])} onValueCommit={() => fetchData()} />
                <div className="text-xs mt-1">{operationHoursPerDay} h/day</div>
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
                <LineChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" type="number" domain={[1, 'dataMax']} allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin', 'dataMax']} tickFormatter={(v) => currency(Number(v))} tickLine={false} axisLine={false} width={80} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => currency(Number(value))} />} />
                  {lines.map((l, i) => (
                    <Line key={l.dataKey} type="monotone" dataKey={l.dataKey} stroke={`var(--color-s${i + 1})`} strokeWidth={2} dot={false} isAnimationActive={false} />
                  ))}
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </Card>
          </div>

          {/* Bottom: machine breakdowns (keep slots, gray out invalid, only chart valid) */}
          {displaySlots.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displaySlots.map((slot, idx) => {
                const borderColor = slot.color;
                const total = slot.data ? (slot.data.monthly_cum_total?.[slot.data.monthly_cum_total.length - 1] ?? 0) : 0;
                return (
                  <Card key={`${slot.name}-${idx}`} className={`p-4 border-2 ${slot.valid ? "" : "opacity-50"}`} style={{ borderColor }}>
                    <div className="font-semibold mb-1">{slot.name}</div>
                    {!slot.valid && (
                      <div className="text-xs text-muted-foreground mb-2">{slot.reason || "Not valid at current settings"}</div>
                    )}
                    {slot.valid && slot.data ? (
                      <>
                        <div className="text-sm text-muted-foreground mb-3">Total: <span className="font-semibold text-foreground">{currency(total)}</span></div>
                        {typeof slot.data.needed_hours_per_day === 'number' && typeof slot.data.available_hours_per_day === 'number' && (
                          <div className="mb-3">
                            {(() => {
                              const needed = Math.max(0, slot.data.needed_hours_per_day || 0);
                              const available = Math.max(0, slot.data.available_hours_per_day || 0);
                              const pct = available > 0 ? Math.min(100, Math.round((needed / available) * 100)) : 0;
                              // Determine gradient color: green → yellow @60% → red @90%+
                              const grad = (() => {
                                if (pct >= 90) return "bg-red-500";
                                if (pct >= 60) return "bg-yellow-500";
                                return "bg-emerald-500";
                              })();
                              return (
                                <div>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span>Capacity utilization</span>
                                    <span>{pct}%</span>
                                  </div>
                                  <Progress value={pct} indicatorClassName={grad} />
                                  <div className="text-[10px] text-muted-foreground mt-1">Needed {needed.toFixed(1)} h/day of {available.toFixed(1)} h/day</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between"><span>Acquisition</span><span>{currency(slot.data.ca)}</span></div>
                          <div className="flex items-center justify-between"><span>Commissioning</span><span>{currency(slot.data.cc)}</span></div>
                          <div className="flex items-center justify-between"><span>Operating</span><span>{currency(slot.data.co)}</span></div>
                          <div className="flex items-center justify-between"><span>Maintenance</span><span>{currency(slot.data.cm)}</span></div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No costs available</div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Sales Assistant Modal */}
      <Dialog open={assistantOpen} onOpenChange={setAssistantOpen}>
        <DialogContent className="max-w-[80vw] sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>GEA Sales Assistant</DialogTitle>
            <DialogDescription>AI-Powered Insights for Your TCO Comparison</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 max-h-[80vh] overflow-y-auto pr-1" ref={exportRef}>
            {bestKpis && (
              <Card className="p-4">
                <Tabs defaultValue="summary">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <div className="font-semibold">Top Pick</div>
                      <Badge variant="secondary">{bestKpis.name}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <TabsList>
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="table">Table</TabsTrigger>
                        <TabsTrigger value="donut">Donut</TabsTrigger>
                      </TabsList>
                      <Button onClick={handleExportPDF} className="bg-blue-900 hover:bg-blue-800 text-white">Export PDF</Button>
                    </div>
                  </div>
                  <TabsContent value="summary">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground flex items-center gap-1"><PiggyBank className="w-3 h-3" /> Total TCO</div>
                        <div className="text-lg font-bold">{currency(bestKpis.totalSum)}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Savings vs #2</div>
                        <div className="text-lg font-bold">{currency(bestKpis.savingsVsNext)}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" /> Operating cost share</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-full"><Progress value={bestKpis.opSharePct} /></div>
                          <div className="text-sm font-medium w-10 text-right">{bestKpis.opSharePct}%</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="table">
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-xs font-semibold px-3 py-2 text-left">Component</th>
                            <th className="text-xs font-semibold px-3 py-2 text-right">Amount</th>
                            <th className="text-xs font-semibold px-3 py-2 text-right">Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {([
                            ["Acquisition", bestKpis.totals.ca],
                            ["Commissioning", bestKpis.totals.cc],
                            ["Operating", bestKpis.totals.co],
                            ["Maintenance", bestKpis.totals.cm],
                          ] as const).map(([label, val]) => {
                            const pct = bestKpis.totalSum ? Math.round((val / bestKpis.totalSum) * 100) : 0;
                            return (
                              <tr key={label}>
                                <td className="px-3 py-2 text-sm">{label}</td>
                                <td className="px-3 py-2 text-sm text-right">{currency(val)}</td>
                                <td className="px-3 py-2 text-sm text-right">{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  <TabsContent value="donut">
                    {(() => {
                      const data = [
                        { name: "Acquisition", value: bestKpis.totals.ca, color: "#2563eb" },
                        { name: "Commissioning", value: bestKpis.totals.cc, color: "#f59e0b" },
                        { name: "Operating", value: bestKpis.totals.co, color: "#10b981" },
                        { name: "Maintenance", value: bestKpis.totals.cm, color: "#ef4444" },
                      ];
                      const total = data.reduce((s, d) => s + d.value, 0);
                      return (
                        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-6">
                          <PieChart width={280} height={220}>
                            <Pie data={data} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                              {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(v) => currency(Number(v))} />
                          </PieChart>
                          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 min-w-[220px]">
                            {data.map((d) => {
                              const pct = total ? Math.round((d.value / total) * 100) : 0;
                              return (
                                <div key={d.name} className="flex items-center justify-between gap-3 rounded-md border px-2 py-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                                    <span className="text-sm">{d.name}</span>
                                  </div>
                                  <div className="text-sm font-medium text-right">
                                    <div>{currency(d.value)}</div>
                                    <div className="text-xs text-muted-foreground">{pct}%</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </Card>
            )}
            <Card className="p-4 bg-gradient-to-br from-background to-primary/5">
              {llmLoading ? (
                <div className="text-sm text-muted-foreground">Generating summary…</div>
              ) : (
                insights ? (
                  <div className="grid grid-cols-1 gap-4">
                    {(insights.title || insights.subtitle) && (
                      <div className="flex items-center justify-between">
                        <div>
                          {insights.title && <div className="text-lg font-semibold">{insights.title}</div>}
                          {insights.subtitle && <div className="text-sm text-muted-foreground">{insights.subtitle}</div>}
                        </div>
                        {insights.project && (
                          <div className="text-xs text-muted-foreground text-right">
                            {insights.project.company && <div>{insights.project.company}</div>}
                            {insights.project.application && <div>{insights.project.application}</div>}
                            {typeof insights.project.durationYears === 'number' && <div>{insights.project.durationYears} years</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {insights.metrics && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Total TCO</div>
                          <div className="text-lg font-bold">{currency(insights.metrics.totalTcoEur)}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Savings vs #2</div>
                          <div className="text-lg font-bold">{currency(insights.metrics.savingsVsSecondEur)}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Operating share</div>
                          <div className="text-lg font-bold">{insights.metrics.operatingSharePct}%</div>
                        </div>
                      </div>
                    )}

                    {Array.isArray(insights.comparison) && insights.comparison.length > 0 && (
                      <div className="rounded-md border overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-xs font-semibold px-3 py-2 text-left">Machine</th>
                              <th className="text-xs font-semibold px-3 py-2 text-right">Total TCO</th>
                              <th className="text-xs font-semibold px-3 py-2 text-right">Operating</th>
                            </tr>
                          </thead>
                          <tbody>
                            {insights.comparison.map((row, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-sm">{row.name}</td>
                                <td className="px-3 py-2 text-sm text-right">{currency(row.totalTcoEur)}</td>
                                <td className="px-3 py-2 text-sm text-right">{typeof row.operatingCostEur === 'number' ? currency(row.operatingCostEur) : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {Array.isArray(insights.highlights) && insights.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {insights.highlights.map((h, i) => (
                          <Badge key={i} variant="secondary">{h}</Badge>
                        ))}
                      </div>
                    )}

                    {Array.isArray(insights.notes) && insights.notes.length > 0 && (
                      <div className="rounded-md border p-3 bg-card">
                        <div className="text-sm font-medium mb-2">Notes</div>
                        <ul className="list-disc pl-4 text-sm text-muted-foreground">
                          {insights.notes.map((n, i) => (<li key={i}>{n}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No summary yet.</div>
                )
              )}
              {llmError && <div className="mt-2 text-sm text-red-600">{llmError}</div>}
            </Card>

            {/* Hidden print layout to include ALL assistant data regardless of active tabs */}
            {bestKpis && (
              <div id="assistant-print" style={{ position: "absolute", left: -10000, top: 0, width: 794 }}> {/* ~A4 width in px at 96dpi */}
                <div style={{ padding: 16, fontSize: 14, lineHeight: 1.4 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>GEA Sales Assistant</h2>
                  <div style={{ color: "#6b7280", marginBottom: 8 }}>AI-Powered Insights for Your TCO Comparison</div>
                  {project && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div><strong>Project:</strong> {project.projectName}</div>
                        <div><strong>Application:</strong> {project.application}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div><strong>Years:</strong> {years}</div>
                        <div><strong>Throughput/day:</strong> {throughputPerDay} L</div>
                      </div>
                    </div>
                  )}
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Top Pick: {bestKpis.name}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 8 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Total TCO</div>
                        <div style={{ fontWeight: 700 }}>{currency(bestKpis.totalSum)}</div>
                      </div>
                      <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 8 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Savings vs #2</div>
                        <div style={{ fontWeight: 700 }}>{currency(bestKpis.savingsVsNext)}</div>
                      </div>
                      <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 8 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Operating share</div>
                        <div style={{ fontWeight: 700 }}>{bestKpis.opSharePct}%</div>
                      </div>
                    </div>
                  </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 }}>
                    {/* Components table */}
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "#f3f4f6" }}>
                          <tr>
                            <th style={{ textAlign: "left", fontSize: 12, padding: "6px 8px" }}>Component</th>
                            <th style={{ textAlign: "right", fontSize: 12, padding: "6px 8px" }}>Amount</th>
                            <th style={{ textAlign: "right", fontSize: 12, padding: "6px 8px" }}>Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {([
                            ["Acquisition", bestKpis.totals.ca],
                            ["Commissioning", bestKpis.totals.cc],
                            ["Operating", bestKpis.totals.co],
                            ["Maintenance", bestKpis.totals.cm],
                          ] as const).map(([label, val]) => {
                            const pct = bestKpis.totalSum ? Math.round((val / bestKpis.totalSum) * 100) : 0;
                            return (
                              <tr key={label}>
                                <td style={{ padding: "6px 8px", fontSize: 12 }}>{label}</td>
                                <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>{currency(val)}</td>
                                <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Donut with legend (image for reliable PDF capture) */}
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Cost Distribution</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <img id="print-donut-img" style={{ width: "100%", maxWidth: 400, height: "auto" }} alt="Donut chart" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {([
                            { name: "Acquisition", value: bestKpis.totals.ca, color: "#2563eb" },
                            { name: "Commissioning", value: bestKpis.totals.cc, color: "#f59e0b" },
                            { name: "Operating", value: bestKpis.totals.co, color: "#10b981" },
                            { name: "Maintenance", value: bestKpis.totals.cm, color: "#ef4444" },
                          ]).map(d => {
                            const pct = bestKpis.totalSum ? Math.round((d.value / bestKpis.totalSum) * 100) : 0;
                            return (
                              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ width: 10, height: 10, background: d.color, display: "inline-block", borderRadius: 2 }} />
                                  <span style={{ fontSize: 12 }}>{d.name}</span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 12, fontWeight: 600 }}>{currency(d.value)}</div>
                                  <div style={{ fontSize: 11, color: "#6b7280" }}>{pct}%</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Insights JSON block */}
                  {insights && (
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginTop: 8 }}>
                      {(insights.title || insights.subtitle) && (
                        <div style={{ marginBottom: 8 }}>
                          {insights.title && <div style={{ fontWeight: 700 }}>{insights.title}</div>}
                          {insights.subtitle && <div style={{ color: "#6b7280" }}>{insights.subtitle}</div>}
                        </div>
                      )}
                      {Array.isArray(insights.highlights) && insights.highlights.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                          {insights.highlights.map((h, i) => (
                            <span key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 999, padding: "4px 8px", fontSize: 12 }}>{h}</span>
                          ))}
                        </div>
                      )}
                      {Array.isArray(insights.comparison) && insights.comparison.length > 0 && (
                        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "#f3f4f6" }}>
                              <tr>
                                <th style={{ textAlign: "left", fontSize: 12, padding: "6px 8px" }}>Machine</th>
                                <th style={{ textAlign: "right", fontSize: 12, padding: "6px 8px" }}>Total TCO</th>
                                <th style={{ textAlign: "right", fontSize: 12, padding: "6px 8px" }}>Operating</th>
                              </tr>
                            </thead>
                            <tbody>
                              {insights.comparison.map((row, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding: "6px 8px", fontSize: 12 }}>{row.name}</td>
                                  <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>{currency(row.totalTcoEur)}</td>
                                  <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>{typeof row.operatingCostEur === 'number' ? currency(row.operatingCostEur) : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {Array.isArray(insights.notes) && insights.notes.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>Notes</div>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {insights.notes.map((n, i) => (<li key={i} style={{ fontSize: 12 }}>{n}</li>))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt editor removed as requested */}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAssistantOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


