import type { Payload, PayloadRequest } from 'payload'

/**
 * Updated projects seed with proper categories
 */
export const seedProjectsUpdated = async ({
  payload,
  req,
  overrideAccess = false,
}: {
  payload: Payload
  req: PayloadRequest
  overrideAccess?: boolean
}): Promise<void> => {
  payload.logger.info('Seeding projects with categories...')

  const projects = [
    // ========================================
    // FULL STACK DEVELOPMENT (8 projects)
    // ========================================
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
        { name: 'SSE' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/auto-respond/',
      category: 'full-stack' as const,
      featured: true,
      order: 26,
      _status: 'published' as const,
    },
    {
      title: 'Forex Signals Platform (D1/W1/MN1)',
      slug: 'forex-signals-platform',
      summary:
        'Developed a production-ready Laravel 12 forex analysis platform for higher-timeframe market signals, featuring automated candlestick data ingestion from Alpha Vantage, idempotent upserts, AI-generated BUY/SELL/WAIT trade signals, TradingView-powered charting, scheduler-driven jobs, and daily email reporting. Implemented secure authentication, admin trade review workflows, JSON APIs, and a resilient service architecture designed for reliability, automation, and production-scale maintainability.',
      techStack: [
        { name: 'Laravel 12' },
        { name: 'PHP' },
        { name: 'TradingView' },
        { name: 'AI/ML' },
        { name: 'Alpha Vantage API' },
        { name: 'Docker' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/forex',
      category: 'full-stack' as const,
      featured: true,
      order: 25,
      _status: 'published' as const,
    },
    {
      title: 'AWS E-commerce Microservices',
      slug: 'aws-ecommerce-microservices',
      summary:
        'Architected a microservices-based e-commerce system using three Laravel services and a Vue 3 SPA frontend. Implemented asynchronous messaging, Docker containers, and AWS CloudFormation deployment on EC2.',
      techStack: [
        { name: 'Laravel' },
        { name: 'Vue.js 3' },
        { name: 'Microservices' },
        { name: 'AWS' },
        { name: 'Docker' },
        { name: 'CloudFormation' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/aws_ecommerce',
      category: 'full-stack' as const,
      featured: true,
      order: 24,
      _status: 'published' as const,
    },
    {
      title: 'Modular Frontend with Advanced Marketing & Lead Gen Tools',
      slug: 'traderai-live',
      summary:
        'Engineered a modular Laravel platform with multi-template switching, advanced lead generation pipelines, CAPTCHA validation, rate limiting, rule-based cloaking middleware, dynamic pixel injection, and enterprise-grade security controls.',
      techStack: [
        { name: 'Laravel' },
        { name: 'Filament' },
        { name: 'Cloudflare Turnstile' },
        { name: 'Marketing Automation' },
        { name: 'Pixel Tracking' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/traderai.live',
      category: 'full-stack' as const,
      featured: true,
      order: 23,
      _status: 'published' as const,
    },
    {
      title: 'Multi-Source Marketing Data Dashboard (CSV/JSON)',
      slug: 'marketing-data-dashboard',
      summary:
        'Built a performance marketing reporting system that normalizes CSV and JSON exports from multiple platforms into structured dashboards with strict campaign matching and spreadsheet-ready outputs.',
      techStack: [
        { name: 'Laravel' },
        { name: 'Data Processing' },
        { name: 'CSV/JSON' },
        { name: 'Reporting' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/report-system-laravel',
      category: 'full-stack' as const,
      featured: false,
      order: 22,
      _status: 'published' as const,
    },
    {
      title: 'Cars Images API',
      slug: 'cars-images-api',
      summary:
        'Developed a Laravel and Filament system integrating with Wikimedia Commons to fetch, validate, and manage high-resolution car images with scalable admin tools and optimized data workflows.',
      techStack: [
        { name: 'Laravel' },
        { name: 'Filament' },
        { name: 'Wikimedia API' },
        { name: 'Image Processing' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/cars-images-api',
      category: 'full-stack' as const,
      featured: false,
      order: 21,
      _status: 'published' as const,
    },
    {
      title: 'Book Reader',
      slug: 'book-reader',
      summary:
        'Created a Python automation system using Selenium, OCR, and LLM integration to extract text from browser-based reading platforms and generate AI-assisted quiz answers with structured configuration and logging.',
      techStack: [
        { name: 'Python' },
        { name: 'Selenium' },
        { name: 'OCR' },
        { name: 'OpenAI' },
        { name: 'Automation' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/book-reader',
      category: 'full-stack' as const,
      featured: false,
      order: 20,
      _status: 'published' as const,
    },
    {
      title: 'Figma to Elementor Clone',
      slug: 'figma-to-elementor',
      summary:
        'Built a Laravel platform that converts Figma designs into clean HTML previews and Elementor-compatible JSON exports for WordPress import, with authenticated project management and Docker deployment.',
      techStack: [
        { name: 'Laravel' },
        { name: 'Figma API' },
        { name: 'WordPress' },
        { name: 'Docker' },
        { name: 'JSON' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/elementor-clone',
      category: 'full-stack' as const,
      featured: false,
      order: 19,
      _status: 'published' as const,
    },

    // ========================================
    // WORDPRESS DEVELOPMENT (15 projects)
    // ========================================
    {
      title: 'Used Cars Search',
      slug: 'used-cars-search',
      summary:
        'Engineered a scalable WordPress search and comparison plugin for large used-car inventories with lightning-fast autosuggest, advanced filtering, sortable results, and side-by-side vehicle comparison. Implemented AI-powered content generation with an unattended WP-Cron background queue, CSV import pipeline, conflict-safe SEO meta system, REST API integration, and a performance-focused architecture built with Vanilla JavaScript (ES6) and the WordPress REST API. Designed for high performance, maintainability, and large-dataset scalability.',
      techStack: [
        { name: 'WordPress' },
        { name: 'OpenAI' },
        { name: 'REST API' },
        { name: 'JavaScript ES6' },
        { name: 'WP-Cron' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/used-cars-search',
      category: 'wordpress' as const,
      featured: true,
      order: 18,
      _status: 'published' as const,
    },
    {
      title: 'Featured Resource Block',
      slug: 'featured-resource-block',
      summary:
        'Developed a production-ready WordPress plugin featuring a custom post type, Elementor widget, scheduled JSON syncing, caching, and hardened security with strict sanitization and capability checks.',
      techStack: [
        { name: 'WordPress' },
        { name: 'Elementor' },
        { name: 'PHP' },
        { name: 'JSON' },
        { name: 'Caching' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/featured-resource-block',
      category: 'wordpress' as const,
      featured: false,
      order: 17,
      _status: 'published' as const,
    },
    {
      title: 'IRANK Calc & Cards',
      slug: 'irank-calc-cards',
      summary:
        'Engineered high-performance Gutenberg blocks including a real-time calculator and swipeable product cards using server-rendered architecture and lightweight vanilla JavaScript.',
      techStack: [
        { name: 'WordPress' },
        { name: 'Gutenberg' },
        { name: 'JavaScript' },
        { name: 'PHP' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/irank-calc-cards',
      category: 'wordpress' as const,
      featured: false,
      order: 16,
      _status: 'published' as const,
    },
    {
      title: 'Popular AI Software Search',
      slug: 'popular-ai-software-search',
      summary:
        'Created a modern AJAX-powered search plugin using vanilla JavaScript and Fetch API with autosuggest, filtering, and admin management tools.',
      techStack: [
        { name: 'WordPress' },
        { name: 'JavaScript' },
        { name: 'AJAX' },
        { name: 'Fetch API' },
      ],
      repoUrl: 'https://github.com/RonaldAllanRivera/software-search',
      category: 'wordpress' as const,
      featured: false,
      order: 15,
      _status: 'published' as const,
    },
    {
      title: 'Ozeum Museum',
      slug: 'ozeum-museum',
      summary:
        'Built a professional custom WordPress theme for museums and cultural institutions using modern best practices. Implemented a custom Exhibitions post type, responsive mobile-first layouts, GSAP-powered animations, one-click demo import, and a custom admin tools panel. Delivered strong performance optimization (cache busting, conditional loading, no jQuery), SEO enhancements with Yoast integration and auto-populated metadata, and accessibility best practices aligned with WCAG principles.',
      techStack: [
        { name: 'WordPress' },
        { name: 'GSAP' },
        { name: 'Custom Theme' },
        { name: 'WCAG' },
        { name: 'SEO' },
      ],
      liveUrl: 'https://artworkwebsite.com/',
      category: 'wordpress' as const,
      featured: false,
      order: 14,
      _status: 'published' as const,
    },
    {
      title: 'GaitBeacon.com',
      slug: 'gaitbeacon',
      summary:
        'Custom WordPress and WooCommerce site built with Elementor, optimized checkout flow, SEO configuration, performance tuning, and security hardening.',
      techStack: [
        { name: 'WordPress' },
        { name: 'Elementor' },
        { name: 'WooCommerce' },
        { name: 'SEO' },
      ],
      liveUrl: 'https://gaitbeacon.com',
      category: 'wordpress' as const,
      featured: false,
      order: 13,
      _status: 'published' as const,
    },
    {
      title: 'EverythingUsedCars.com',
      slug: 'everything-used-cars',
      summary:
        'Developed a responsive WordPress site with advanced search filters, SEO optimization, caching setup, and scalable architecture.',
      techStack: [
        { name: 'WordPress' },
        { name: 'Elementor' },
        { name: 'SEO' },
        { name: 'Caching' },
      ],
      liveUrl: 'https://everythingusedcars.com',
      category: 'wordpress' as const,
      featured: false,
      order: 12,
      _status: 'published' as const,
    },
    {
      title: 'PopularAISoftware.com',
      slug: 'popular-ai-software',
      summary:
        'Built an AI tools directory integrating OpenAI, automation workflows, and WordPress customization for a dynamic user experience.',
      techStack: [
        { name: 'WordPress' },
        { name: 'Elementor' },
        { name: 'OpenAI' },
        { name: 'Automation' },
      ],
      liveUrl: 'https://popularaisoftware.com',
      category: 'wordpress' as const,
      featured: false,
      order: 11,
      _status: 'published' as const,
    },
    {
      title: '78Dragons.com',
      slug: '78dragons',
      summary:
        'Developed a WooCommerce eCommerce platform with structured product management and optimized purchasing flow.',
      techStack: [{ name: 'WordPress' }, { name: 'Elementor' }, { name: 'WooCommerce' }],
      liveUrl: 'https://78dragons.com',
      category: 'wordpress' as const,
      featured: false,
      order: 10,
      _status: 'published' as const,
    },
    {
      title: 'SmarterSafetySystems.com',
      slug: 'smarter-safety-systems',
      summary:
        'Built a WordPress site for an IoT safety solutions provider with structured content and scalable architecture.',
      techStack: [{ name: 'WordPress' }, { name: 'Elementor' }],
      liveUrl: 'https://smartersafetysystems.com',
      category: 'wordpress' as const,
      featured: false,
      order: 9,
      _status: 'published' as const,
    },
    {
      title: 'LumbardConsulting.com',
      slug: 'lumbard-consulting',
      summary:
        'Created a professional WordPress site for a leadership consulting firm with optimized UX and structured service pages.',
      techStack: [{ name: 'WordPress' }, { name: 'Elementor' }],
      liveUrl: 'https://lumbardconsulting.com',
      category: 'wordpress' as const,
      featured: false,
      order: 8,
      _status: 'published' as const,
    },
    {
      title: '24Aries.com',
      slug: '24aries',
      summary:
        'Developed a WordPress website showcasing advanced technology products with responsive layout and structured presentation.',
      techStack: [{ name: 'WordPress' }],
      liveUrl: 'https://24aries.com',
      category: 'wordpress' as const,
      featured: false,
      order: 7,
      _status: 'published' as const,
    },
    {
      title: 'PulseIQ.com',
      slug: 'pulseiq',
      summary:
        'Built a WordPress site for energy benchmarking and management solutions with SEO configuration and performance optimization.',
      techStack: [{ name: 'WordPress' }, { name: 'Elementor' }, { name: 'SEO' }],
      liveUrl: 'https://pulseiq.com',
      category: 'wordpress' as const,
      featured: false,
      order: 6,
      _status: 'published' as const,
    },

    // ========================================
    // AUTOMATION & SOFTWARE ENGINEERING (4 projects)
    // ========================================
    {
      title: 'Cloudflare Multiple Domain Delete (GUI)',
      slug: 'cloudflare-domain-delete',
      summary:
        'Built a Tkinter-based desktop tool for safely bulk deleting Cloudflare domains with progress tracking and structured logging.',
      techStack: [{ name: 'Python' }, { name: 'Tkinter' }, { name: 'Cloudflare API' }],
      repoUrl: 'https://github.com/RonaldAllanRivera/cloudflare-multiple-domain-delete',
      category: 'automation' as const,
      featured: false,
      order: 5,
      _status: 'published' as const,
    },
    {
      title: 'HTTrack-like Clone',
      slug: 'httrack-clone',
      summary:
        'Developed a desktop application that mirrors web pages into clean offline folders with asset rewriting, structured output, and preview capabilities.',
      techStack: [{ name: 'Python' }, { name: 'Tkinter' }, { name: 'Web Scraping' }],
      repoUrl: 'https://github.com/RonaldAllanRivera/httrack-clone',
      category: 'automation' as const,
      featured: false,
      order: 4,
      _status: 'published' as const,
    },
    {
      title: 'Interactive Map Scraper',
      slug: 'interactive-map-scraper',
      summary:
        'Created a Python GUI tool to extract structured data from Mapbox-based interactive maps.',
      techStack: [{ name: 'Python' }, { name: 'Tkinter' }, { name: 'Mapbox' }],
      repoUrl: 'https://github.com/RonaldAllanRivera/mapscraper',
      category: 'automation' as const,
      featured: false,
      order: 3,
      _status: 'published' as const,
    },
    {
      title: 'CSV Scraper GUI',
      slug: 'csv-scraper-gui',
      summary:
        'Built a Selenium-based desktop scraper designed for heavily protected websites using realistic browser automation techniques.',
      techStack: [{ name: 'Python' }, { name: 'Selenium' }, { name: 'Tkinter' }],
      repoUrl: 'https://github.com/RonaldAllanRivera/csv_scraper_gui',
      category: 'automation' as const,
      featured: false,
      order: 2,
      _status: 'published' as const,
    },

    // ========================================
    // GRAPHIC DESIGN (1 project)
    // ========================================
    {
      title: 'Graphic Design Portfolio',
      slug: 'graphic-design-portfolio',
      summary:
        'Collection of branding, layout, and digital design projects demonstrating visual communication and creative direction.',
      techStack: [
        { name: 'Adobe Photoshop' },
        { name: 'Adobe Illustrator' },
        { name: 'Branding' },
        { name: 'Layout Design' },
      ],
      liveUrl: 'https://www.flickr.com/photos/ronald-allan-rivera/',
      category: 'graphic-design' as const,
      featured: false,
      order: 1,
      _status: 'published' as const,
    },
  ]

  for (const project of projects) {
    await payload.create({
      collection: 'projects',
      data: project,
      req,
      overrideAccess,
    })
  }

  payload.logger.info(`✅ Successfully seeded ${projects.length} projects with categories`)
}
