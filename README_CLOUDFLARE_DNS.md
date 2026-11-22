# Jazzy J's Barbershop & Salon — Cloudflare Pages Static Edge Bundle

## Email-Safe Custom Domain Cutover (RFC 1034 / MX Safe)
1. NEVER place a CNAME record on the root apex (`@`) at GoDaddy/Namecheap if `@yourdomain.com` uses MX business email (Google Workspace / Microsoft 365).
2. Recommended Option A (Cloudflare Pages + Cloudflare DNS): Add your custom domain in Cloudflare Pages—Cloudflare flattens apex routing at the edge while preserving all `MX`, `SPF`, and `DKIM` mail records.
3. Option B (External Registrar like GoDaddy): Point `www` `CNAME` -> `<project>.pages.dev` and use your registrar's domain forwarding (`@` -> `https://www.yourdomain.com`) so `@` `MX` mail is untouched.

## Deploy Command
`npx wrangler pages deploy . --project-name=jazzy-j`
