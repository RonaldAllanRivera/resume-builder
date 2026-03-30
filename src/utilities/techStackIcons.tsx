import {
  SiDjango,
  SiPython,
  SiDocker,
  SiStripe,
  SiReact,
  SiNextdotjs,
  SiLaravel,
  SiWordpress,
  SiTailwindcss,
  SiTypescript,
  SiPostgresql,
  SiMysql,
  SiPhp,
  SiJavascript,
  SiNodedotjs,
  SiVercel,
  SiGithub,
  SiGit,
  SiVuedotjs,
  SiAngular,
  SiMongodb,
  SiRedis,
  SiGraphql,
  SiOpenai,
  SiTensorflow,
  SiPandas,
  SiNumpy,
  SiBootstrap,
  SiJquery,
  SiHtml5,
  SiCss,
  SiSass,
  SiWebpack,
  SiFigma,
  SiCanva,
  SiNginx,
  SiApache,
  SiLinux,
  SiUbuntu,
  SiCentos,
  SiJest,
  SiCypress,
  SiVitest,
  SiElasticsearch,
  SiRabbitmq,
  SiCelery,
} from 'react-icons/si'
import {
  FaRobot,
  FaClock,
  FaChartLine,
  FaDatabase,
  FaServer,
  FaCode,
  FaPalette,
  FaAws,
} from 'react-icons/fa'
import { IconType } from 'react-icons'

export const techStackIcons: Record<string, IconType> = {
  // Backend Frameworks
  Django: SiDjango,
  Python: SiPython,
  Laravel: SiLaravel,
  PHP: SiPhp,
  'Node.js': SiNodedotjs,
  Node: SiNodedotjs,

  // Frontend Frameworks
  React: SiReact,
  'Next.js': SiNextdotjs,
  Next: SiNextdotjs,
  'Vue.js': SiVuedotjs,
  Vue: SiVuedotjs,
  Angular: SiAngular,
  JavaScript: SiJavascript,
  TypeScript: SiTypescript,
  jQuery: SiJquery,
  Bootstrap: SiBootstrap,
  HTML5: SiHtml5,
  HTML: SiHtml5,
  CSS3: SiCss,
  CSS: SiCss,
  Sass: SiSass,
  SCSS: SiSass,

  // CSS Frameworks
  Tailwind: SiTailwindcss,
  TailwindCSS: SiTailwindcss,

  // CMS
  WordPress: SiWordpress,
  Filament: SiLaravel, // Filament is a Laravel admin panel

  // Marketing & Analytics
  'Marketing Automation': FaChartLine,
  'Cloudflare Turnstile': SiVercel, // Using Vercel as proxy for edge computing
  Cloudflare: SiVercel,
  TradingView: FaChartLine,

  // Versions (map to base tech)
  'Laravel 12': SiLaravel,
  'Vue.js 3': SiVuedotjs,
  'Vue 3': SiVuedotjs,

  // DevOps & Cloud
  Docker: SiDocker,
  AWS: FaAws,
  Vercel: SiVercel,
  Git: SiGit,
  GitHub: SiGithub,
  Nginx: SiNginx,
  Apache: SiApache,
  Linux: SiLinux,
  Ubuntu: SiUbuntu,
  CentOS: SiCentos,

  // Database
  PostgreSQL: SiPostgresql,
  MySQL: SiMysql,
  MongoDB: SiMongodb,
  Redis: SiRedis,
  Elasticsearch: SiElasticsearch,
  Database: FaDatabase,

  // APIs & Services
  Stripe: SiStripe,
  GraphQL: SiGraphql,
  OpenAI: SiOpenai,
  'REST API': FaServer,
  API: FaServer,

  // AI/ML
  AI: FaRobot,
  TensorFlow: SiTensorflow,
  Pandas: SiPandas,
  NumPy: SiNumpy,

  // Message Queues
  RabbitMQ: SiRabbitmq,
  Kafka: FaServer,
  Celery: SiCelery,

  // Testing
  Jest: SiJest,
  Cypress: SiCypress,
  Playwright: FaCode,
  Vitest: SiVitest,

  // Design Tools
  Figma: SiFigma,
  Photoshop: FaPalette,
  Illustrator: FaPalette,
  Canva: SiCanva,

  // Build Tools
  Webpack: SiWebpack,

  // Other
  OCR: FaRobot,
  Automation: FaClock,
  Analytics: FaChartLine,
  Code: FaCode,
}

