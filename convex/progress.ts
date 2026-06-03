import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export const progressValidator = v.object({
  solEarned: v.number(),
  notes: v.string(),
  completedMilestones: v.array(v.string()),
});

import {
  emptyMoveOutProgress,
  type MoveOutProgress,
} from "../lib/move-out-progress";

export type { MoveOutProgress };

const emptyProgress = emptyMoveOutProgress;

async function requireUserIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Sign in to save progress.");
  }
  return identity;
}

async function getProgressDoc(
  ctx: QueryCtx | MutationCtx,
  identity: { subject: string; tokenIdentifier: string },
) {
  const byIdentifier = await ctx.db
    .query("moveOutProgress")
    .withIndex("by_user_identifier", (q) =>
      q.eq("userIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (byIdentifier) return byIdentifier;

  return await ctx.db
    .query("moveOutProgress")
    .withIndex("by_user_subject", (q) => q.eq("userSubject", identity.subject))
    .unique();
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return emptyProgress();

    const doc = await getProgressDoc(ctx, identity);
    if (!doc) return emptyProgress();

    return {
      solEarned: doc.solEarned,
      notes: doc.notes,
      completedMilestones: doc.completedMilestones,
    };
  },
});

export const save = mutation({
  args: {
    progress: progressValidator,
  },
  handler: async (ctx, args) => {
    const identity = await requireUserIdentity(ctx);
    const existing = await getProgressDoc(ctx, identity);
    const payload = {
      userSubject: identity.subject,
      userIdentifier: identity.tokenIdentifier,
      solEarned: Math.max(0, args.progress.solEarned),
      notes: args.progress.notes.trim(),
      completedMilestones: args.progress.completedMilestones,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return;
    }

    await ctx.db.insert("moveOutProgress", payload);
  },
});
