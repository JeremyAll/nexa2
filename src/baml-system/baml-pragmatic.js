// src/baml-system/baml-pragmatic.js
import { StreamingHandler } from '../streaming-handler.js';

export class BAMLPragmatic {
  constructor() {
    // VERSION SIMPLIFIÉE mais EFFICACE
    this.streamingHandler = new StreamingHandler();
    this.domainPrompts = {
      ecommerce: this.getEcommercePrompt(),
      saas: this.getSaasPrompt(),
      landing: this.getLandingPrompt(),
      blog: this.getBlogPrompt(),
      dashboard: this.getDashboardPrompt(),
      api: this.getAPIPrompt()
    };
  }

  async generate(userPrompt) {
    console.log('🎯 BAML Pragmatic Generation Started');

    // 1. Détection domaine rapide
    const domain = await this.detectDomain(userPrompt);
    console.log(`📍 Domain detected: ${domain}`);

    // 2. Prompt structuré simple mais efficace
    const structuredPrompt = {
      system: this.domainPrompts[domain],
      user: this.enhanceWithSCoT(userPrompt),
      maxTokens: 12000,
      temperature: 0.7
    };

    console.log('🧠 Enhanced prompt with domain expertise + SCoT');

    // 3. Génération avec systèmes existants
    // - Streaming ✅
    // - Cache ✅
    // - Retry ✅
    const result = await this.streamingHandler.generateWithStream(
      structuredPrompt.user
    );

    console.log('✅ BAML Pragmatic Generation Completed');
    return result;
  }

  async detectDomain(prompt) {
    const lowercasePrompt = prompt.toLowerCase();

    // Détection rapide par mots-clés
    if (lowercasePrompt.includes('ecommerce') ||
        lowercasePrompt.includes('shop') ||
        lowercasePrompt.includes('store') ||
        lowercasePrompt.includes('cart') ||
        lowercasePrompt.includes('product')) {
      return 'ecommerce';
    }

    if (lowercasePrompt.includes('saas') ||
        lowercasePrompt.includes('subscription')) {
      return 'saas';
    }

    if (lowercasePrompt.includes('dashboard') ||
        lowercasePrompt.includes('analytics') ||
        lowercasePrompt.includes('chart') ||
        lowercasePrompt.includes('data visualization')) {
      return 'dashboard';
    }

    if (lowercasePrompt.includes('landing') ||
        lowercasePrompt.includes('marketing') ||
        lowercasePrompt.includes('conversion')) {
      return 'landing';
    }

    if (lowercasePrompt.includes('blog') ||
        lowercasePrompt.includes('article') ||
        lowercasePrompt.includes('cms')) {
      return 'blog';
    }

    if (lowercasePrompt.includes('api') ||
        lowercasePrompt.includes('endpoint') ||
        lowercasePrompt.includes('rest')) {
      return 'api';
    }

    // Par défaut: landing page (plus générique)
    return 'landing';
  }

  enhanceWithSCoT(userPrompt) {
    // Système SCoT simplifié mais efficace
    return `Think step by step to create a comprehensive, production-ready solution:

1. ANALYZE: Break down the requirements: "${userPrompt}"
2. ARCHITECTURE: Plan the optimal component structure
3. IMPLEMENTATION: Generate complete, working code
4. OPTIMIZATION: Ensure performance and best practices

Requirements: ${userPrompt}

Generate a complete, professional solution with:
- Modern React/Next.js architecture
- Tailwind CSS styling
- TypeScript when beneficial
- Responsive design
- Production-ready code quality`;
  }

  getEcommercePrompt() {
    return `You are an e-commerce development expert. Generate a complete online store with:

CORE FEATURES:
- Product catalog with advanced filtering (category, price, rating)
- Shopping cart with quantity management
- User authentication (signup/login)
- Secure checkout process
- Payment integration setup (Stripe/PayPal ready)
- Order management system
- Admin dashboard for inventory
- Product search with autocomplete
- Customer reviews and ratings
- Wishlist functionality

OPTIMIZATION FOCUS:
- Conversion rate optimization
- Mobile-first responsive design
- Fast loading times
- SEO-friendly structure
- Accessibility compliance
- Security best practices

OUTPUT: Complete React/Next.js application with all components, pages, and API routes.`;
  }

