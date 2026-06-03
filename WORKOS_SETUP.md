# WorkOS AuthKit setup (Move Out Quest)

Sign in saves your SOL earned, notes, and milestone checkboxes to Convex.

Official docs: [Convex + WorkOS AuthKit](https://docs.convex.dev/auth/authkit/)

---

## Path A — Convex-managed WorkOS (recommended)

Easiest if you do not already have a WorkOS app configured for this project.

1. **Install dependencies** (already done if you pulled latest):
   ```bash
   npm install
   ```

2. **Start dev** (interactive onboarding runs the first time):
   ```bash
   npm run dev
   ```

3. When prompted:
   - Choose **Yes** to create/use a **Convex-managed WorkOS team**
   - Complete WorkOS login if asked
   - Let Convex write `.env.local` (`WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI`, etc.)

4. **Cookie password** — if `WORKOS_COOKIE_PASSWORD` is missing, add to `.env.local` (32+ chars):
   ```bash
   openssl rand -base64 24
   ```
   ```env
   WORKOS_COOKIE_PASSWORD=paste_output_here
   ```

5. Open http://localhost:3000 → **Sign in** → complete WorkOS → you should return to `/callback` then home.

6. Edit **SOL earned / notes** → **Save progress**. Refresh the page; data should persist.

---

## Path B — Existing WorkOS account

Use this if you already have WorkOS AuthKit and want your own dashboard app.

1. In [WorkOS Dashboard](https://dashboard.workos.com/):
   - Create an application (or use existing)
   - **Redirect URI:** `http://localhost:3000/callback`
   - **Homepage / CORS:** `http://localhost:3000`
   - Copy **Client ID** (`client_…`) and **API Key** (`sk_test_…`)

2. Set Convex deployment env vars:
   ```bash
   npx convex env set WORKOS_CLIENT_ID client_your_id_here
   npx convex env set WORKOS_API_KEY sk_test_your_key_here
   ```

3. Create `.env.local`:
   ```env
   WORKOS_CLIENT_ID=client_your_id_here
   WORKOS_API_KEY=sk_test_your_api_key_here
   WORKOS_COOKIE_PASSWORD=at_least_32_characters_long_random_string
   NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```

4. Run:
   ```bash
   npx convex dev
   npm run dev
   ```

5. Sign in at http://localhost:3000 and test **Save progress**.

---

## Production (Vercel)

1. WorkOS **production** Client ID + `sk_live_…` API key  
2. Redirect URI: `https://your-domain.com/callback`  
3. Set the same variables in Vercel + Convex **production** deployment (`npx convex env set` while on prod)  
4. `convex.json` preview/prod blocks already target Vercel URLs when you deploy there.

---

## Troubleshooting

| Issue | Fix |
|--------|-----|
| Redirect mismatch | Redirect URI in WorkOS must **exactly** match `NEXT_PUBLIC_WORKOS_REDIRECT_URI` |
| “Sign in to save” | Finish sign-in; wait until Convex auth shows authenticated |
| Cookie errors | `WORKOS_COOKIE_PASSWORD` must be ≥ 32 characters |
| Wrong port | `convex.json` uses port **3000**; if Next runs elsewhere, update `convex.json` and re-run `npx convex dev` |

---

## What gets saved

Per signed-in user in Convex `moveOutProgress`:

- **SOL earned** (manual tracker toward your goal)
- **Notes**
- **Completed milestones** (checkboxes on line items)
