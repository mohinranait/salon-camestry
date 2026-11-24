# Shear Chemistry Salon Suites

Pre-launch and grand-opening website with a full admin panel.

**Stack:** Next.js 16 (App Router) · TypeScript · shadcn/ui · Tailwind CSS 4 · MongoDB · Prisma 8 (`@prisma/orm-mongo`)

## Setup

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (MongoDB 8.0+), `AUTH_SECRET`, `SITE_URL` and the first admin account.
2. Install and prepare the database:

   ```bash
   pnpm install
   pnpm db:init      # creates collections, validators and indexes from src/prisma/contract.prisma
   pnpm seed         # sample content, generated placeholder images and the admin account
   ```

3. Run it: `pnpm dev`, then open http://localhost:3000 and http://localhost:3000/admin.

`pnpm seed --reset` wipes site content (pages, media, collections, leads, bookings — not admin users) and seeds again.

## Data model

The data contract lives in `src/prisma/contract.prisma`. After editing it:

```bash
pnpm contract:emit   # regenerate contract.json / contract.d.ts
pnpm db:update       # apply to a development database
```

For production, plan and apply migrations with `pnpm prisma migration plan --name <slug>` and `pnpm prisma db migrate`.

## Media library

All files are stored in MongoDB GridFS (`media_files` bucket) and served from `/api/media/:fileId/:name`, so only the database is needed — no separate file storage. Every place that shows an image stores a `{ mediaId, alt }` reference, so one file can be reused with a different alt text in each spot. Replacing a file in the library updates it everywhere.

## Launch phases

The dashboard has a one-click **Switch to Phase 2** button. Phase 2 unhides “Find a Beauty Pro” and “Book a Tour”, opens the booking calendar and changes every site-wide CTA to “Book a Tour”. Pages, sections, menu links and the announcement bar can each be limited to one phase.

## Email

Set the `SMTP_*` variables to send the VIP welcome email, tour confirmations and owner alerts. Without them, emails are skipped and logged; templates are edited in Admin → Settings → Emails.
