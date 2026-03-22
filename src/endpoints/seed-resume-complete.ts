import type { Payload, PayloadRequest } from 'payload'

/**
 * Complete resume seed with all certifications, projects, experiences, and education
 * Based on new-resume.txt (March 2026)
 */
export const seedResumeComplete = async ({
  payload,
  req,
  overrideAccess = false,
  skipProjects = false,
}: {
  payload: Payload
  req: PayloadRequest
  overrideAccess?: boolean
  skipProjects?: boolean
}): Promise<void> => {
  payload.logger.info('Starting complete resume seed...')

  // Seed Site Settings Global
  payload.logger.info('Seeding site settings global...')
  await payload.updateGlobal({
    slug: 'siteSettings',
    data: {
      siteName: 'Ronald Allan Rivera - Resume Builder',
      defaultMetaTitle: 'Ronald Allan Rivera | Full-Stack Web Developer',
      defaultMetaDescription:
        'Full-stack Web Developer with 20+ years of experience in Python, Laravel, WordPress, React, Vue, Next.js. Specializing in eCommerce, SaaS, AI, and marketing technology.',
      socialLinks: [
        {
          label: 'Portfolio',
          url: 'https://allanwebdesign.com',
        },
        {
          label: 'Email',
          url: 'mailto:jaeron.rivera@gmail.com',
        },
        {
          label: 'LinkedIn',
          url: 'https://www.linkedin.com/in/ronald-allan-rivera-a43aaa63/',
        },
        {
          label: 'GitHub',
          url: 'https://github.com/RonaldAllanRivera/',
        },
      ],
    },
    req,
  })

  // Seed Resume Profile Global
  payload.logger.info('Seeding resume profile global...')
  await payload.updateGlobal({
    slug: 'resumeProfile',
    data: {
      fullName: 'Ronald Allan Rivera',
      headline: 'Full-Stack Web Developer | Python, Laravel, WordPress | 20+ Years Experience',
      summary: `I'm a full-stack Web Developer with 20+ years of experience delivering production-ready solutions across eCommerce, SaaS, AI, and marketing technology. I specialize in Python automation, backend systems with Laravel/PHP and Python/Django, scalable WordPress plugin development, and modern frontends with React, Vue, Next.js, and Inertia. My recent work includes building Python desktop applications for data automation, developing Laravel 12 + Filament apps with advanced admin dashboards, lead capture and user management, pixel tracking, cloaking middleware, deployment pipelines, and reporting, and creating custom WordPress plugins for search, eCommerce, and content management. I focus on performance, security, SEO, and maintainability, ensuring every project is scalable, optimized, and future-proof.`,
      email: 'jaeron.rivera@gmail.com',
      publishEmail: true,
      phone: '+63-927-023-8592',
      publishPhone: true,
      address: 'Sector 5, Sta. Monica, Agoo, La Union 2504 Philippines',
      publishAddress: true,
      dateOfBirth: '1982-04-11',
      publishDateOfBirth: true,
    },
    req,
  })

  // Seed Experiences
  payload.logger.info('Seeding experiences...')
  const experiences = [
    {
      title: 'Web Developer',
      company: 'LogicMedia BV',
      location: 'Remote',
      startDate: '2015-06-01',
      current: true,
      order: 1,
      highlights: [
        {
          text: 'Partner directly with the CEO to lead end-to-end web development initiatives, delivering high-performance marketing and interstitial websites that drive engagement and conversions.',
        },
        {
          text: 'Develop full-stack tools and applications using Python, Django, React.js, and Next.js, streamlining internal workflows and improving operational efficiency.',
        },
        {
          text: 'Spearhead domain, hosting, and CDN configurations (Cloudflare), optimizing site performance, security, and uptime.',
        },
        {
          text: 'Write high-impact marketing content for landing pages and promotional websites, leveraging AI-powered prompt engineering for maximum conversion.',
        },
        {
          text: 'Produce training documentation, video tutorials, and marketing content, including YouTube video editing and uploads, supporting cross-department needs.',
        },
        {
          text: 'Act as a multi-functional resource—from developer to virtual assistant—helping the company achieve cost and time savings by consolidating multiple roles into one.',
        },
      ],
      _status: 'published' as const,
    },
    {
      title: 'Senior Web Programmer and Web Designer',
      company: 'PulseIQ.com',
      location: 'Remote',
      startDate: '2007-07-01',
      current: true,
      order: 2,
      highlights: [
        {
          text: 'Lead the design and development of all partner websites, building custom WordPress and Elementor-based solutions tailored for high-impact marketing campaigns.',
        },
        {
          text: 'Develop custom WordPress plugins and implement fully responsive themes from scratch, converting Photoshop designs into pixel-perfect front-end templates.',
        },
        {
          text: 'Create visual branding materials, including logos, images, and videos, using Adobe Photoshop and Premiere Pro.',
        },
        {
          text: 'Utilize AI content generation tools (ChatGPT, Gemini) to create SEO-friendly web copy, significantly reducing content production time while maintaining quality.',
        },
        {
          text: 'Build automation pipelines using Zapier and Make.com, integrating Google Sheets, OpenAI, and WordPress, reducing manual tasks and improving productivity by up to 80%.',
        },
        {
          text: 'Execute SEO strategies with Google Tag Manager, ensuring optimal search visibility and tracking.',
        },
        {
          text: 'Act as a trainer and content creator for online tutorials, educating partner teams on CMS and digital marketing processes.',
        },
        {
          text: 'Design Python-based data extraction and automation tools (Playwright, Selenium, Tkinter), enabling efficient collection of large datasets for marketing analytics.',
        },
      ],
      _status: 'published' as const,
    },
    {
      title: 'Web Designer',
      company: 'SiteBuilder123.com',
      location: 'Remote',
      startDate: '2015-02-01',
      endDate: '2015-12-01',
      order: 3,
      highlights: [
        {
          text: 'Built WordPress websites tailored to client requirements, focusing on modern, responsive design.',
        },
        {
          text: 'Designed marketing materials like tarpaulins, brochures, and streamers, helping clients effectively communicate their brand messages.',
        },
      ],
      _status: 'published' as const,
    },
    {
      title: 'Lead Banner Designer - Contractual',
      company: 'Bowzed.com',
      location: 'Remote',
      startDate: '2015-03-01',
      endDate: '2015-05-01',
      order: 4,
      highlights: [
        {
          text: 'Designed and coded marketing banners using HTML, CSS, and JavaScript, ensuring responsive and engaging designs.',
        },
      ],
      _status: 'published' as const,
    },
    {
      title: 'Freelance Graphic Designer',
      company: 'Thunderbird Resort La Union Philippines',
      location: 'La Union, Philippines',
      startDate: '2007-05-01',
      endDate: '2008-11-01',
      order: 5,
      highlights: [
        {
          text: "Created graphic designs for promotional materials such as tarpaulins, brochures, and magazines, aligning visuals with the resort's premium branding.",
        },
      ],
      _status: 'published' as const,
    },
    {
      title: 'Web Developer and Graphic Artist',
      company: 'Danalex Graphic Arts and Call Center',
      location: 'Baguio City, Philippines',
      startDate: '2006-04-01',
      endDate: '2007-07-01',
      order: 6,
      highlights: [
        {
          text: 'Developed websites using PHP, MySQL, XHTML, and CSS, ensuring functionality and adherence to client requirements.',
        },
        {
          text: 'Designed and converted website mockups from Photoshop into working front-end interfaces.',
        },
      ],
      _status: 'published' as const,
    },
    {
      title: 'Web/Graphic Designer and Customer Representative',
      company: 'Web Coast Design Inc.',
      location: 'Baguio City, Philippines',
      startDate: '2005-03-01',
      endDate: '2006-04-01',
      order: 7,
      highlights: [
        {
          text: 'Collaborated with clients to design and develop custom websites that aligned with their business goals.',
        },
        {
          text: 'Worked closely with senior designers to learn and apply advanced web and graphic design techniques.',
        },
      ],
      _status: 'published' as const,
    },
    {
      title: 'High School Math Instructor',
      company: 'Agoo Academy',
      location: 'La Union, Philippines',
      startDate: '2004-06-01',
      endDate: '2005-03-01',
      order: 8,
      highlights: [
        {
          text: 'Taught mathematics subjects, including Geometry, Algebra, Statistics, and Trigonometry, to high school students.',
        },
        {
          text: 'Served as a general section adviser and part-time computer instructor, teaching basic IT skills.',
        },
      ],
      _status: 'published' as const,
    },
    {
      title: 'Final Weigher',
      company: 'Union Leaf Tobacco Corporation',
      location: 'Philippines',
      startDate: '2003-03-01',
      endDate: '2004-06-01',
      order: 9,
      highlights: [
        {
          text: 'Ensured all packed tobacco met exact weight requirements before transferring to the warehouse.',
        },
        {
          text: 'Provided technical support to production clerks, resolving computer-related issues to maintain operational efficiency.',
        },
      ],
      _status: 'published' as const,
    },
  ]

  for (const exp of experiences) {
    await payload.create({
      collection: 'experiences',
      data: exp,
      req,
      overrideAccess,
    })
  }

  // Seed Education (Updated)
  payload.logger.info('Seeding education...')
  const educations = [
    {
      school: 'AMA Computer University — Quezon City, Philippines',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Engineering',
      location: 'Quezon City, Philippines',
      startDate: '2000-05-01',
      endDate: '2004-05-01',
      order: 1,
      highlights: [
        {
          text: 'Graduated with a strong foundation in computer engineering fundamentals, web development and software development.',
        },
      ],
      _status: 'published' as const,
    },
  ]

  for (const edu of educations) {
    await payload.create({
      collection: 'educations',
      data: edu,
      req,
      overrideAccess,
    })
  }

  // Seed Projects (skip if using new seeder)
  if (!skipProjects) {
    payload.logger.info('Seeding projects...')
    const projects = [
      // FULL STACK DEVELOPMENT
      {
        title: 'Meet Lessons',
        slug: 'meet-lessons',
        summary:
          'Engineered an AI-powered SaaS platform combining a Python OCR desktop client and Django backend to generate real-time answers from screenshots and study materials. Implemented multi-tenant architecture, secure device pairing with token validation, Stripe subscription billing with webhook sync, document ingestion for PDFs/images, and live AI response streaming via SSE. Containerized with Docker and deployed to cloud infrastructure for production-ready scalability.',
        techStack: [
          { name: 'Django' },
          { name: 'Python' },
          { name: 'OCR' },
          { name: 'AI/ML' },
          { name: 'Stripe' },
          { name: 'Docker' },
        ],
        repoUrl: 'https://github.com/RonaldAllanRivera/auto-respond/',
        category: 'full-stack' as const,
        featured: true,
        order: 1,
        _status: 'published' as const,
      },
      {
        title: 'Forex Signals Platform (D1/W1/MN1)',
        slug: 'forex-signals-platform',
        summary:
          'Full Stack Laravel Developer - Developed a Laravel 12 trading analysis platform with automated candlestick syncing, AI-generated trade signals, TradingView chart rendering, scheduler-driven jobs, admin trade workflows, and daily email reports.',
        techStack: [
          { name: 'Laravel' },
          { name: 'PHP' },
          { name: 'TradingView' },
          { name: 'AI/ML' },
          { name: 'Docker' },
        ],
        repoUrl: 'https://github.com/RonaldAllanRivera/forex',
        featured: true,
        order: 2,
        _status: 'published' as const,
      },
      {
        title: 'AWS E-commerce Microservices',
        slug: 'aws-ecommerce-microservices',
        summary:
          'Full Stack Laravel Developer - Architected a microservices-based e-commerce system using three Laravel services and a Vue 3 SPA frontend with asynchronous messaging and AWS deployment.',
        techStack: [
          { name: 'Laravel' },
          { name: 'Vue.js' },
          { name: 'Microservices' },
          { name: 'AWS' },
          { name: 'Docker' },
        ],
        repoUrl: 'https://github.com/RonaldAllanRivera/aws_ecommerce',
        featured: true,
        order: 3,
        _status: 'published' as const,
      },
      {
        title: 'Modular Frontend with Advanced Marketing & Lead Gen Tools',
        slug: 'traderai-live',
        summary:
          'Full Stack Laravel Developer - Engineered a modular Laravel platform with multi-template switching, advanced lead generation pipelines, CAPTCHA validation, rate limiting, rule-based cloaking middleware, and dynamic pixel injection.',
        techStack: [
          { name: 'Laravel' },
          { name: 'Filament' },
          { name: 'Cloudflare Turnstile' },
          { name: 'Marketing Automation' },
        ],
        repoUrl: 'https://github.com/RonaldAllanRivera/traderai.live',
        featured: true,
        order: 4,
        _status: 'published' as const,
      },
      {
        title: 'Multi-Source Marketing Data Dashboard',
        slug: 'marketing-data-dashboard',
        summary:
          'Full Stack Laravel Developer - Built a performance marketing reporting system that normalizes CSV and JSON exports from multiple platforms into structured dashboards.',
        techStack: [{ name: 'Laravel' }, { name: 'Data Processing' }, { name: 'CSV/JSON' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/report-system-laravel',
        featured: false,
        order: 5,
        _status: 'published' as const,
      },
      {
        title: 'Cars Images API',
        slug: 'cars-images-api',
        summary:
          'Full Stack Laravel Developer - Developed a Laravel and Filament system integrating with Wikimedia Commons to fetch, validate, and manage high-resolution car images.',
        techStack: [{ name: 'Laravel' }, { name: 'Filament' }, { name: 'API Integration' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/cars-images-api',
        featured: false,
        order: 6,
        _status: 'published' as const,
      },
      {
        title: 'Book Reader',
        slug: 'book-reader',
        summary:
          'Full Stack AI Systems Developer - Created a Python automation system using Selenium, OCR, and LLM integration to extract text from browser-based reading platforms.',
        techStack: [{ name: 'Python' }, { name: 'Selenium' }, { name: 'OCR' }, { name: 'OpenAI' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/book-reader',
        featured: false,
        order: 7,
        _status: 'published' as const,
      },
      {
        title: 'Figma to Elementor Clone',
        slug: 'figma-to-elementor',
        summary:
          'Full Stack Laravel Developer - Built a Laravel platform that converts Figma designs into clean HTML previews and Elementor-compatible JSON exports for WordPress import.',
        techStack: [
          { name: 'Laravel' },
          { name: 'Figma API' },
          { name: 'WordPress' },
          { name: 'Docker' },
        ],
        repoUrl: 'https://github.com/RonaldAllanRivera/elementor-clone',
        featured: false,
        order: 8,
        _status: 'published' as const,
      },
      {
        title: 'Featured Resource Block',
        slug: 'featured-resource-block',
        summary:
          'WordPress Plugin Developer - Developed a production-ready WordPress plugin featuring a custom post type, Elementor widget, scheduled JSON syncing, and hardened security.',
        techStack: [{ name: 'WordPress' }, { name: 'Elementor' }, { name: 'PHP' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/featured-resource-block',
        featured: false,
        order: 9,
        _status: 'published' as const,
      },
      {
        title: 'IRANK Calc & Cards',
        slug: 'irank-calc-cards',
        summary:
          'WordPress Plugin Developer - Engineered high-performance Gutenberg blocks including a real-time calculator and swipeable product cards using server-rendered architecture.',
        techStack: [{ name: 'WordPress' }, { name: 'Gutenberg' }, { name: 'JavaScript' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/irank-calc-cards',
        featured: false,
        order: 10,
        _status: 'published' as const,
      },
      {
        title: 'Used Cars Search',
        slug: 'used-cars-search',
        summary:
          'WordPress Plugin Developer - Built a scalable search and comparison plugin with autosuggest, AI-generated SEO metadata, REST endpoints, and optimized asset loading.',
        techStack: [{ name: 'WordPress' }, { name: 'OpenAI' }, { name: 'REST API' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/used-cars-search',
        featured: false,
        order: 11,
        _status: 'published' as const,
      },
      {
        title: 'Popular AI Software Search',
        slug: 'popular-ai-software-search',
        summary:
          'WordPress Plugin Developer - Created a modern AJAX-powered search plugin using vanilla JavaScript and Fetch API with autosuggest and filtering.',
        techStack: [{ name: 'WordPress' }, { name: 'JavaScript' }, { name: 'AJAX' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/software-search',
        featured: false,
        order: 12,
        _status: 'published' as const,
      },
      {
        title: 'Ozeum Museum',
        slug: 'ozeum-museum',
        summary:
          'Custom WordPress Theme Developer - Built a professional custom WordPress theme for museums with custom post types, GSAP animations, and WCAG accessibility.',
        techStack: [{ name: 'WordPress' }, { name: 'GSAP' }, { name: 'Custom Theme' }],
        liveUrl: 'https://artworkwebsite.com/',
        featured: false,
        order: 13,
        _status: 'published' as const,
      },
      {
        title: 'Cloudflare Multiple Domain Delete',
        slug: 'cloudflare-domain-delete',
        summary:
          'Full Stack Python Developer - Built a Tkinter-based desktop tool for safely bulk deleting Cloudflare domains with progress tracking.',
        techStack: [{ name: 'Python' }, { name: 'Tkinter' }, { name: 'Cloudflare API' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/cloudflare-multiple-domain-delete',
        featured: false,
        order: 14,
        _status: 'published' as const,
      },
      {
        title: 'HTTrack-like Clone',
        slug: 'httrack-clone',
        summary:
          'Full Stack Python Developer - Developed a desktop application that mirrors web pages into clean offline folders with asset rewriting and preview capabilities.',
        techStack: [{ name: 'Python' }, { name: 'Tkinter' }, { name: 'Web Scraping' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/httrack-clone',
        featured: false,
        order: 15,
        _status: 'published' as const,
      },
      {
        title: 'GaitBeacon.com',
        slug: 'gaitbeacon',
        summary:
          'WordPress and Elementor Developer - Custom WordPress and WooCommerce site built with Elementor, optimized checkout flow, SEO configuration, performance tuning, and security hardening.',
        techStack: [{ name: 'WordPress' }, { name: 'Elementor' }, { name: 'WooCommerce' }],
        liveUrl: 'https://gaitbeacon.com',
        featured: false,
        order: 16,
        _status: 'published' as const,
      },
      {
        title: 'EverythingUsedCars.com',
        slug: 'everything-used-cars',
        summary:
          'WordPress and Elementor Developer - Developed a responsive WordPress site with advanced search filters, SEO optimization, caching setup, and scalable architecture.',
        techStack: [{ name: 'WordPress' }, { name: 'Elementor' }, { name: 'SEO' }],
        liveUrl: 'https://everythingusedcars.com',
        featured: false,
        order: 17,
        _status: 'published' as const,
      },
      {
        title: 'PopularAISoftware.com',
        slug: 'popular-ai-software',
        summary:
          'WordPress and Elementor Developer - Built an AI tools directory integrating OpenAI, automation workflows, and WordPress customization for a dynamic user experience.',
        techStack: [{ name: 'WordPress' }, { name: 'Elementor' }, { name: 'OpenAI' }],
        liveUrl: 'https://popularaisoftware.com',
        featured: false,
        order: 18,
        _status: 'published' as const,
      },
      {
        title: '78Dragons.com',
        slug: '78dragons',
        summary:
          'WordPress and Elementor Developer - Developed a WooCommerce eCommerce platform with structured product management and optimized purchasing flow.',
        techStack: [{ name: 'WordPress' }, { name: 'Elementor' }, { name: 'WooCommerce' }],
        liveUrl: 'https://78dragons.com',
        featured: false,
        order: 19,
        _status: 'published' as const,
      },
      {
        title: 'SmarterSafetySystems.com',
        slug: 'smarter-safety-systems',
        summary:
          'WordPress and Elementor Developer - Built a WordPress site for an IoT safety solutions provider with structured content and scalable architecture.',
        techStack: [{ name: 'WordPress' }, { name: 'Elementor' }],
        liveUrl: 'https://smartersafetysystems.com',
        featured: false,
        order: 20,
        _status: 'published' as const,
      },
      {
        title: 'LumbardConsulting.com',
        slug: 'lumbard-consulting',
        summary:
          'WordPress and Elementor Developer - Created a professional WordPress site for a leadership consulting firm with optimized UX and structured service pages.',
        techStack: [{ name: 'WordPress' }, { name: 'Elementor' }],
        liveUrl: 'https://lumbardconsulting.com',
        featured: false,
        order: 21,
        _status: 'published' as const,
      },
      {
        title: '24Aries.com',
        slug: '24aries',
        summary:
          'WordPress Developer - Developed a WordPress website showcasing advanced technology products with responsive layout and structured presentation.',
        techStack: [{ name: 'WordPress' }],
        liveUrl: 'https://24aries.com',
        featured: false,
        order: 22,
        _status: 'published' as const,
      },
      {
        title: 'PulseIQ.com',
        slug: 'pulseiq',
        summary:
          'WordPress and Elementor Developer - Built a WordPress site for energy benchmarking and management solutions with SEO configuration and performance optimization.',
        techStack: [{ name: 'WordPress' }, { name: 'Elementor' }, { name: 'SEO' }],
        liveUrl: 'https://pulseiq.com',
        featured: false,
        order: 23,
        _status: 'published' as const,
      },
      {
        title: 'Interactive Map Scraper',
        slug: 'interactive-map-scraper',
        summary:
          'Software Developer - Created a Python GUI tool to extract structured data from Mapbox-based interactive maps.',
        techStack: [{ name: 'Python' }, { name: 'Tkinter' }, { name: 'Mapbox' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/mapscraper',
        featured: false,
        order: 24,
        _status: 'published' as const,
      },
      {
        title: 'CSV Scraper GUI',
        slug: 'csv-scraper-gui',
        summary:
          'Software Developer - Built a Selenium-based desktop scraper designed for heavily protected websites using realistic browser automation techniques.',
        techStack: [{ name: 'Python' }, { name: 'Selenium' }, { name: 'Tkinter' }],
        repoUrl: 'https://github.com/RonaldAllanRivera/csv_scraper_gui',
        featured: false,
        order: 25,
        _status: 'published' as const,
      },
    ]

    for (const project of projects) {
      await payload.create({
        collection: 'projects',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: project as any,
        req,
        overrideAccess,
      })
    }
  }

  // Seed Certifications (Complete list - 50+ certifications)
  payload.logger.info('Seeding certifications...')
  const certifications = [
    {
      title: 'Learning Nuxt.js',
      issuer: 'LinkedIn.com',
      duration: '1h 32m',
      issueDate: '2025-09-13',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/dc65cf43b5e68ff03ee981b13ed48131c8178184bde15143fcbfcb35d409f906',
      order: 1,
      _status: 'published' as const,
    },
    {
      title: 'Vue.js 3 Essential Training',
      issuer: 'LinkedIn.com',
      duration: '5h 8m',
      issueDate: '2025-09-11',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/5aeb562393f6c13ca193e4d212d66b6c0fe0b68b15fa0c3507e72c743313e86e',
      order: 2,
      _status: 'published' as const,
    },
    {
      title: 'Building Modern Projects with React',
      issuer: 'LinkedIn.com',
      duration: '3h 50m',
      issueDate: '2025-08-27',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/33d7b534ce141004f955319fedc3d5ec508815079f2acfaada174e26720746ce',
      order: 3,
      _status: 'published' as const,
    },
    {
      title: 'Building a Website with Laravel, React.js, and Inertia',
      issuer: 'LinkedIn.com',
      duration: '1h 16m',
      issueDate: '2025-08-14',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/b01a53cc90b8135336242263048fafd652382098f874598b1e0de2ffbfc00a76',
      order: 4,
      _status: 'published' as const,
    },
    {
      title: 'Custom WordPress Plugins: Design, Develop, and Distribute',
      issuer: 'LinkedIn.com',
      duration: '1h 13m',
      issueDate: '2025-08-07',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/f5fe062fe2ae57d3cd98db101d2f19e23eb0a17f3e32d35ad6535518d2e189cd',
      order: 5,
      _status: 'published' as const,
    },
    {
      title: 'HTMX Essential Training',
      issuer: 'LinkedIn.com',
      duration: '1h 24m',
      issueDate: '2025-08-04',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/c7de5adcb5d2827eb37d72599c4f6cb43956bfbd9d2de3bc8026589d005b2604',
      order: 6,
      _status: 'published' as const,
    },
    {
      title: 'GitHub Actions for CI/CD',
      issuer: 'LinkedIn.com',
      duration: '2h 2m',
      issueDate: '2025-07-30',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/45c1cc155f56f1c100e0356aa95ff620d4cfdbc857b684f2c2db1144daa824a7',
      order: 7,
      _status: 'published' as const,
    },
    {
      title: 'Fundamentals of AI Engineering: Principles and Practical Applications',
      issuer: 'LinkedIn.com',
      duration: '4h 3m',
      issueDate: '2025-07-24',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/b924f96937612ae3b362e862fb27380503b4057a8f6969e33722f3dd0e813db6',
      order: 8,
      _status: 'published' as const,
    },
    {
      title: 'Model Context Protocol (MCP): Hands-On with Agentic AI',
      issuer: 'LinkedIn.com',
      duration: '55m',
      issueDate: '2025-07-21',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/ecc4f8cdb8d8a0af3e3587f8bfe940c97c73a50deca72279304188e028f9005e',
      order: 9,
      _status: 'published' as const,
    },
    {
      title: 'Learning Kubernetes',
      issuer: 'LinkedIn.com',
      duration: '1h 28m',
      issueDate: '2025-07-20',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/9e9010446496f38f2a05668e156edea5e8afc63654e40379b8d9566408c45043',
      order: 10,
      _status: 'published' as const,
    },
    {
      title: 'AWS Certified Cloud Practitioner (CLF-C02) Cert Prep: 1 Cloud Concepts',
      issuer: 'LinkedIn.com',
      duration: '55m',
      issueDate: '2025-07-20',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/f8516ab967efb579f4ba5205e1dcdfec26c1eeb1d2fe836e7522b506f57a92d9',
      order: 11,
      _status: 'published' as const,
    },
    {
      title: 'DevOps Foundations: Continuous Delivery/Continuous Integration',
      issuer: 'LinkedIn.com',
      duration: '1h 54m',
      issueDate: '2025-07-16',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/4dfe834dafd9f6a12b67c02440515023811b89f597864e33e62d6f78ef9b05f6',
      order: 12,
      _status: 'published' as const,
    },
    {
      title: 'AWS API Gateway with HTTP, Lambda, DynamoDB, and iOS',
      issuer: 'LinkedIn.com',
      duration: '2h 1m',
      issueDate: '2025-07-11',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/e70d37f0cafe8215b0a603f724df137427dfe024b46236a51e596655b8dfda47',
      order: 13,
      _status: 'published' as const,
    },
    {
      title: 'MongoDB Essential Training',
      issuer: 'LinkedIn.com',
      duration: '3h 49m',
      issueDate: '2025-07-08',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/05067d9ffbe1acc92103ebb46d7a2940efd531ae6d3b5e559ce8aa724da2a2e6',
      order: 14,
      _status: 'published' as const,
    },
    {
      title: 'Express Essentials: Build Powerful Web Apps with Node.js',
      issuer: 'LinkedIn.com',
      duration: '1h 59m',
      issueDate: '2025-06-27',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/b1758b031c4ab641b173d96d7d4536251e815713c93535796e08950b6538ee69',
      order: 15,
      _status: 'published' as const,
    },
    {
      title: 'TypeScript Essential Training',
      issuer: 'LinkedIn.com',
      duration: '2h 18m',
      issueDate: '2025-06-25',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/ae62321a86cb8a391af54aa71def55ca67390407ed91e08c06924a2c79bebc78',
      order: 16,
      _status: 'published' as const,
    },
    {
      title: 'Next.js: Creating and Hosting a Full-Stack Site',
      issuer: 'LinkedIn.com',
      duration: '3h 54m',
      issueDate: '2025-06-21',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/a86740c29838ab340fae7f881a666d88bf99ca598c36bcce671d4ca247d5ea81',
      order: 17,
      _status: 'published' as const,
    },
    {
      title: 'AWS Essential Training for Developers',
      issuer: 'LinkedIn.com',
      duration: '4h 8m',
      issueDate: '2025-06-06',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/21a88cee8041f1495a604a171df1283a7f6ffc7a3443a22f5047c57f61fd6ac1',
      order: 18,
      _status: 'published' as const,
    },
    {
      title: 'Vibe Coding Fundamentals: Tools and Best Practices',
      issuer: 'LinkedIn.com',
      duration: '37m',
      issueDate: '2025-06-05',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/a9342688d934995e9c94a3b50ebc4e9f17aba8c8112495cb2d23ea881ba76122',
      order: 19,
      _status: 'published' as const,
    },
    {
      title: 'Tailwind CSS 4 Essential Training',
      issuer: 'LinkedIn.com',
      duration: '3h 2m',
      issueDate: '2025-06-02',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/111a5b9612a3e040339084651ebbf02811648b132ff0451952202e6545295ca0',
      order: 20,
      _status: 'published' as const,
    },
    // Continue with remaining certifications...
    {
      title: 'Docker for Developers',
      issuer: 'LinkedIn.com',
      duration: '1h 15m',
      issueDate: '2025-05-30',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/37d41dd7fed5ab1665d2b9441537ecc448996fe5b34fb53c2a5491654068edcb',
      order: 21,
      _status: 'published' as const,
    },
    {
      title: 'Software Architecture Foundations',
      issuer: 'LinkedIn.com',
      duration: '1h 36m',
      issueDate: '2025-05-26',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/19766d900f59c253530bf7b16568826b9538711edd0684214d0bf0ab99f87dd8',
      order: 22,
      _status: 'published' as const,
    },
    {
      title: 'Securing Software as a Service (SaaS)',
      issuer: 'LinkedIn.com',
      duration: '54m',
      issueDate: '2025-05-25',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/5c34cfc123c6e93e529492dfd890e2e04ed4042edf9cf4c548954dac95855bfc',
      order: 23,
      _status: 'published' as const,
    },
    {
      title: 'Django Essential Training',
      issuer: 'LinkedIn.com',
      duration: '2h 39m',
      issueDate: '2025-05-23',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/af807f85a18de4d27c1e4e9df3c47b064689149f11df7e2c8975a7eb5998f96a',
      order: 24,
      _status: 'published' as const,
    },
    {
      title: 'Figma Essential Training',
      issuer: 'LinkedIn.com',
      duration: '1h 37m',
      issueDate: '2025-05-15',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/15e5309e9120aab099bd164f5a2f1f8e290866f74755535da1dc6487e19810d4',
      order: 25,
      _status: 'published' as const,
    },
    {
      title: 'WordPress Essential Training',
      issuer: 'LinkedIn.com',
      duration: '2h 4m',
      issueDate: '2025-05-14',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/8887227bf6002282146185cad81ee8e1da875895293da1822b5ac1f8669597cf',
      order: 26,
      _status: 'published' as const,
    },
    {
      title: 'Building Angular and Django Apps',
      issuer: 'LinkedIn.com',
      duration: '1h 46m',
      issueDate: '2025-05-10',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/161d0c6326d33016eca724de3899156fe1e22964a825f84ff6ffd94d2c857a7e',
      order: 27,
      _status: 'published' as const,
    },
    {
      title: 'Building React and Django Apps',
      issuer: 'LinkedIn.com',
      duration: '56m',
      issueDate: '2025-05-08',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/281091f4ba76c7ce27429f5187229bec80a4b58e2d14001814334fd7f6f87cc0',
      order: 28,
      _status: 'published' as const,
    },
    {
      title: 'Advanced Python: Practical Database Examples',
      issuer: 'LinkedIn.com',
      duration: '1h 48m',
      issueDate: '2025-05-07',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/c444a48013cdb95fa9c3416f1c21aa9777a5472e2620f0a0b47a662429a37afe',
      order: 29,
      _status: 'published' as const,
    },
    {
      title: 'Advanced Python: Working with Databases',
      issuer: 'LinkedIn.com',
      duration: '2h 6m',
      issueDate: '2025-05-04',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/38bc91603bce3d69fc80a77415e1ea2e65870bd43364dcb64090708530d79b43',
      order: 30,
      _status: 'published' as const,
    },
    {
      title: 'Python Hands-On Practice Learning Path',
      issuer: 'LinkedIn.com',
      duration: '15h 46m',
      issueDate: '2025-04-29',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/7eee12decca890f1993a6cc111c0b6a92d38d970629e240a0a0e35740cdff3df',
      order: 31,
      _status: 'published' as const,
    },
    {
      title: 'Introduction to Video Editing',
      issuer: 'LinkedIn.com',
      duration: '2h 53m',
      issueDate: '2025-03-28',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/9bb8157b817c27c832ad0d7d645ec3b6759afa19b8aa6b428cd5a70b1ce5c344',
      order: 32,
      _status: 'published' as const,
    },
    {
      title: 'Video Editing Fundamentals',
      issuer: 'LinkedIn.com',
      duration: '37m',
      issueDate: '2025-03-23',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/f355db89fb691abc0138293d43b50fb689c14775fbff8e0dfaa542e91dc28c8a',
      order: 33,
      _status: 'published' as const,
    },
    {
      title: 'AI and Generative AI for Video Content Creation',
      issuer: 'LinkedIn.com',
      duration: '1h 33m',
      issueDate: '2025-03-22',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/238455ae1d22c558a63a8391a7f77702158c1c00ad4544167a88540d45ccac3a',
      order: 34,
      _status: 'published' as const,
    },
    {
      title: 'Leveraging AI in Adobe Premiere Pro',
      issuer: 'LinkedIn.com',
      duration: '1h 20m',
      issueDate: '2025-03-21',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/61bc6ccdf7a9524aeac01763f920ce2f04d51325fd32625bf87d94fa3428365f',
      order: 35,
      _status: 'published' as const,
    },
    {
      title: 'Premiere Pro 2025 Essential Training',
      issuer: 'LinkedIn.com',
      duration: '5h 53m',
      issueDate: '2025-03-14',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/5e38de98dd380e18463af59262e59c08ae876b9a22d426e7da0b9b57f4919fc2',
      order: 36,
      _status: 'published' as const,
    },
    {
      title: 'Become an AI Engineer Learning Path',
      issuer: 'LinkedIn.com',
      duration: '13h',
      issueDate: '2025-03-12',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/4268173311ad8a9beade4470e5f3deb30aa070323210fda19a37805c4a43c54d',
      order: 37,
      _status: 'published' as const,
    },
    {
      title: 'Deep Learning Foundations: Natural Language Processing with TensorFlow',
      issuer: 'LinkedIn.com',
      duration: '1h 47m',
      issueDate: '2025-03-10',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/28580b41cff6f96e90dc5aba8174f54ed3a9f6dcccf5db71b9bac4347df66d72',
      order: 38,
      _status: 'published' as const,
    },
    {
      title: 'Fundamentals to Become a Machine Learning Engineer Learning Path',
      issuer: 'LinkedIn.com',
      duration: '10h',
      issueDate: '2025-02-27',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/6f14c524435962cc935f269cc048c73afdc84b05238a7616884ba9c86f01eb1c',
      order: 39,
      _status: 'published' as const,
    },
    {
      title: 'Explore React.js Development Learning Path',
      issuer: 'LinkedIn.com',
      duration: '19h',
      issueDate: '2025-02-11',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/c3e08e5bfbfa580df0208ec900acfdb6594ea4f00efe23d0162213b461332c66',
      order: 40,
      _status: 'published' as const,
    },
    {
      title: 'React.js: Building an Interface',
      issuer: 'LinkedIn.com',
      duration: '1h 40m',
      issueDate: '2025-01-04',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/2c3409c0ce3da8e46590b436f490ee70b7a0f4ea17fa19741886f0a2d0375ddd',
      order: 41,
      _status: 'published' as const,
    },
    {
      title: 'Practical GitHub Code Search',
      issuer: 'LinkedIn.com',
      duration: '40m',
      issueDate: '2025-01-01',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/559dc4348e18461307db7d714b9bdbd856cc47c2ae25d5864e79979d23783a06',
      order: 42,
      _status: 'published' as const,
    },
    {
      title: 'Practical GitHub Copilot',
      issuer: 'LinkedIn.com',
      duration: '1h',
      issueDate: '2024-12-30',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/c7bf4d6b59f23ca0741527c6241e83b1e64de1c9820ba20000bc0bffc1a7373c',
      order: 43,
      _status: 'published' as const,
    },
    {
      title: 'Practical GitHub Project Management and Collaboration',
      issuer: 'LinkedIn.com',
      duration: '1h 18m',
      issueDate: '2024-12-29',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/353a09617244451b65cbf40aa1e8ff6b81d645cdd156bfb319e2be3b3bcece8f',
      order: 44,
      _status: 'published' as const,
    },
    {
      title: 'Practical GitHub Actions',
      issuer: 'LinkedIn.com',
      duration: '1h 19m',
      issueDate: '2024-12-29',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/e40208dfb0d72497af6803f2162dc0a9db0ae89866a4b42ad18a7664d21dba83',
      order: 45,
      _status: 'published' as const,
    },
    {
      title: 'Building PHP Applications with Generative AI',
      issuer: 'LinkedIn.com',
      duration: '1h 23m',
      issueDate: '2024-12-28',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/0b2ee6d4dbc24eae8a69c3227cceddaa2b4a59303e4e9ae2732e4c834c78ada7',
      order: 46,
      _status: 'published' as const,
    },
    {
      title: 'Git Essential Training',
      issuer: 'LinkedIn.com',
      duration: '1h 23m',
      issueDate: '2024-12-28',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/1e890028719654b52cc922ca5b4464005a4ce2db8d3be0f3561ba01a0fde04b5',
      order: 47,
      _status: 'published' as const,
    },
    {
      title: 'Node.js: Testing and Code Quality',
      issuer: 'LinkedIn.com',
      duration: '4h 21m',
      issueDate: '2024-12-25',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/ed0dd5a3a4d81b09e6387e4f321e7d9602ad55868a59edd50c362cdd8589cbde',
      order: 48,
      _status: 'published' as const,
    },
    {
      title: 'Learning npm: A Package Manager',
      issuer: 'LinkedIn.com',
      duration: '55m',
      issueDate: '2024-12-20',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/32db740d99020a763effb933faa2c8bb4d35b96f8fc9fde3284a91596e506b76',
      order: 49,
      _status: 'published' as const,
    },
    {
      title: 'Node.js Essential Training',
      issuer: 'LinkedIn.com',
      duration: '1h 19m',
      issueDate: '2024-12-19',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/0c86dd65b36e45e63017947a29f1d3c187a7411779ec1fe5c3c815852422a2dc',
      order: 50,
      _status: 'published' as const,
    },
    {
      title: 'WordPress: Custom Post Types and Taxonomies',
      issuer: 'LinkedIn.com',
      duration: '2h 9m',
      issueDate: '2024-12-18',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/2f6601a67d2327b1fc3e3ea54c81dc29299cdc54b447327db40a70caac345d70',
      order: 51,
      _status: 'published' as const,
    },
    {
      title: 'Agile Foundations',
      issuer: 'LinkedIn.com',
      duration: '1h 35m',
      issueDate: '2024-12-15',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/c5189bc0ba85a7e6016059ad1f93e1683f304106df08fa7b006bf1b1647b5f04',
      order: 52,
      _status: 'published' as const,
    },
    {
      title: 'Laravel: Building a CRM with Filament for Laravel',
      issuer: 'LinkedIn.com',
      duration: '2h 51m',
      issueDate: '2024-12-14',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/1f3d00496216aa4d7d8b3c64c5e75cf387ac213564c66114fafd5ae59a661f76',
      order: 53,
      _status: 'published' as const,
    },
    {
      title: 'Livewire Essential Training',
      issuer: 'LinkedIn.com',
      duration: '52m',
      issueDate: '2024-12-11',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/2f70f1c665385a9b981264318c8bf3f5ef2a26cc562932cb052bc1d64aa9c85d',
      order: 54,
      _status: 'published' as const,
    },
    {
      title: 'WordPress: Internationalization',
      issuer: 'LinkedIn.com',
      duration: '1h 22m',
      issueDate: '2024-12-10',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/c4f2b4f22693e61f9388f4a4873f42eb13f325d37ee6cdff6e7c19fdd88905b9',
      order: 55,
      _status: 'published' as const,
    },
    {
      title: 'WordPress: Building a Secure Site',
      issuer: 'LinkedIn.com',
      duration: '51m',
      issueDate: '2024-12-09',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/81f10cb5e17866fd99d6f2c15f2c7e7838520e89bff044a6b85ec99cc7ee5e70',
      order: 56,
      _status: 'published' as const,
    },
    {
      title: 'React Essential Training',
      issuer: 'LinkedIn.com',
      duration: '1h 45m',
      issueDate: '2024-12-08',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/e89adcf61aef250dc56a97161dd4b05c2038edced33ea10493b0b816a8b6958c',
      order: 57,
      _status: 'published' as const,
    },
    {
      title: 'Building GraphQL Applications in Laravel',
      issuer: 'LinkedIn.com',
      duration: '44m',
      issueDate: '2024-12-05',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/82c64cb0e42918b944984e9daa13be9f88325cdc47535549d5d8840986343fdd',
      order: 58,
      _status: 'published' as const,
    },
    {
      title: 'Building RESTful APIs in Laravel',
      issuer: 'LinkedIn.com',
      duration: '1h 17m',
      issueDate: '2024-12-04',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/5e6d5ce87925d79cb32aae390f17d62e04850bc609e62be99d04885da01e25f9',
      order: 59,
      _status: 'published' as const,
    },
    {
      title: 'Advanced Laravel',
      issuer: 'LinkedIn.com',
      duration: '3h 14m',
      issueDate: '2024-12-02',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/b70e683da49224fac61c5dd4e9c5f442a3b9519a66223f8927958e42c12eef9e',
      order: 60,
      _status: 'published' as const,
    },
    {
      title: 'Laravel Essential Training',
      issuer: 'LinkedIn.com',
      duration: '3h 14m',
      issueDate: '2024-11-20',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/a62afe7be32b1289dcf55271659faa0b1538345ab4a60ca27b31afd070f72653',
      order: 61,
      _status: 'published' as const,
    },
    {
      title: 'Using Python for Automation',
      issuer: 'LinkedIn.com',
      duration: '1h 15m',
      issueDate: '2024-11-20',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/56db14e533a3fdcc56dc872cc6501e193d4827f4bfa399a3b55cb71d5fb5d563',
      order: 62,
      _status: 'published' as const,
    },
    {
      title: 'Level Up: Python',
      issuer: 'LinkedIn.com',
      duration: '57m',
      issueDate: '2024-11-19',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/f10790e4b3c999dbb050501bdfb94bf9737bf3c5bba553a2a30cfe6b167159d1',
      order: 63,
      _status: 'published' as const,
    },
    {
      title: 'Django Essential Training',
      issuer: 'LinkedIn.com',
      duration: '2h 6m',
      issueDate: '2024-11-19',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/914245da3488fe74cc988207eeedb297e566cd0d8727618a3e5083e905ac4fa4',
      order: 64,
      _status: 'published' as const,
    },
    {
      title: 'Python Essential Training',
      issuer: 'LinkedIn.com',
      duration: '4h 22m',
      issueDate: '2024-11-17',
      credentialUrl:
        'https://www.linkedin.com/learning/certificates/71ec9ce81c088ab9086beb5510dee27de4eee37e15a4ca1cda0cc4642b0d5633',
      order: 65,
      _status: 'published' as const,
    },
  ]

  for (const cert of certifications) {
    await payload.create({
      collection: 'certifications',
      data: cert,
      req,
      overrideAccess,
    })
  }

  payload.logger.info(
    `Resume seed completed! Seeded: Site Settings (1), Resume Profile (1), Experiences (${experiences.length}), Education (${educations.length}), Projects (${skipProjects ? 'skipped' : '25'}), Certifications (${certifications.length})`,
  )
}
