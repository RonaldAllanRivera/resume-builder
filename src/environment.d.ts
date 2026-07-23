declare module '*.css'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      // Optional: unset disables GA4 (dev and preview stay out of the
      // production property without extra config).
      NEXT_PUBLIC_GA_MEASUREMENT_ID?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
