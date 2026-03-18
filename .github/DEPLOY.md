# GitHub Actions Deploy Setup

## Required Secrets

Add these in **GitHub repo → Settings → Secrets and variables → Actions**.

### Client (Vercel)

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Vercel project settings → General → Project ID (or Team ID) |
| `VERCEL_PROJECT_ID` | Vercel project settings → General → Project ID |

**Also add in Vercel Dashboard → Project → Settings → Environment Variables:**
- `VITE_SUPABASE_URL` – Supabase Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` – Supabase anon key

### Server (Supabase)

| Secret | Where to get it |
|--------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | [Supabase Dashboard](https://supabase.com/dashboard/account/tokens) → Access Tokens |
| `SUPABASE_PROJECT_REF` | Project ref from URL: `https://supabase.com/dashboard/project/<ref>` (e.g. `fuptpriittbgnmzqehsa`) |
| `OPENAI_API_KEY` | [OpenAI API Keys](https://platform.openai.com/api-keys) – used by `extract-form-schema` Edge Function |

## Workflows

- **deploy-client.yml** – Builds Vite app and deploys to Vercel on push to `main`
- **deploy-server.yml** – Runs `supabase db push` and deploys edge functions on push to `main` (when `supabase/**` changes) or manual trigger

## First-time Setup

1. Create a Vercel project and connect your repo (or use `vercel link` locally)
2. Add all secrets above
3. Push to `main` or run workflows manually
