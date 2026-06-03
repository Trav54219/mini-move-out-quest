/** Native SOL mint for Jupiter Price API v3 */
export const SOL_MINT =
  "So11111111111111111111111111111111111111112";

export type FinancialLineItem = {
  id: string;
  label: string;
  usd: number;
  note?: string;
};

export type FinancialGroup = {
  id: string;
  label: string;
  items: FinancialLineItem[];
};

/** First task in the plan — shown at top of the list and default focus. */
export const DEFAULT_ACTIVE_TASK_ID = "gembot";

/** Fixed USD targets from your move-out / trading plan (post-tax cash). */
export const FINANCIAL_GROUPS: FinancialGroup[] = [
  {
    id: "move-out",
    label: "Move out & NC living",
    items: [
      {
        id: "gembot",
        label: "Gembot lifetime",
        usd: 1_800,
      },
      {
        id: "walk-out",
        label: "Walk out minimum",
        usd: 23_000,
        note: "3 mo @ $6k + $5k to mom",
      },
      {
        id: "full-nc",
        label: "Full NC plan",
        usd: 95_000,
        note: "15 mo @ $6k + $5k to mom (before leave)",
      },
      {
        id: "travel",
        label: "NY → Durham (one-way est.)",
        usd: 330,
      },
    ],
  },
  {
    id: "debts",
    label: "Debts",
    items: [
      { id: "student-loans", label: "Student loans", usd: 30_000 },
      { id: "klarna", label: "Klarna", usd: 4_000 },
      { id: "taxes-prior", label: "Taxes (prior year)", usd: 4_000 },
      { id: "nc-taxes", label: "NC taxes", usd: 350 },
      { id: "aunt", label: "Aunt (move help)", usd: 2_600 },
      { id: "mom-debt", label: "Mom (move help)", usd: 1_000 },
      { id: "fidelity", label: "Fidelity (old job)", usd: 2_500 },
    ],
  },
  {
    id: "income",
    label: "Trading full-time (annual)",
    items: [
      {
        id: "nc-living-year",
        label: "NC living @ $6k/mo",
        usd: 72_000,
        note: "After-tax, 12 months",
      },
    ],
  },
];

const debtsGroup = FINANCIAL_GROUPS.find((g) => g.id === "debts")!;
const moveOutGroup = FINANCIAL_GROUPS.find((g) => g.id === "move-out")!;

/** Debts + full NC plan + Gembot + travel (mom included in full NC plan). */
export const GRAND_TOTAL_USD =
  sumGroupItems(debtsGroup) +
  (moveOutGroup.items.find((i) => i.id === "full-nc")?.usd ?? 0) +
  (moveOutGroup.items.find((i) => i.id === "gembot")?.usd ?? 0) +
  (moveOutGroup.items.find((i) => i.id === "travel")?.usd ?? 0);

export function sumGroupItems(group: FinancialGroup): number {
  return group.items.reduce((sum, item) => sum + item.usd, 0);
}

export function findLineItem(id: string): FinancialLineItem | undefined {
  for (const group of FINANCIAL_GROUPS) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item;
  }
}

export function usdToSol(usd: number, solUsdPrice: number): number {
  if (solUsdPrice <= 0) return 0;
  return usd / solUsdPrice;
}

export function formatUsd(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}

export function formatSol(sol: number): string {
  if (sol >= 100) return sol.toFixed(2);
  if (sol >= 10) return sol.toFixed(3);
  return sol.toFixed(4);
}