interface IconPosition {
  top?: string
  bottom?: string
  left?: string
  right?: string
  transform?: string
  rotation: number
  size: number
}

/**
 * Generate dynamic icon positions based on the number of icons
 * Best practice: Adapts layout to icon count for optimal visual balance
 *
 * @param count - Number of icons to position
 * @param index - Current icon index (0-based)
 * @param scale - Scale multiplier for icon sizes (default 1.0, use 0.7 for smaller cards)
 * @returns Position object with top/bottom/left/right, rotation, and size
 */
export function getDynamicIconPosition(
  count: number,
  index: number,
  scale: number = 1.0,
): IconPosition {
  // Base size varies by position importance
  const baseSizes = {
    center: 5 * scale,
    corner: 4.5 * scale,
    edge: 4 * scale,
    fill: 3.5 * scale,
  }

  // For 1 icon: center only
  if (count === 1) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      rotation: 0,
      size: baseSizes.center,
    }
  }

  // For 2 icons: left and right
  if (count === 2) {
    const positions = [
      { top: '50%', left: '15%', rotation: -10, size: baseSizes.corner },
      { top: '50%', right: '15%', rotation: 10, size: baseSizes.corner },
    ]
    return positions[index]
  }

  // For 3 icons: top center, bottom left, bottom right
  if (count === 3) {
    const positions = [
      {
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        rotation: 0,
        size: baseSizes.center,
      },
      { bottom: '20%', left: '20%', rotation: -12, size: baseSizes.corner },
      { bottom: '20%', right: '20%', rotation: 12, size: baseSizes.corner },
    ]
    return positions[index]
  }

  // For 4 icons: four corners
  if (count === 4) {
    const positions = [
      { top: '12%', left: '10%', rotation: -15, size: baseSizes.corner },
      { top: '12%', right: '10%', rotation: 15, size: baseSizes.corner },
      { bottom: '12%', left: '10%', rotation: 12, size: baseSizes.corner },
      { bottom: '12%', right: '10%', rotation: -12, size: baseSizes.corner },
    ]
    return positions[index]
  }

  // For 5 icons: center + four corners (your requested layout)
  if (count === 5) {
    const positions = [
      {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        rotation: 0,
        size: baseSizes.center,
      },
      { top: '10%', left: '8%', rotation: -12, size: baseSizes.corner },
      { top: '10%', right: '8%', rotation: 12, size: baseSizes.corner },
      { bottom: '10%', left: '8%', rotation: 10, size: baseSizes.corner },
      { bottom: '10%', right: '8%', rotation: -10, size: baseSizes.corner },
    ]
    return positions[index]
  }

  // For 6 icons: center + 4 corners + 1 edge
  if (count === 6) {
    const positions = [
      {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        rotation: 0,
        size: baseSizes.center,
      },
      { top: '10%', left: '8%', rotation: -12, size: baseSizes.corner },
      { top: '10%', right: '8%', rotation: 12, size: baseSizes.corner },
      { bottom: '10%', left: '8%', rotation: 10, size: baseSizes.corner },
      { bottom: '10%', right: '8%', rotation: -10, size: baseSizes.corner },
      {
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        rotation: -5,
        size: baseSizes.edge,
      },
    ]
    return positions[index]
  }

  // For 7+ icons: distributed layout with varied positions
  const positions = [
    {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      rotation: 0,
      size: baseSizes.center,
    },
    { top: '8%', left: '6%', rotation: -12, size: baseSizes.corner },
    { top: '8%', right: '6%', rotation: 12, size: baseSizes.corner },
    { top: '35%', left: '5%', rotation: -8, size: baseSizes.edge },
    { top: '35%', right: '5%', rotation: 8, size: baseSizes.edge },
    { bottom: '8%', left: '6%', rotation: 10, size: baseSizes.corner },
    { bottom: '8%', right: '6%', rotation: -10, size: baseSizes.corner },
    { bottom: '35%', left: '5%', rotation: 15, size: baseSizes.edge },
    { bottom: '35%', right: '5%', rotation: -15, size: baseSizes.edge },
    {
      bottom: '50%',
      left: '50%',
      transform: 'translate(-50%, 50%)',
      rotation: 5,
      size: baseSizes.fill,
    },
  ]

  // Cycle through positions if more than 10 icons
  return positions[index % positions.length]
}

