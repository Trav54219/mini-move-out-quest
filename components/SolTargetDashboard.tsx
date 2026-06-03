"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { api } from "@/convex/_generated/api";
import {
  DEFAULT_ACTIVE_TASK_ID,
  FINANCIAL_GROUPS,
  GRAND_TOTAL_USD,
  findLineItem,
  formatSol,
  formatUsd,
  usdToSol,
} from "@/lib/financial-targets";
import {
  loadLocalProgress,
  saveLocalProgress,
} from "@/lib/local-progress-storage";
import {
  emptyMoveOutProgress,
  type MoveOutProgress,
} from "@/lib/move-out-progress";

const POLL_MS = 5_000;
const WALK_OUT_USD = 23_000;
const DEBTS_USD = 44_450;

type SolPricePayload = {
  usdPrice: number;
  priceChange24h: number | null;
  fetchedAt: string;
};

function Stat({
  label,
  value,
  hint,
  valueClass = "",
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${valueClass}`}>{value}</span>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </div>
  );
}

function AuthCard() {
  const { user, signOut } = useAuth();
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="auth-card">
      <div className="auth-title">Account</div>
      {isLoading ? (
        <p>Checking session…</p>
      ) : isAuthenticated && user ? (
        <>
          <p>
            Signed in as{" "}
            <strong>{user.email ?? user.firstName ?? "you"}</strong>
          </p>
          <p>Progress syncs to Convex.</p>
          <div className="auth-actions">
            <button
              className="auth-btn secondary"
              type="button"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>
        </>
      ) : (
        <>
          <p>Sign in to save SOL earned, notes, and milestones.</p>
          <div className="auth-actions">
            <Link className="auth-btn" href="/sign-in">
              Sign in
            </Link>
            <Link className="auth-btn secondary" href="/sign-up">
              Sign up
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function CurrentTaskPanel({
  activeTaskId,
  solEarned,
  solPrice,
  loading,
  hasPrice,
  completed,
}: {
  activeTaskId: string;
  solEarned: number;
  solPrice: number;
  loading: boolean;
  hasPrice: boolean;
  completed: boolean;
}) {
  const item =
    findLineItem(activeTaskId) ?? findLineItem(DEFAULT_ACTIVE_TASK_ID);
  if (!item) return null;

  const taskSol = usdToSol(item.usd, solPrice);
  const remaining = completed ? 0 : Math.max(0, taskSol - solEarned);
  const taskPct =
    taskSol > 0 && !completed
      ? Math.min(100, (solEarned / taskSol) * 100)
      : completed
        ? 100
        : 0;

  return (
    <section className="current-task-panel" aria-labelledby="current-task-heading">
      <div className="tracker-top">
        <div>
          <div className="tracker-title" id="current-task-heading">
            Working on
          </div>
          <div className="current-task-name">{item.label}</div>
          <div className="tracker-count current-task-sol">
            {loading && !hasPrice
              ? "—"
              : completed
                ? "Done"
                : `${formatSol(remaining)} SOL left`}
          </div>
          <div className="tracker-sub">
            {completed ? (
              <>Marked complete · {formatUsd(item.usd)}</>
            ) : (
              <>
                {loading && !hasPrice ? "—" : formatSol(taskSol)} SOL to finish
                {" · "}
                {formatUsd(item.usd)} fixed
                {solEarned > 0 && hasPrice ? (
                  <>
                    {" · "}
                    {formatSol(solEarned)} SOL banked (
                    {taskPct.toFixed(0)}% of this task)
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
      {!completed ? (
        <div className="main-track current-task-track" aria-hidden>
          <div className="main-fill" style={{ width: `${taskPct}%` }} />
        </div>
      ) : null}
    </section>
  );
}

function ProgressPanel({
  solPrice,
  grandTotalSol,
  draft,
  setDraft,
  remoteLoading,
}: {
  solPrice: number;
  grandTotalSol: number;
  draft: MoveOutProgress;
  setDraft: React.Dispatch<React.SetStateAction<MoveOutProgress>>;
  remoteLoading: boolean;
}) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const saveProgress = useMutation(api.progress.save);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const pct =
    grandTotalSol > 0
      ? Math.min(100, (draft.solEarned / grandTotalSol) * 100)
      : 0;

  const onSave = async () => {
    setSaveState("saving");
    try {
      await saveProgress({ progress: draft });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  };

  if (authLoading) {
    return (
      <section className="progress-panel">
        <div className="tracker-title">Your progress</div>
        <p className="subtitle" style={{ marginTop: 8 }}>
          Loading auth…
        </p>
      </section>
    );
  }

  return (
    <section className="progress-panel">
      <div className="tracker-top">
        <div>
          <div className="tracker-title">Your progress</div>
          <div className="tracker-count" style={{ fontSize: 28 }}>
            {formatSol(draft.solEarned)} SOL
          </div>
          <div className="tracker-sub">
            {pct.toFixed(1)}% of {formatSol(grandTotalSol)} SOL goal
            {solPrice > 0
              ? ` · ≈ ${formatUsd(draft.solEarned * solPrice)}`
              : null}
          </div>
        </div>
        <Authenticated>
          <button className="auth-btn" type="button" onClick={() => void onSave()}>
            Save progress
          </button>
        </Authenticated>
      </div>

      <div className="main-track" aria-hidden>
        <div className="main-fill" style={{ width: `${pct}%` }} />
      </div>

      <Unauthenticated>
        <p className="subtitle" style={{ marginTop: 12 }}>
          <Link href="/sign-in" style={{ color: "var(--green)" }}>
            Sign in
          </Link>{" "}
          to save progress across devices.
        </p>
      </Unauthenticated>

      {remoteLoading ? (
        <p className="save-status">Loading saved progress…</p>
      ) : (
        <div className="progress-grid">
          <div className="progress-field">
            <label>
              SOL earned (current task)
              <input
                type="number"
                min={0}
                step="any"
                value={draft.solEarned === 0 ? "" : draft.solEarned}
                placeholder="0"
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    solEarned: Number(e.target.value) || 0,
                  }))
                }
              />
            </label>
          </div>
          <Authenticated>
            <div className="progress-field">
              <label>
                Notes
                <textarea
                  value={draft.notes}
                  placeholder="Plan notes, next steps…"
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </label>
            </div>
          </Authenticated>
        </div>
      )}
      <Authenticated>
        <p
          className={`save-status ${saveState === "saved" ? "ok" : ""}`}
          aria-live="polite"
        >
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved to your account."
              : saveState === "error"
                ? "Save failed — try again."
                : "Use the dot column to pick your current task; checkboxes save automatically."}
        </p>
      </Authenticated>
      <Unauthenticated>
        <p className="save-status">SOL earned saves on this browser.</p>
      </Unauthenticated>
    </section>
  );
}

export function SolTargetDashboard() {
  const [price, setPrice] = useState<SolPricePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { isAuthenticated } = useConvexAuth();
  const remote = useQuery(api.progress.get, isAuthenticated ? {} : "skip");
  const saveProgress = useMutation(api.progress.save);
  const [draft, setDraft] = useState<MoveOutProgress>(emptyMoveOutProgress());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setDraft(loadLocalProgress());
      setHydrated(true);
      return;
    }
    if (remote === undefined) return;
    const local = loadLocalProgress();
    const merged =
      remote.completedMilestones.length === 0 &&
      local.completedMilestones.length > 0
        ? { ...remote, completedMilestones: local.completedMilestones }
        : remote;
    setDraft(merged);
    setHydrated(true);
    if (
      merged.completedMilestones.length > remote.completedMilestones.length
    ) {
      void saveProgress({ progress: merged });
    }
  }, [isAuthenticated, remote, saveProgress]);

  useEffect(() => {
    if (!hydrated || isAuthenticated) return;
    saveLocalProgress(draft);
  }, [draft, hydrated, isAuthenticated]);

  const persistProgress = useCallback(
    (next: MoveOutProgress) => {
      if (!isAuthenticated) {
        saveLocalProgress(next);
        return;
      }
      void saveProgress({ progress: next });
    },
    [isAuthenticated, saveProgress],
  );

  const toggleMilestone = (id: string) => {
    setDraft((prev) => {
      const has = prev.completedMilestones.includes(id);
      const next = {
        ...prev,
        completedMilestones: has
          ? prev.completedMilestones.filter((m) => m !== id)
          : [...prev.completedMilestones, id],
      };
      persistProgress(next);
      return next;
    });
  };

  const setActiveTask = (id: string) => {
    setDraft((prev) => {
      if (prev.activeTaskId === id) return prev;
      const next = { ...prev, activeTaskId: id };
      persistProgress(next);
      return next;
    });
  };

  const completedSet = useMemo(
    () => new Set(draft.completedMilestones),
    [draft.completedMilestones],
  );

  const activeTaskCompleted = completedSet.has(draft.activeTaskId);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch("/api/sol-price", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setPrice({
        usdPrice: data.usdPrice,
        priceChange24h: data.priceChange24h,
        fetchedAt: data.fetchedAt,
      });
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch price");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrice();
    const id = setInterval(() => void fetchPrice(), POLL_MS);
    return () => clearInterval(id);
  }, [fetchPrice]);

  const solPrice = price?.usdPrice ?? 0;
  const grandTotalSol = usdToSol(GRAND_TOTAL_USD, solPrice);
  const walkOutSol = usdToSol(WALK_OUT_USD, solPrice);
  const change24h = price?.priceChange24h;

  const priceLabel = useMemo(() => {
    if (loading && !price) return "Loading…";
    if (error) return "Unavailable";
    return `$${solPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  }, [error, loading, price, solPrice]);

  const changeLabel =
    change24h != null
      ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}% (24h)`
      : undefined;

  return (
    <div className="tracker-app">
      <header className="header">
        <div className="logo-line">
          <div className="dot" />
          <span className="logo-text">Move Out Quest · Jupiter live</span>
        </div>
        <div className="header-main">
          <div>
            <h1>
              Earn{" "}
              <span>{loading && !price ? "—" : formatSol(grandTotalSol)} SOL</span>
            </h1>
            <p className="subtitle">
              Fixed USD targets · dynamic SOL from live price · post-tax planning
              numbers
            </p>
          </div>
          <AuthCard />
        </div>

        <div className="summary-row">
          <Stat
            label="Live SOL"
            value={priceLabel}
            hint={
              changeLabel ??
              (lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Jupiter Price API v3")
            }
          />
          <Stat label="Total USD goal" value={formatUsd(GRAND_TOTAL_USD)} />
          <Stat
            label="Total SOL goal"
            value={loading && !price ? "—" : formatSol(grandTotalSol)}
            hint="Debts + NC plan + Gembot + travel"
          />
          <Stat
            label="Walk out min"
            value={loading && !price ? "—" : formatSol(walkOutSol)}
            hint={formatUsd(WALK_OUT_USD)}
          />
          <Stat
            label="Debts"
            value={
              loading && !price ? "—" : formatSol(usdToSol(DEBTS_USD, solPrice))
            }
            hint={formatUsd(DEBTS_USD)}
            valueClass="muted-value"
          />
        </div>
      </header>

      <ProgressPanel
        solPrice={solPrice}
        grandTotalSol={grandTotalSol}
        draft={draft}
        setDraft={setDraft}
        remoteLoading={isAuthenticated && !hydrated}
      />

      <CurrentTaskPanel
        activeTaskId={draft.activeTaskId}
        solEarned={draft.solEarned}
        solPrice={solPrice}
        loading={loading}
        hasPrice={!!price}
        completed={activeTaskCompleted}
      />

      <section className="tracker">
        <div className="tracker-top">
          <div>
            <div className="tracker-title">Total SOL to earn</div>
            <div className="tracker-count">
              {loading && !price ? "—" : formatSol(grandTotalSol)}{" "}
              <span style={{ fontSize: "0.45em", fontWeight: 500 }}>SOL</span>
            </div>
            <div className="tracker-sub">
              {formatUsd(GRAND_TOTAL_USD)} fixed · refreshes every {POLL_MS / 1000}
              s
            </div>
          </div>
          <div
            className={`live-badge ${error ? "error" : ""}`}
            aria-live="polite"
          >
            <div className="dot" />
            {error ? <strong>Price error</strong> : <strong>Live</strong>}
            <span>{error ?? "Jupiter API"}</span>
          </div>
        </div>

        <div className="main-track" aria-hidden>
          <div
            className="main-fill"
            style={{ width: solPrice > 0 ? "100%" : "0%" }}
          />
        </div>

        <div className="pace-card">
          <div>
            <div className="completion-label">Walk-out minimum</div>
            <strong>
              {loading && !price ? "—" : formatSol(walkOutSol)} SOL
            </strong>
          </div>
          <p>
            {formatUsd(WALK_OUT_USD)} — 3 months NC @ $6k/mo plus $5k to mom
            before you leave. Full independence stack is{" "}
            {formatUsd(GRAND_TOTAL_USD)} (
            {loading && !price ? "—" : `${formatSol(grandTotalSol)} SOL`} at
            current price).
          </p>
        </div>
      </section>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }} aria-label="Done" />
              <th style={{ width: 44 }} aria-label="Working on" />
              <th>Target</th>
              <th>SOL needed</th>
              <th>USD (fixed)</th>
            </tr>
          </thead>
          <tbody>
            {FINANCIAL_GROUPS.map((group) => (
              <Fragment key={group.id}>
                <tr className="phase-divider">
                  <td colSpan={5}>{group.label}</td>
                </tr>
                {group.items.map((item) => {
                  const sol = usdToSol(item.usd, solPrice);
                  const done = completedSet.has(item.id);
                  const active = draft.activeTaskId === item.id;
                  const rowClass = [
                    done ? "row-done" : "",
                    active ? "row-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr key={item.id} className={rowClass || undefined}>
                      <td>
                        <label className="milestone-cb" title="Mark done">
                          <input
                            type="checkbox"
                            checked={done}
                            aria-label={`${item.label} done`}
                            onChange={() => toggleMilestone(item.id)}
                          />
                        </label>
                      </td>
                      <td>
                        <label
                          className="focus-task"
                          title="Set as task you're working on"
                        >
                          <input
                            type="radio"
                            name="active-task"
                            checked={active}
                            aria-label={`Working on ${item.label}`}
                            onChange={() => setActiveTask(item.id)}
                          />
                        </label>
                      </td>
                      <td>
                        {item.label}
                        {item.note ? (
                          <span className="item-note">{item.note}</span>
                        ) : null}
                      </td>
                      <td>
                        <span className="sol-amount">
                          {loading && !price ? "—" : formatSol(sol)}
                        </span>
                      </td>
                      <td>
                        <span className="usd-equivalent">
                          {formatUsd(item.usd)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {group.id === "debts" ? (
                  <tr key="debts-subtotal">
                    <td />
                    <td />
                    <td>
                      <strong>Subtotal</strong>
                    </td>
                    <td>
                      <span className="sol-amount">
                        {loading && !price
                          ? "—"
                          : formatSol(usdToSol(DEBTS_USD, solPrice))}
                      </span>
                    </td>
                    <td>
                      <span className="usd-equivalent">
                        {formatUsd(DEBTS_USD)}
                      </span>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="sync-debug">
        {!isAuthenticated ? (
          <>
            Task focus and checkboxes save on this browser.{" "}
            <Link href="/sign-in" style={{ color: "var(--green)" }}>
              Sign in
            </Link>{" "}
            to sync across devices. ·{" "}
          </>
        ) : null}
        SOL/USD via{" "}
        <a
          href="https://dev.jup.ag/docs/price"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jupiter Price API v3
        </a>
        {lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : null}
      </p>
    </div>
  );
}
