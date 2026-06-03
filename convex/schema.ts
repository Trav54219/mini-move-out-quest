import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  moveOutProgress: defineTable({
    userSubject: v.string(),
    userIdentifier: v.optional(v.string()),
    solEarned: v.number(),
    notes: v.string(),
    completedMilestones: v.array(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user_identifier", ["userIdentifier"])
    .index("by_user_subject", ["userSubject"]),
});
