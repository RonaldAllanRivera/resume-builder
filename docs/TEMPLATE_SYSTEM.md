# Template System Documentation

## Overview

The resume builder includes a flexible template system that allows you to easily switch between different design templates without changing your data or routes. Templates can be changed instantly from the admin panel.

## Architecture

### Template Registry

Templates are managed through a registry pattern located in `src/templates/registry.ts`. This allows you to add new templates by simply creating new component files and registering them.

### Template Structure

Each template consists of the following components:

- **Layout**: Wrapper component with navigation and footer
- **HomePage**: Landing page with profile summary and featured projects
- **ExperiencePage**: Experience timeline
- **EducationPage**: Education history
- **ProjectsPage**: All projects overview
- **ProjectCategoryPage**: Projects filtered by category
- **ProjectDetailPage**: Individual project details
- **CertificationsPage**: All certifications in chronological order

## Available Templates

### Default Template
- Clean, professional design
- Grid-based project layouts
- Chronological certifications display
- Responsive navigation with category submenu

### Future Templates
- **Modern**: (Placeholder - uses default)
- **Minimal**: (Placeholder - uses default)

## Switching Templates

### Admin Panel
1. Navigate to **Globals → Site Settings**
2. Go to the **Template** tab
3. Select your desired template from the dropdown
4. Save changes
5. Template changes apply **instantly** (no rebuild required)

### Preview Mode
You can preview any template without changing the saved setting by adding a query parameter:

```
https://yoursite.com/?template=modern
https://yoursite.com/projects?template=minimal
```

Valid template values: `default`, `modern`, `minimal`

## Adding a New Template

### 1. Create Template Components

Create a new folder in `src/templates/` with your template name:

```
src/templates/
  ├── your-template/
  │   ├── Layout.tsx
  │   ├── HomePage.tsx
  │   ├── ExperiencePage.tsx
  │   ├── EducationPage.tsx
  │   ├── ProjectsPage.tsx
  │   ├── ProjectCategoryPage.tsx
  │   ├── ProjectDetailPage.tsx
  │   ├── CertificationsPage.tsx
  │   ├── Navigation.tsx
  │   └── Footer.tsx
```

### 2. Register the Template

Update `src/templates/registry.ts`:

```typescript
// Import your template components
import { Layout as YourLayout } from './your-template/Layout'
import { HomePage as YourHomePage } from './your-template/HomePage'
// ... import other components

// Add to TemplateKey type
export type TemplateKey = 'default' | 'modern' | 'minimal' | 'your-template'

// Add to templates registry
const templates: Record<TemplateKey, TemplateComponents> = {
  // ... existing templates
  'your-template': {
    Layout: YourLayout,
    HomePage: YourHomePage,
    ExperiencePage: YourExperiencePage,
    EducationPage: YourEducationPage,
    ProjectsPage: YourProjectsPage,
    ProjectCategoryPage: YourProjectCategoryPage,
    ProjectDetailPage: YourProjectDetailPage,
    CertificationsPage: YourCertificationsPage,
  },
}
```

### 3. Add to Site Settings

Update `src/SiteSettings/config.ts` to include your template in the options:

```typescript
{
  name: 'publicTemplate',
  type: 'select',
  options: [
    { label: 'Default', value: 'default' },
    { label: 'Modern', value: 'modern' },
    { label: 'Minimal', value: 'minimal' },
    { label: 'Your Template', value: 'your-template' }, // Add this
  ],
}
```

## Component Props

All template components receive typed props with data from Payload:

### HomePage
```typescript
{
  profile?: ResumeProfile1 | null
  featuredProjects?: Project[]
  settings?: SiteSetting | null
}
```

### ExperiencePage
```typescript
{
  experiences?: Experience[]
  settings?: SiteSetting | null
}
```

### EducationPage
```typescript
{
  educations?: Education[]
  settings?: SiteSetting | null
}
```

### ProjectsPage
```typescript
{
  projects?: Project[]
  settings?: SiteSetting | null
}
```

### ProjectCategoryPage
```typescript
{
  category: string
  projects?: Project[]
  settings?: SiteSetting | null
}
```

### ProjectDetailPage
```typescript
{
  slug: string
  project?: Project | null
  settings?: SiteSetting | null
}
```

### CertificationsPage
```typescript
{
  certifications?: Certification[]
  settings?: SiteSetting | null
}
```

## Styling

### Brand Colors

Brand colors are **hardcoded per template** (not managed in CMS). Define your colors in your template's CSS/Tailwind configuration.

Example:
```tsx
// In your template component
<div className="bg-primary text-white">
  {/* Your template-specific colors */}
</div>
```

### Responsive Design

All default template components use Tailwind CSS with responsive breakpoints:
- Mobile: default
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)

## Navigation

### Dynamic Navigation

Navigation visibility is controlled via Site Settings:
- Show/hide Experience
- Show/hide Education
- Show/hide Projects
- Show/hide Certifications

### Project Categories Submenu

The Projects navigation item includes a dropdown submenu with 4 categories:
- Full Stack Development (`/projects/full-stack`)
- WordPress Development (`/projects/wordpress`)
- Automation & Software Engineering (`/projects/automation`)
- Graphic Design (`/projects/graphic-design`)

## SEO Considerations

### Project Privacy

Projects have a `noindexProject` checkbox that adds `noindex` meta tags to project detail pages. This allows selective privacy while keeping project names visible in category lists for SEO.

### Certifications SEO

Certifications are displayed on a single page (`/certifications`) in chronological order (latest first) with:
- Semantic HTML (`<article>`, `<time>`)
- Proper heading hierarchy
- Structured data (JSON-LD) - coming soon

## Best Practices

1. **Keep templates presentational**: Data fetching happens in routes, not templates
2. **Use TypeScript**: All components are fully typed
3. **Follow accessibility**: Use semantic HTML and ARIA attributes
4. **Optimize images**: Use Next.js Image component when displaying media
5. **Test responsiveness**: Ensure templates work on all screen sizes
6. **Maintain consistency**: Follow the component interface defined in the registry

## Data Fetching

Templates receive pre-fetched data from routes. Data fetching utilities are in `src/utilities/fetchPublicData.ts`:

- `getAllProjects()`: Fetch all published projects
- `getProjectsByCategory(category)`: Fetch projects by category
- `getProjectBySlug(slug)`: Fetch single project
- `getAllCertifications()`: Fetch all certifications (chronological)
- `getAllExperiences()`: Fetch all experiences
- `getAllEducations()`: Fetch all educations
- `getResumeProfile()`: Fetch resume profile global
- `getFeaturedProjects()`: Fetch featured projects

All queries:
- Use `overrideAccess: false` for security
- Filter by `_status: 'published'`
- Include proper sorting
- Are optimized for performance

## Troubleshooting

### Template not showing changes
- Clear Next.js cache: `rm -rf .next`
- Restart dev server
- Check browser cache

### TypeScript errors
- Run `pnpm run generate:types` after schema changes
- Ensure all component props match the registry interface

### Styling issues
- Verify Tailwind classes are available
- Check for CSS conflicts between templates
- Use browser DevTools to inspect styles
