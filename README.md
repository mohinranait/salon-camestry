# Shear Chemistry Salon Suites

Pre-launch and grand-opening website with a full admin panel.

**Stack:** Next.js 16 (App Router) · TypeScript · shadcn/ui · Tailwind CSS 4 · MongoDB · Prisma 8 (`@prisma/orm-mongo`)

## Setup

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (MongoDB 8.0+), `AUTH_SECRET`, `SITE_URL` and the first admin account.
2. Install and prepare the database:

   ```bash
   pnpm install
   pnpm db:init      # creates collections, validators and indexes from src/prisma/contract.prisma
   pnpm dev
   ```

3. Sign in at `/admin` (the first admin comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` — run `pnpm seed` once if the account does not exist yet), open **Cloudinary** and save your cloud name, API key and API secret.
4. Load the sample content and images into Cloudinary with `pnpm seed --reset`.
5. Run it: `pnpm dev`, then open http://localhost:3000 and http://localhost:3000/admin.

`pnpm seed --reset` wipes site content (pages, media, collections, leads, bookings — not admin users) and seeds again.

## Data model

The data contract lives in `src/prisma/contract.prisma`. After editing it:

```bash
pnpm contract:emit   # regenerate contract.json / contract.d.ts
pnpm db:update       # apply to a development database
```

Schema changes need a database user that can run `collMod` (MongoDB Atlas: the *dbAdmin* role, or *Atlas admin*); a *readWrite*-only user can only create collections.

For production, plan and apply migrations with `pnpm prisma migration plan --name <slug>` and `pnpm prisma db migrate`.

## Media library

Files are uploaded to Cloudinary (credentials are managed in Admin → Cloudinary; the API secret is stored encrypted with `AUTH_SECRET`). Images are resized and converted to AVIF/WebP by Cloudinary through a custom `next/image` loader. Each item in the `media` collection keeps the Cloudinary `publicId`, `resourceType` and `url`. Every place that shows an image stores a `{ mediaId, alt }` reference, so one file can be reused with a different alt text in each spot. Replacing a file in the library updates it everywhere.

## Performance

- Public pages read the database through the Next.js data cache (`unstable_cache`, tag `site-content`), so a page view normally makes no database query. Every admin save expires the tag, so changes appear on the next view. Edits made directly in the database (for example `pnpm seed`) appear within an hour, or right away after restarting the server.
- The cache lives on the server. When running several server instances, configure a shared cache handler so they invalidate together.
- Collections are indexed for every list and lookup the site and admin run (see `@@index` in the contract).
- Images are resized and converted to AVIF/WebP by Cloudinary; the first section of each page renders without waiting for JavaScript.

## Launch phases

The dashboard has a one-click **Switch to Phase 2** button. Phase 2 unhides “Find a Beauty Pro” and “Book a Tour”, opens the booking calendar and changes every site-wide CTA to “Book a Tour”. Pages, sections, menu links and the announcement bar can each be limited to one phase.

## Email

Set the `SMTP_*` variables to send the VIP welcome email, tour confirmations and owner alerts. Without them, emails are skipped and logged; templates are edited in Admin → Settings → Emails.
