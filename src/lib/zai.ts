import ZAI from "z-ai-web-dev-sdk";

let _instance: Promise<ZAI> | null = null;

// Singleton ZAI client — backend only.
export async function zai(): Promise<ZAI> {
  if (!_instance) {
    _instance = ZAI.create();
  }
  return _instance;
}

export interface SearchResultItem {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
  favicon: string;
}

// Run a web search via the z-ai SDK function invocation.
export async function webSearch(
  query: string,
  num = 8,
): Promise<SearchResultItem[]> {
  try {
    const client = await zai();
    const res = await client.functions.invoke("web_search", { query, num });
    if (Array.isArray(res)) return res as SearchResultItem[];
    return [];
  } catch (err) {
    console.error("[webSearch] failed:", (err as Error)?.message);
    return [];
  }
}

// Run an LLM chat completion with a system prompt. Returns text.
export async function llmChat(
  prompt: string,
  opts: { system?: string; temperature?: number } = {},
): Promise<string> {
  try {
    const client = await zai();
    const messages = [];
    if (opts.system) {
      messages.push({ role: "assistant", content: opts.system });
    }
    messages.push({ role: "user", content: prompt });
    const res = await client.chat.completions.create({
      messages: messages as any,
      stream: false,
      thinking: { type: "disabled" },
    });
    return res.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[llmChat] failed:", (err as Error)?.message);
    return "";
  }
}

// Run an LLM completion and parse JSON from the response. Falls back to raw text.
export async function llmJson<T = unknown>(
  prompt: string,
  opts: { system?: string } = {},
): Promise<{ data: T | null; raw: string }> {
  const raw = await llmChat(prompt, opts);
  const data = safeJson<T>(raw);
  return { data, raw };
}

// Robust JSON extraction from LLM output (handles ```json fences & prose).
export function safeJson<T = unknown>(text: string): T | null {
  if (!text) return null;
  // strip code fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  // find first { or [ and last matching
  const start = candidate.search(/[{[]/);
  if (start === -1) return null;
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  const end = candidate.lastIndexOf(close);
  if (end <= start) return null;
  const slice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      return null;
    }
  }
}
