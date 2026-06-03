import { SOL_MINT } from "@/lib/financial-targets";

export const dynamic = "force-dynamic";

type JupiterPriceEntry = {
  usdPrice: number;
  priceChange24h?: number;
  blockId?: number;
  liquidity?: number;
};

type JupiterPriceResponse = Record<string, JupiterPriceEntry>;

export async function GET() {
  const apiKey = process.env.JUPITER_API_KEY;
  const headers: HeadersInit = apiKey ? { "x-api-key": apiKey } : {};

  const url = `https://api.jup.ag/price/v3?ids=${SOL_MINT}`;
  const res = await fetch(url, { headers, cache: "no-store" });

  if (!res.ok) {
    return Response.json(
      { error: `Jupiter API error: ${res.status}` },
      { status: res.status },
    );
  }

  const data = (await res.json()) as JupiterPriceResponse;
  const entry = data[SOL_MINT];

  if (!entry?.usdPrice) {
    return Response.json(
      { error: "SOL price not found in Jupiter response" },
      { status: 502 },
    );
  }

  return Response.json({
    mint: SOL_MINT,
    usdPrice: entry.usdPrice,
    priceChange24h: entry.priceChange24h ?? null,
    blockId: entry.blockId ?? null,
    liquidity: entry.liquidity ?? null,
    fetchedAt: new Date().toISOString(),
  });
}
