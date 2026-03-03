# Portfolio Platform – System Specification

This document outlines the architecture, features, and module requirements for a modern, API-driven portfolio platform—suitable for implementation using Next.js and Payload CMS (or any other Jamstack + headless CMS stack).

> This is an extraction and refactor of the previous system built with Laravel + Filament (admin) and Next.js (frontend).

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Backend (Admin/CMS) Specification](#backend-admincms-specification)
- [Frontend (Public Site) Specification](#frontend-public-site-specification)
- [API Endpoints & Data Shape](#api-endpoints--data-shape)
- [File Storage & Media](#file-storage--media)
- [Design and UI/UX Standards](#design-and-uiux-standards)
- [Deployment & Domain Setup](#deployment--domain-setup)
- [Environment Variables](#environment-variables)
- [Security & Performance Considerations](#security--performance-considerations)
- [Appendix: Useful Features & Concepts](#appendix-useful-features--concepts)

---

## Architecture Overview

- **Headless CMS (admin)**: Powers all content, settings, and asset management via REST/GraphQL API.
- **Public Site (Next.js)**: SSR/ISR for portfolio pages; fetches all content over API.
- **File storage/Media**: Integrated with a CDN (e.g. Cloudflare R2/CDN).
- **Separation of concerns**: Admin and public site can be independently deployed; uses CORS.
- **Recommended Stack**: Next.js + Payload CMS (can be repointed to other headless solutions).

```
  ┌────────────┐              ┌────────────────────┐
  │ Payload   │  REST/Graph  │    Next.js public  │
  │   Admin   ├─────────────▶│      website       │
  └────────────┘              └────────────┬──────┘
                ▲                         ▼
           Media upload                 CDN
                │                         │
          ┌─────┴─────┐            ┌──────┴─────────┐
          │ Cloudflare│◀──────────▶│ CDN (R2, etc.) │
          └───────────┘            └────────────────┘
```

## Backend (Admin/CMS) Specification

### Core Modules
Implement the following collections/fields in Payload CMS (or your headless system):

#### 1. **Experience**
- Required fields: title/role, company, location, type (enum: FT/PT/Contract), description, start_date, end_date, current (bool), sort_order (int), media (array), skills (relation), user (relation, if multiuser)
- Features: CRUD, drag-and-drop reordering, skills tagging (many-to-many), media upload/support

#### 2. **Education**
- Required: title/degree, school, location, field_of_study, description, start_date, end_date, current(boolean), gpa/score (optional), media, skills (many-to-many), sort_order

#### 3. **Projects**
- Required: name, description, associated_experience (optional, relates to Experience), start_date, end_date, current, skills, media, links (many-to-many; see below), sort_order
- Links taxonomy: Label, URL, type (enum: Live, Repo, Docs, Demo, Case Study), reusability (link can be attached to multiple projects)

#### 4. **Certifications**
- Fields: name, issuer (relate to Organization), issue_date, credential_id, grade/score(optional), total_minutes, media, url_to_cert, current (bool), sort_order

#### 5. **Settings/Profile**
- Singleton or Single-record collection.
- Fields: Headline, About Me, SEO title/desc/keywords, Contact info (email, phone, WhatsApp), Socials (GitHub/LinkedIn/YouTube/Dribbble/Behance), Profile picture (media), Logo, Favicon, Personal info (DoB, gender, nationality, etc.), Address (structured), Appearance (primary/secondary brand colors, active template slug/key)

#### 6. **Skills/Taxonomies/Tags (Optional)**
- Add skills collections or taxonomies as many-to-many for experiences, projects, etc.
- Optionally add levels, categories, or colors per skill.

#### 7. **Organizations (for certifications/experience)**
- Fields: name, logo (media), website, description

#### 8. **Media handling**
- All media (profile pics, project images, certifications, etc.)
  - Assign specific upload folders if needed
  - Support ordering in arrays

### API Endpoints
- Provide clean, non-authenticated GET endpoints per resource (experiences, projects, certifications, education, settings)
- Filter endpoints: `?current=true` for current items, add sorting support
- Each endpoint returns formatted fields (display date, media full URL, related entities embedded or ID+name(s), etc.)
- Strongly type the JSON shape for use on the frontend

---

## Frontend (Public Site) Specification

### Template System
- Support dynamic templates/layouts per setting (e.g. set and preview different public templates like "classic", "modern")
- Choose template via API-provided setting, preview via query parameter (?template=modern)
- Templates mapped in registry/config for easy extension

### Main Sections/Routes
- `/`             → Home/overview
- `/experience`   → Experience timeline/list
- `/education`    → Education history
- `/projects`     → Project grid/list
- `/certifications` → Certifications (with grid, Netflix-rail, and modal views)
- Possible: `/about`, `/contact`, `/resume.pdf`

### Navigation/UI
- Server-rendered navigation with section highlighting (aria-current, accessible) 
- Dynamic sections, pulled from API

### Certifications UI Features
- "Netflix-style" horizontal rail/scroll with arrow navigation and responsive grid toggle
- Modal for viewing all certification details/images
- Deterministic gradients/icons per-certification (generate or pick from list/programmatically)

### Animated Background (if desired)
- Abstract animated particles/stars, dark theme; honors prefers-reduced-motion
- Rendered at the layout level, persists across navigation

### Design
- Full-width, liquid layout
- Black background, white text, high accessibility focus
- All brand colors set via CSS vars from API settings, fallback to config
- Integration with Tailwind CSS or similar utility library

---

## API Endpoints & Data Shape

Sample endpoints (replace with Payload defaults or custom as needed):
- `GET /api/experiences`
- `GET /api/experiences/current`
- `GET /api/experiences/:id`
- `GET /api/projects`
- `GET /api/projects/current`
- `GET /api/projects/:id`
- `GET /api/educations`, `GET /api/educations/current`, `GET /api/educations/:id`
- `GET /api/certifications`, `GET /api/certifications/current`, `GET /api/certifications/:id`
- `GET /api/settings` (singleton, returns profile/settings)

**For each resource**, return:
- `id`
- All core fields (see above)
- Array of related entities with minimal detail (e.g., project.skills = [{id, name, ...}])
- Array of media URLs (absolute path, including CDN host if set)
- Dates in ISO + display format if needed
- Any computed fields required for display

---

## File Storage & Media
- Images/files are uploaded via the admin/CMS and served via CDN
- Acceptable hosts and path patterns set in Next.js config (see `images.remotePatterns`)
- Local dev: optionally, public URL of R2/dev bucket or Payload local storage
- Production: uses public CDN domain (e.g. cdn.domain.com)
- Setting `CDN_HOST` env variable in both CMS and frontend for consistency

---

## Design and UI/UX Standards
- Modern, dark, liquid-responsive UI 
- Modular, extendable template/component architecture
- Accessibility: Keyboard navigation, ARIA attributes, color contrast
- Performance: Lazy loading of non-essential assets, CDN hosting for images
- Brand: All colors and images fetched dynamically from admin (Payload) settings/profile

---

## Deployment & Domain Setup
- **Admin** (Payload): hosted on main portfolio domain (e.g., `admin.domain.com`)
- **Public** (Next.js): deployed on Vercel or other Jamstack platforms (`portfolio.domain.com` or separate domain)
- **CDN/R2**: for image hosting; bind custom domain for clean URLs (e.g. `cdn.domain.com`)
- **CORS**: Add allowed origins for frontend site requests in both admin and media hosts
- **DNS**: Main domain, CDN, and app domains configured accordingly

---

## Environment Variables
#### Backend (Payload)
- `PAYLOAD_PUBLIC_SITE_URL=https://portfolio.domain.com`
- `PAYLOAD_CDN_HOST=cdn.domain.com`
- etc.

#### Frontend (Next.js)
- `NEXT_PUBLIC_API_BASE_URL=https://admin.domain.com`
- `NEXT_PUBLIC_CDN_HOST=cdn.domain.com`
- `NEXT_PUBLIC_ACTIVE_TEMPLATE=classic` (optional)

---

## Security & Performance Considerations
- Change default seeded passwords, implement RBAC
- CORS settings: Allow frontend domain in the API and media CDN
- Force HTTPS on all domains in production
- Setup appropriate caching headers in both admin and frontend
- Use ISG or SSR with cache for public site sections for best performance

---

## Appendix: Useful Features & Concepts

- **Drag-and-drop sorting** on admin lists (for experience, education, projects, certifications)
- **Reusable skills/taxonomies/links** (denorm for display if needed)
- **Deterministic gradients and icons** for visual differentiation on the frontend
- **Rich media support**: allow multiple files per record, crop/resize if needed
- **Multi-language (optional)**: Localize content fields in collections if required
- **Accessibility-best practices** implemented throughout

---

_This document serves as a blueprint for your Next.js + Payload (or similar) portfolio platform rebuild._

- All content and features are mapped to easily support Jamstack/headless approaches
- Add, remove, or modify modules and relationships according to your new system's capabilities
