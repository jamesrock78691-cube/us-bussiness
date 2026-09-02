# US Business Database Dashboard

50-state US business search & export dashboard.

## Current Status (Step 1)

- ✅ Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- ✅ Dashboard UI (Overview, Search filters, States, Export, Sources, Settings)
- ✅ NextAuth (Credentials) + Prisma schema for User + Business
- ✅ Business model matches 19-column Excel template
- ⏳ PostgreSQL connection & data collectors (next)

## Project Structure

```
app/
  layout.tsx                 # Root layout + Providers
  page.tsx                   # Redirect → /login or /dashboard
  globals.css
  (auth)/login/page.tsx      # Login
  dashboard/
    layout.tsx               # Sidebar + Header (protected)
    page.tsx                 # Overview
    search/page.tsx
    states/page.tsx
    export/page.tsx
    sources/page.tsx
    settings/page.tsx
  api/auth/[...nextauth]/route.ts
components/                  # Sidebar, Header, Providers
lib/                         # prisma, auth, utils (states list)
prisma/
  schema.prisma
  seed.ts
types/
middleware.ts                # Protects /dashboard/*
```

## Quick Start

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env
# Edit DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 3. Database
npx prisma generate
npx prisma db push

# 4. Seed admin
npm run db:seed
# Login: admin@example.com / admin123

# 5. Run
npm run dev
```

Open http://localhost:3000 → redirects to login (or dashboard if already signed in).

## Business Model (19 fields)

Company Name, State, Entity Type, Entity Number, Status, Formation Date,  
Principal Address, City, ZIP, Registered Agent, Website, Business Email,  
Business Phone, Trademark Status, Trademark Match, Source, Source URL,  
Last Checked, Record ID

## Next Steps

1. Connect real PostgreSQL + indexes  
2. Wire Search page to Prisma queries + pagination  
3. Add state-by-state data collectors  
4. Export + Google Sheets sync  
5. Trademark matching & enrichment  
6. Scheduled updates + Vercel deploy  

## Notes

- Google Sheet is **not** the primary database — it is for reporting/sync only.
- Always respect official SOS terms and rate limits when collecting data.
- Change the default admin password immediately after first login.