  getSaasPrompt() {
    return `You are a SaaS application development expert. Generate a complete SaaS platform with:

CORE FEATURES:
- User authentication and authorization
- Subscription management (pricing tiers)
- Analytics dashboard with charts
- User management and roles
- API key management
- Billing and invoicing system
- Usage tracking and limits
- Admin panel for platform management
- Multi-tenant architecture
- Real-time notifications

SAAS ESSENTIALS:
- Scalable architecture patterns
- Database design for multi-tenancy
- Payment integration (Stripe subscriptions)
- Email notification system
- Advanced security measures
- Performance monitoring
- Feature flags system

OUTPUT: Complete Next.js SaaS application with authentication, billing, and core functionality.`;
  }

  getLandingPrompt() {
    return `You are a conversion-optimized landing page expert. Generate a high-converting landing page with:

CONVERSION ELEMENTS:
- Compelling hero section with clear value proposition
- Social proof (testimonials, reviews, logos)
- Feature benefits (not just features)
- Pricing section with clear CTAs
- FAQ section addressing objections
- Contact/demo request forms
- Trust signals and guarantees
- Mobile-optimized design

PERFORMANCE:
- Fast loading animations
- Optimized images and assets
- Clean, professional design
- Clear information hierarchy
- Strong call-to-action buttons
- A/B test ready structure

OUTPUT: Complete Next.js landing page optimized for conversions with modern design.`;
  }

  getBlogPrompt() {
    return `You are a content management expert. Generate a complete blog/CMS platform with:

CONTENT FEATURES:
- Article creation and editing
- Category and tag management
- Author profiles and management
- Comments system with moderation
- Search functionality
- SEO optimization tools
- Content scheduling
- Media library management
- Newsletter integration

TECHNICAL FEATURES:
- Markdown support with live preview
- Image optimization and CDN
- Social media sharing
- Analytics integration
- RSS feeds
- Site map generation
- Performance optimization

OUTPUT: Complete Next.js blog/CMS with admin panel and content management features.`;
  }

  getDashboardPrompt() {
    return `You are a data visualization and dashboard expert. Generate a comprehensive dashboard with:

VISUALIZATION FEATURES:
- Interactive charts and graphs (Chart.js/Recharts)
- Real-time data updates
- Customizable widgets
- Data filtering and drilling down
- Export functionality (PDF, Excel)
- Multiple dashboard views
- KPI tracking and alerts
- Comparative analysis tools

TECHNICAL FEATURES:
- Responsive design for all devices
- Fast data loading and caching
- User permission levels
- Customizable layouts
- Dark/light theme support
- Performance optimization

OUTPUT: Complete Next.js dashboard with interactive charts and data management.`;
  }

  getAPIPrompt() {
    return `You are a backend API development expert. Generate a complete REST API with:

API FEATURES:
- RESTful endpoint structure
- Authentication and authorization (JWT)
- Data validation and sanitization
- Error handling and logging
- Rate limiting and security
- API documentation (OpenAPI/Swagger)
- Database integration
- File upload handling
- Email notification system

TECHNICAL FEATURES:
- Middleware for common tasks
- Environment configuration
- Database migrations
- Testing suite setup
- Performance optimization
- Security best practices
- Monitoring and health checks

OUTPUT: Complete Next.js API with all routes, middleware, and documentation.`;
  }

  // Méthode utilitaire pour les tests
  async testGeneration(domain, prompt) {
    console.log(`🧪 Testing BAML Pragmatic for domain: ${domain}`);
    const testPrompt = `${domain}: ${prompt}`;
    return await this.generate(testPrompt);
  }
}