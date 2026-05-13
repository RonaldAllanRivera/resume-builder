import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { AvailabilityRules } from './collections/AvailabilityRules'
import { Bookings } from './collections/Bookings'
import { Categories } from './collections/Categories'
import { Certifications } from './collections/Certifications'
import { Companies } from './collections/Companies'
import { Customers } from './collections/Customers'
import { Educations } from './collections/Educations'
import { Experiences } from './collections/Experiences'
import { Generations } from './collections/Generations'
import { JobAds } from './collections/JobAds'
import { Media } from './collections/Media'
import { Packages } from './collections/Packages'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { ResumeProfiles } from './collections/ResumeProfiles'
import { Users } from './collections/Users'
import { AIGenerationSettings } from './AIGenerationSettings/config'
import { CoverLetterSettings } from './CoverLetterSettings/config'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { ResumeProfile } from './ResumeProfile/config'
import { SiteSettings } from './SiteSettings/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard', '@/components/DatabaseManager'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  // Email adapter: Payload-internal emails (admin password resets, form-builder
  // submissions, etc.) go through Resend. The booking emails in
  // src/lib/booking-email.ts call Resend directly and are independent of this.
  // Without this adapter, Vercel logs warn "No email adapter provided" and
  // emails are silently written to console instead of sent.
  email: resendAdapter({
    defaultFromAddress:
      process.env.CONTACT_FORM_FROM_EMAIL || 'noreply@allanai.dev',
    defaultFromName: process.env.CONTACT_FORM_FROM_NAME || 'Allan Rivera',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      // Enable SSL only for remote databases (not localhost/CI environments).
      // Recognizes both sslmode=require (legacy) and sslmode=verify-full
      // (recommended; required pre-pg-v9 to keep strict cert verification).
      ssl:
        process.env.DATABASE_URL?.includes('.vercel-storage.com') ||
        process.env.DATABASE_URL?.includes('sslmode=require') ||
        process.env.DATABASE_URL?.includes('sslmode=verify-full') ||
        process.env.DATABASE_SSL === 'true' ||
        false,
    },
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Experiences,
    Educations,
    Projects,
    Certifications,
    ResumeProfiles,
    Companies,
    JobAds,
    Generations,
    Users,
    // Booking system collections
    Packages,
    Customers,
    AvailabilityRules,
    Bookings,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, SiteSettings, ResumeProfile, CoverLetterSettings, AIGenerationSettings],
  plugins: [
    ...plugins,
    // Vercel Blob storage for Media uploads. Without this, uploads on Vercel
    // succeed but vanish on the next deploy (Vercel filesystem is ephemeral).
    // Auto-disables locally if BLOB_READ_WRITE_TOKEN is unset — uploads then
    // fall back to public/media on disk (fine for dev, not for Vercel).
    vercelBlobStorage({
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  onInit: async (payload) => {
    const users = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      sort: 'createdAt',
    })

    const hasAdmin = users.docs.some(
      (u) =>
        Array.isArray((u as { roles?: string[] }).roles) &&
        (u as { roles?: string[] }).roles?.includes('admin'),
    )

    if (!hasAdmin && users.docs.length > 0) {
      await payload.update({
        collection: 'users',
        id: users.docs[0].id,
        data: {
          roles: ['admin'],
        } as unknown as Record<string, unknown>,
        overrideAccess: true,
      })
    }
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
