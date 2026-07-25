import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

let _instance: Promise<ZAI> | null = null;

// Singleton ZAI client — backend only.
// Supports both file-based config (sandbox) and env-var config (Vercel).
export async function zai(): Promise<ZAI> {
  if (!_instance) {
    _instance = createZAI();
  }
  return _instance;
}

async function createZAI(): Promise<ZAI> {
  // Try file-based config first (works in sandbox)
  try {
    return await ZAI.create();
  } catch {
    // Fall back to env-var config (for Vercel/serverless)
    const baseUrl = process.env.ZAI_BASE_URL;
    const apiKey = process.env.ZAI_API_KEY;
    if (baseUrl && apiKey) {
      const config = {
        baseUrl,
        apiKey,
        chatId: process.env.ZAI_CHAT_ID || "",
        token: process.env.ZAI_TOKEN || "",
        userId: process.env.ZAI_USER_ID || "",
      };
      // Write a temp config file so the SDK's internal methods also find it
      const configPath = path.join(process.cwd(), ".z-ai-config");
      try { fs.writeFileSync(configPath, JSON.stringify(config)); } catch { /* may be read-only on Vercel */ }
      return new ZAI(config) as unknown as ZAI;
    }
    throw new Error("ZAI SDK not configured. Set ZAI_BASE_URL and ZAI_API_KEY env vars, or create .z-ai-config file.");
  }
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

// ── Page Reader: extract clean content from any URL (YouTube pages, Reddit threads, articles) ──
export interface PageContent {
  title: string;
  html: string;
  text: string; // html stripped of tags
  publishedTime?: string;
  url: string;
}

export async function readPage(url: string): Promise<PageContent | null> {
  try {
    const client = await zai();
    const res: any = await client.functions.invoke("page_reader", { url });
    const data = res?.data;
    if (!data) return null;
    const html: string = data.html ?? "";
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    return {
      title: data.title ?? "",
      html,
      text: text.slice(0, 8000), // cap to keep LLM prompts manageable
      publishedTime: data.publishedTime,
      url: data.url ?? url,
    };
  } catch (err) {
    console.error("[readPage] failed:", (err as Error)?.message);
    return null;
  }
}

// ── Vision Language Model: analyze images (thumbnail analysis, etc.) ──
export async function visionChat(prompt: string, imageUrl: string): Promise<string> {
  try {
    const client = await zai();
    const messages: any[] = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ];
    const res = await client.chat.completions.create({
      messages,
      stream: false,
      thinking: { type: "disabled" },
    } as any);
    return res.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[visionChat] failed:", (err as Error)?.message);
    return "";
  }
}

// ── Image Generation: produce AI images (thumbnail concepts, assets) ──
export async function generateImage(
  prompt: string,
  size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024",
): Promise<string | null> {
  try {
    const client = await zai();
    const res = await client.images.generations.create({
      prompt,
      size,
    } as any);
    const b64 = res.data?.[0]?.base64;
    if (!b64) return null;
    return `data:image/png;base64,${b64}`;
  } catch (err) {
    console.error("[generateImage] failed:", (err as Error)?.message);
    return null;
  }
}

// Run multiple web searches in parallel and merge results.
export async function multiWebSearch(
  queries: string[],
  num = 6,
): Promise<{ query: string; results: SearchResultItem[] }[]> {
  const settled = await Promise.all(
    queries.map(async (q) => ({ query: q, results: await webSearch(q, num) })),
  );
  return settled;
}

