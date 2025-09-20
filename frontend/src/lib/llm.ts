export interface GenerateSalesSummaryParams {
  prompt: string;
  data: unknown;
}

export interface SalesInsightsMetrics {
  totalTcoEur: number;
  operatingSharePct: number;
  savingsVsSecondEur: number;
}

export interface SalesInsightsComparisonRow {
  name: string;
  totalTcoEur: number;
  operatingCostEur?: number;
}

export interface SalesInsights {
  title?: string;
  subtitle?: string;
  project?: { company?: string; contact?: string; application?: string; durationYears?: number };
  bestVariant?: string;
  metrics: SalesInsightsMetrics;
  highlights?: string[];
  comparison?: SalesInsightsComparisonRow[];
  notes?: string[];
}

/**
 * Calls OpenAI Chat Completions to generate a sales summary in Markdown.
 * Requires VITE_OPENAI_API_KEY to be set in the environment.
 * In production, prefer proxying via a backend to avoid exposing the key.
 */
export async function generateSalesSummary({ prompt, data }: GenerateSalesSummaryParams): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_OPENAI_API_KEY. Add it to your .env file.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(data) },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const json = await response.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");
  return content;
}

/**
 * Ask the LLM to return strictly JSON insights for rendering structured UI (no Markdown).
 */
export async function generateSalesInsights({ prompt, data }: GenerateSalesSummaryParams): Promise<SalesInsights> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_OPENAI_API_KEY. Add it to your .env file.");
  }

  const payload = {
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          `${prompt}\n\nReturn ONLY valid JSON matching this TypeScript type (no markdown):` +
          ` { title?: string; subtitle?: string; project?: { company?: string; contact?: string; application?: string; durationYears?: number };` +
          ` bestVariant?: string; metrics: { totalTcoEur: number; operatingSharePct: number; savingsVsSecondEur: number };` +
          ` highlights?: string[]; comparison?: Array<{ name: string; totalTcoEur: number; operatingCostEur?: number }>; notes?: string[] }`,
      },
      { role: "user", content: JSON.stringify(data) },
    ],
    temperature: 0.2,
  } as const;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const json = await response.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");
  try {
    return JSON.parse(content) as SalesInsights;
  } catch {
    // Fallback: try to extract JSON body
    const match = content.match(/\{[\s\S]*\}$/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse AI insights JSON");
  }
}