/**
 * Extract tech keywords from project description to find additional icons
 * Best practice: Fallback to description parsing when tech stack is insufficient
 *
 * @param description - Project description/summary text
 * @returns Array of tech names found in description
 */
export function extractTechFromDescription(description: string): string[] {
  if (!description) return []

  const descriptionLower = description.toLowerCase()
  const foundTech: string[] = []

  // Check for each tech in our icon mapping
  Object.keys(techStackIcons).forEach((techName) => {
    const techLower = techName.toLowerCase()
    if (descriptionLower.includes(techLower)) {
      foundTech.push(techName)
    }
  })

  return foundTech
}

/**
 * Get fallback generic icons when tech stack is insufficient
 * Best practice: Always show minimum 3 icons for visual consistency
 *
 * @param count - Number of fallback icons needed
 * @returns Array of generic tech icon names
 */
export function getFallbackIcons(count: number): string[] {
  const fallbacks = ['Code', 'Database', 'API', 'Docker', 'Git', 'AWS']
  return fallbacks.slice(0, count)
}

/**
 * Extract tech icons from certification title based on keywords
 * Best practice: Parse certification titles to identify relevant technologies
 *
 * @param title - Certification title
 * @returns Array of tech icon names found in the title
 */
export function extractTechFromCertificationTitle(title: string): string[] {
  if (!title) return []

  const titleLower = title.toLowerCase()
  const foundTech: string[] = []

  // Check for each tech in our icon mapping
  Object.keys(techStackIcons).forEach((techName) => {
    const techLower = techName.toLowerCase()
    if (titleLower.includes(techLower)) {
      foundTech.push(techName)
    }
  })

  // If no tech found, try to infer from common certification keywords
  if (foundTech.length === 0) {
    if (titleLower.includes('javascript') || titleLower.includes('js')) foundTech.push('JavaScript')
    if (titleLower.includes('python')) foundTech.push('Python')
    if (titleLower.includes('react')) foundTech.push('React')
    if (titleLower.includes('node')) foundTech.push('Node.js')
    if (titleLower.includes('django')) foundTech.push('Django')
    if (titleLower.includes('laravel')) foundTech.push('Laravel')
    if (titleLower.includes('wordpress')) foundTech.push('WordPress')
    if (titleLower.includes('docker')) foundTech.push('Docker')
    if (titleLower.includes('git')) foundTech.push('Git')
    if (titleLower.includes('aws') || titleLower.includes('amazon')) foundTech.push('AWS')
    if (titleLower.includes('database') || titleLower.includes('sql')) foundTech.push('Database')
    if (titleLower.includes('api')) foundTech.push('API')
    if (titleLower.includes('cloud')) foundTech.push('AWS')
    if (titleLower.includes('ai') || titleLower.includes('machine learning')) foundTech.push('AI')
    if (titleLower.includes('css')) foundTech.push('CSS')
    if (titleLower.includes('html')) foundTech.push('HTML5')
    if (titleLower.includes('typescript')) foundTech.push('TypeScript')
    if (titleLower.includes('vue')) foundTech.push('Vue.js')
    if (titleLower.includes('angular')) foundTech.push('Angular')
    if (titleLower.includes('php')) foundTech.push('PHP')
  }

  return foundTech
}
