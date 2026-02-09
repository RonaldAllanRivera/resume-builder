# Resume + Portfolio CMS

TypeScript-first resume + portfolio CMS built as a single Next.js app with an embedded Payload admin.

## Overview

This project is a practical, production-style implementation of a content-driven personal site:

- Resume + portfolio content managed in a CMS
- Public site rendered with SEO-friendly patterns
- Minimal role-based access control for multi-user editing

It is based on the Payload Website Template (Payload + Next.js in a single app) and has been extended with a resume/portfolio data model.

## Key features

- Structured resume data model (separate collections for SEO-friendly querying)
- Job Ads + AI-assisted generation workflow (tailored resume + application letter)
- CMS-managed AI prompt templates + model defaults (versioned)
- Draft/publish workflow for content
- Minimal RBAC (`admin`, `editor`) for the CMS
- Private-by-default personal fields with explicit publish toggles

## Tech stack

- Next.js (App Router)
- Payload CMS
- TypeScript
- PostgreSQL (local via Docker; production via managed Postgres)

## Architecture

- Single repo and single deployment target
- Next.js serves:
  - Public site
  - Payload Admin (`/admin`) and API routes

## This repo (start here)

- Quick start: see [Quick start (this repo)](#quick-start-this-repo)
- Common workflows:
  - Reset local DB volume: see [Full database reset (hard reset)](#troubleshooting)
  - Migrate local Docker data to online Postgres: see [Migrating local Docker data to online PostgreSQL](#migrating-local-docker-data-to-online-postgresql)
  - Admin utility: delete document versions: see [Delete versions menu item](#troubleshooting)

## Routes

### Public site routes

- `/`
  - Renders the `pages` collection entry with slug `home`.
- `/[slug]`
  - Renders any published entry in the `pages` collection.
  - Uses `generateStaticParams` to statically generate published pages.
  - Uses `generateMetadata` (via the SEO plugin fields on Pages).
- `/posts`
  - Lists published `posts`.
- `/posts/[slug]`
  - Renders a published `post`.
- `/search`
  - Searches the `search` index (Payload search plugin).
- `/admin`
  - Payload Admin UI.

### Internal (admin/editor) utility routes

- `POST /next/generate-drafts`
  - Generates a tailored `resumeDraft` and `applicationLetter` for a Generation record.
  - Uses OpenAI + prompt templates stored in `Globals → AI Generation Settings`.
  - Enforces “database facts only” and stores metadata (`promptVersion`, `model`, `temperature`, `inputHash`).
- `GET /next/generations/[id]/pdf?type=resume|letter`
  - Returns a PDF download for either the resume draft or application letter for a Generation record.
  - PDF generation is implemented with `pdf-lib` to avoid runtime font-metric file issues (`Helvetica.afm`) seen with `pdfkit` when bundled.
- `POST /next/seed-resume`
  - Admin-only endpoint to seed resume collections from `resume.txt`.
- `POST /next/delete-versions`
  - Admin-only endpoint to delete stored versions for a single document.
- `POST /next/backfill-generations-company`
  - Admin-only endpoint to populate `generations.company` from `jobAd.company` for existing records.
  - Supports batching, caching, and dry-run mode.
- `POST /next/backfill-jobads-displaytitle`
  - Admin-only endpoint to populate `jobAds.displayTitle` (used by relationship dropdown labels) for existing records.
  - Useful after introducing `displayTitle`/company-first labels for Job Ads.

## Data model (Payload)

- **Globals**
  - `siteSettings`
    - Site name + default SEO fields + social links.
  - `resumeProfile`
    - Resume identity + summary + contact fields.
    - Private-by-default enforcement:
      - `email`, `phone`, `address`, `dateOfBirth` are only publicly readable if their matching `publish*` toggle is enabled.
  - `coverLetterSettings`
    - Default greeting/header/footer templates used for application letters.
  - `aiGenerationSettings`
    - Default OpenAI config + prompt templates:
      - `promptVersion`, `model`, `temperature`, `systemPrompt`, `resumePrompt`, `experienceRewritePrompt`, `coverLetterStyle`, `coverLetterPrompt`
    - Includes in-admin help:
      - Collapsible shortcode reference (hidden by default)
      - Collapsible explanations for `promptVersion`, `model`, and `temperature`
    - Experience templating notes:
      - Current experiences can be rendered as pre-formatted blocks and inserted verbatim into the resume prompt.
      - Optional AI rewrite step (configured via `experienceRewritePrompt`) can tailor role titles and highlight bullets to the job ad while keeping company + dates locked.

- **Collections**
  - `experiences`
  - `educations`
  - `projects`
    - `slug` is a plain `text` field and is auto-generated from `title` on save when empty.
    - This avoids reliance on the experimental slug UI component that requires server functions context.
  - `certifications`
  - `resumeProfiles`
    - Optional focus/notes used to steer generation (not the canonical resume facts).
  - `companies`
  - `jobAds`
  - `generations`
    - Stores `resumeDraft` + `applicationLetter` and prompt metadata for a specific job ad/profile.
    - Includes `company` relationship field (read-only) that auto-syncs from `jobAd.company`.
    - Company field is non-updatable (`access.update: () => false`) and enforced via hooks.
  - `media` (uploads)
  - `users` (auth)
    - Minimal RBAC via a `roles` field (`admin`, `editor`).
    - Editors can manage resume/portfolio content.
    - Only admins can manage users/roles.

## Developer workflow

- Install deps: `npm ci`
- Run dev: `npm run dev`
- Seed resume data:
  - CLI: `npm run seed:resume`
  - Admin UI: open `/admin` and click “Seed resume data” (admin-only)
- After schema changes:
  - `npm run generate:types`
  - `npx tsc --noEmit`

- After adding or changing Payload admin components:
  - `npm run generate:importmap`

- **Generations admin UX helpers**
  - On a Generation edit page, copy buttons are available for quick exporting:
    - `resumeDraft`: copy as plain text or markdown.
    - `applicationLetter`: copy as plain text.
  - PDF downloads are available on the same edit view for:
    - `resumeDraft` (download as PDF)
    - `applicationLetter` (download as PDF)
  - Note: application letters are cleaned to avoid a leading `Header:` label when saving generated output.
  - Company field displays the associated company name (read-only, auto-synced from jobAd).
  - On the Generations create view:
    - Job Ad dropdown labels show `Company – Title`.
    - Job Ads and Resume Profiles are sorted by most recently created.

## Troubleshooting

- **Admin crashes on Projects create/edit**
  - If you see `useServerFunctions must be used within a ServerFunctionsProvider`, ensure the `projects` collection is using the plain `slug` text field (not the experimental slug UI field) and restart `npm run dev`.

- **Delete versions menu item**
  - An admin-only “Delete versions…” action appears in the 3‑dot edit menu on versioned collections.
  - It safely deletes all stored versions for the current document only.
  - If you don’t see it, ensure you’re logged in as an admin and the document has versions.

- **Full database reset (hard reset)**
  - Stop and remove the Docker volume, then start Postgres again:
    ```bash
    docker compose down -v
    docker compose up -d postgres
    ```
  - Re-seed demo data (optional):
    ```bash
    curl -X POST http://localhost:3000/next/seed -H "Content-Type: application/json"
    ```
  - Use this when you want a completely clean database or after schema changes that require a fresh start.

## Quick start (this repo)

### Prerequisites

- Node.js (see `package.json` engines)
- Docker Desktop (for local PostgreSQL)

### Local development

1. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Run the app:

   ```bash
   npm run dev
   ```

4. Open:

   - `http://localhost:3000` (frontend)
   - `http://localhost:3000/admin` (Payload admin)

### Environment variables

- Local development uses `.env` (gitignored) and `.env.example` as a template.
- For Vercel deployments, set secrets in Vercel Project Environment Variables.

Required integrations (later phases):

- `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
- `OPENAI_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
- `GOOGLE_DRIVE_FOLDER_ID`

### Migrating local Docker data to online PostgreSQL

You can easily export your local Docker PostgreSQL data to an online PostgreSQL (e.g., Neon, Vercel Postgres, AWS RDS).

#### Option 1: Payload backup/restore (recommended)
- From local: Use Payload’s admin or a script to dump each collection/globals to JSON
- To online: Run a one-time import script that creates docs via Payload API
- Pros: Keeps access control, versions, and hooks intact. No raw SQL.

#### Option 2: pg_dump + psql (fastest)
```bash
# From local Docker
docker exec -i resume-builder-postgres-1 pg_dump -U postgres your_db_name > local-backup.sql

# To online (after creating the DB)
psql "postgresql://user:pass@host/dbname" < local-backup.sql
```
- Pros: One command, preserves all tables
- Cons: Bypasses Payload hooks; you may need to run `payload generate:types` and ensure sequences match

Choose Option 1 if you only added data via Payload. Choose Option 2 for zero friction if you don’t mind raw DB copy.

## Template reference (Payload Website Template)

The sections below are the upstream template documentation kept for reference.

This is the official [Payload Website Template](https://github.com/payloadcms/payload/blob/main/templates/website). Use it to power websites, blogs, or portfolios from small to enterprise. This repo includes a fully-working backend, enterprise-grade admin panel, and a beautifully designed, production-ready website.

This template is right for you if you are working on:

- A personal or enterprise-grade website, blog, or portfolio
- A content publishing platform with a fully featured publication workflow
- Exploring the capabilities of Payload

Core features:

- [Pre-configured Payload Config](#how-it-works)
- [Authentication](#users-authentication)
- [Access Control](#access-control)
- [Layout Builder](#layout-builder)
- [Draft Preview](#draft-preview)
- [Live Preview](#live-preview)
- [On-demand Revalidation](#on-demand-revalidation)
- [SEO](#seo)
- [Search](#search)
- [Redirects](#redirects)
- [Jobs and Scheduled Publishing](#jobs-and-scheduled-publish)
- [Website](#website)

## Quick Start

To spin up this example locally, follow these steps:

### Clone

If you have not done so already, you need to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

Use the `create-payload-app` CLI to clone this template directly to your machine:

```bash
npx create-payload-app@latest my-project -t website
```

### Development

1. First [clone the repo](#clone) if you have not done so already
1. `cd my-project && cp .env.example .env` to copy the example environment variables
1. `npm ci && npm run dev` to install dependencies and start the dev server
1. open `http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel and unpublished content. See [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Posts

  Posts are used to generate blog posts, news articles, or any other type of content that is published over time. All posts are layout builder enabled so you can generate unique layouts for each post using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Posts are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Pages

  All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Pages are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Media

  This is the uploads enabled collection used by pages, posts, and projects to contain media like images, videos, downloads, and other assets. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

- #### Categories

  A taxonomy used to group posts together. Categories can be nested inside of one another, for example "News > Technology". See the official [Payload Nested Docs Plugin](https://payloadcms.com/docs/plugins/nested-docs) for more details.

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end like nav links.

- `Footer`

  Same as above but for the footer of your site.

## Access control

Basic access control is setup to limit access to various content based based on publishing status.

- `users`: Users can access the admin panel and create or edit content.
- `posts`: Everyone can access published posts, but only users can create, update, or delete them.
- `pages`: Everyone can access published pages, but only users can create, update, or delete them.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Layout Builder

Create unique page layouts for any type of content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- Hero
- Content
- Media
- Call To Action
- Archive

Each block is fully designed and built into the front-end website that comes with this template. See [Website](#website) for more details.

## Lexical editor

A deep editorial experience that allows complete freedom to focus just on writing content without breaking out of the flow with support for Payload blocks, media, links and other features provided out of the box. See [Lexical](https://payloadcms.com/docs/rich-text/overview) docs.

## Draft Preview

All posts and pages are draft-enabled so you can preview them before publishing them to your website. To do this, these collections use [Versions](https://payloadcms.com/docs/configuration/collections#versions) with `drafts` set to `true`. This means that when you create a new post, project, or page, it will be saved as a draft and will not be visible on your website until you publish it. This also means that you can preview your draft before publishing it to your website. To do this, we automatically format a custom URL which redirects to your front-end to securely fetch the draft version of your content.

Since the front-end of this template is statically generated, this also means that pages, posts, and projects will need to be regenerated as changes are made to published documents. To do this, we use an `afterChange` hook to regenerate the front-end when a document has changed and its `_status` is `published`.

For more details on how to extend this functionality, see the official [Draft Preview Example](https://github.com/payloadcms/payload/tree/examples/draft-preview).

## Live preview

In addition to draft previews you can also enable live preview to view your end resulting page as you're editing content with full support for SSR rendering. See [Live preview docs](https://payloadcms.com/docs/live-preview/overview) for more details.

## On-demand Revalidation

We've added hooks to collections and globals so that all of your pages, posts, footer, or header changes will automatically be updated in the frontend via on-demand revalidation supported by Nextjs.

> Note: if an image has been changed, for example it's been cropped, you will need to republish the page it's used on in order to be able to revalidate the Nextjs image cache.

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo) for complete SEO control from the admin panel. All SEO data is fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Search

This template also pre-configured with the official [Payload Search Plugin](https://payloadcms.com/docs/plugins/search) to showcase how SSR search features can easily be implemented into Next.js with Payload. See [Website](#website) for more details.

## Redirects

If you are migrating an existing site or moving content to a new URL, you can use the `redirects` collection to create a proper redirect from old URLs to new ones. This will ensure that proper request status codes are returned to search engines and that your users are not left with a broken link. This template comes pre-configured with the official [Payload Redirects Plugin](https://payloadcms.com/docs/plugins/redirects) for complete redirect control from the admin panel. All redirects are fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Jobs and Scheduled Publish

We have configured [Scheduled Publish](https://payloadcms.com/docs/versions/drafts#scheduled-publish) which uses the [jobs queue](https://payloadcms.com/docs/jobs-queue/jobs) in order to publish or unpublish your content on a scheduled time. The tasks are run on a cron schedule and can also be run as a separate instance if needed.

> Note: When deployed on Vercel, depending on the plan tier, you may be limited to daily cron only.

## Website

This template includes a beautifully designed, production-ready front-end built with the [Next.js App Router](https://nextjs.org), served right alongside your Payload app in a instance. This makes it so that you can deploy both your backend and website where you need it.

Core features:

- [Next.js App Router](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- [Payload Admin Bar](https://github.com/payloadcms/payload/tree/main/packages/admin-bar)
- [TailwindCSS styling](https://tailwindcss.com/)
- [shadcn/ui components](https://ui.shadcn.com/)
- User Accounts and Authentication
- Fully featured blog
- Publication workflow
- Dark mode
- Pre-made layout building blocks
- SEO
- Search
- Redirects
- Live preview

### Cache

Although Next.js includes a robust set of caching strategies out of the box, Payload Cloud proxies and caches all files through Cloudflare using the [Official Cloud Plugin](https://www.npmjs.com/package/@payloadcms/payload-cloud). This means that Next.js caching is not needed and is disabled by default. If you are hosting your app outside of Payload Cloud, you can easily reenable the Next.js caching mechanisms by removing the `no-store` directive from all fetch requests in `./src/app/_api` and then removing all instances of `export const dynamic = 'force-dynamic'` from pages files, such as `./src/app/(pages)/[slug]/page.tsx`. For more details, see the official [Next.js Caching Docs](https://nextjs.org/docs/app/building-your-application/caching).

## Development

To spin up this example locally, follow the [Quick Start](#quick-start). Then [Seed](#seed) the database with a few pages, posts, and projects.

### Working with Postgres

Postgres and other SQL-based databases follow a strict schema for managing your data. In comparison to our MongoDB adapter, this means that there's a few extra steps to working with Postgres.

Note that often times when making big schema changes you can run the risk of losing data if you're not manually migrating it.

#### Local development

Ideally we recommend running a local copy of your database so that schema updates are as fast as possible. By default the Postgres adapter has `push: true` for development environments. This will let you add, modify and remove fields and collections without needing to run any data migrations.

If your database is pointed to production you will want to set `push: false` otherwise you will risk losing data or having your migrations out of sync.

#### Migrations

[Migrations](https://payloadcms.com/docs/database/migrations) are essentially SQL code versions that keeps track of your schema. When deploy with Postgres you will need to make sure you create and then run your migrations.

Locally create a migration

```bash
pnpm payload migrate:create
```

This creates the migration files you will need to push alongside with your new configuration.

On the server after building and before running `pnpm start` you will want to run your migrations

```bash
pnpm payload migrate
```

This command will check for any migrations that have not yet been run and try to run them and it will keep a record of migrations that have been run in the database.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

### Seed

To seed the database with a few pages, posts, and projects you can click the 'seed database' link from the admin panel.

The seed script will also create a demo user for demonstration purposes only:

- Demo Author
  - Email: `demo-author@payloadcms.com`
  - Password: `password`

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and start the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.
1. When you're ready to go live, see Deployment below for more details.

### Deploying to Vercel

This template can also be deployed to Vercel for free. You can get started by choosing the Vercel DB adapter during the setup of the template or by manually installing and configuring it:

```bash
pnpm add @payloadcms/db-vercel-postgres
```

```ts
// payload.config.ts
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

export default buildConfig({
  // ...
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  // ...
```

We also support Vercel's blob storage:

```bash
pnpm add @payloadcms/storage-vercel-blob
```

```ts
// payload.config.ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export default buildConfig({
  // ...
  plugins: [
    vercelBlobStorage({
      collections: {
        [Media.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
  // ...
```

There is also a simplified [one click deploy](https://github.com/payloadcms/payload/tree/templates/with-vercel-postgres) to Vercel should you need it.

### Self-hosting

Before deploying your app, you need to:

1. Ensure your app builds and serves in production. See [Production](#production) for more details.
2. You can then deploy Payload as you would any other Node.js or Next.js application either directly on a VPS, DigitalOcean's Apps Platform, via Coolify or more. More guides coming soon.

You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
