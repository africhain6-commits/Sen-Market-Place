# Sen Market

Plateforme d'annonces en ligne pour le Sénégal — similaire à Dubizzle/OLX, entièrement en français.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/sen-market run dev` — run the frontend (port 21293)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, shadcn/ui, Tailwind CSS
- API: Express 5 + express-session + bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — DB schema (users, listings, messages)
- `artifacts/api-server/src/routes/` — route handlers (auth, listings, messages, users)
- `artifacts/api-server/src/middlewares/auth.ts` — session auth middleware
- `artifacts/sen-market/src/` — React frontend
  - `src/hooks/use-auth.tsx` — AuthContext + useAuth hook
  - `src/pages/` — all pages
  - `src/components/navbar.tsx` — navigation

## Architecture decisions

- Session-based auth using express-session (cookie httpOnly, 7 days)
- Passwords hashed with bcryptjs (cost 10)
- All routes validated with Zod schemas generated from OpenAPI spec
- Frontend uses generated React Query hooks from @workspace/api-client-react
- Listings route `/listings/user/mine`, `/listings/stats`, `/listings/featured` defined BEFORE `/listings/:id` to avoid Express routing conflicts

## Product

- Page d'accueil avec hero search, 6 catégories, annonces vedettes
- Inscription/Connexion avec sessions persistantes
- Publier une annonce (titre, description, prix, catégorie, ville, photos)
- Liste des annonces avec filtres (catégorie, ville, prix min/max, recherche)
- Page détail d'une annonce avec messagerie
- Tableau de bord vendeur (mes annonces, mes messages)
- Profil utilisateur public

## User preferences

- Interface entièrement en français
- Couleurs : bleu marine (#0A2463) + blanc + touches dorées (#D4AF37)
- Mobile-friendly

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` to rebuild lib types
- After OpenAPI spec changes, run codegen then typecheck:libs before using updated hooks
- Static routes must be defined before parameterized routes (`/listings/featured` before `/listings/:id`)

## Comptes de démonstration

- amadou.diallo@gmail.com / password123
- fatou.sene@gmail.com / password123
- moussa.ndiaye@gmail.com / password123
- aissatou.ba@gmail.com / password123

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
