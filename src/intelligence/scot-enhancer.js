// src/intelligence/scot-enhancer.js - Chain-of-Thought Structuré
export class SCoTEnhancer {
  constructor() {
    this.templates = {
      ecommerce: this.getEcommerceTemplate(),
      saas: this.getSaasTemplate(),
      dashboard: this.getDashboardTemplate(),
      landing: this.getLandingTemplate()
    };
  }

  enhancePrompt(userPrompt, appType = 'ecommerce') {
    const template = this.templates[appType] || this.templates.ecommerce;

    return `
<thinking>
L'utilisateur demande: "${userPrompt}"

Analysons les besoins:
1. Type d'application: ${this.detectAppType(userPrompt)}
2. Fonctionnalités principales: ${this.extractMainFeatures(userPrompt)}
3. Complexité estimée: ${this.estimateComplexity(userPrompt)}
4. Technologies appropriées: React/Next.js + Tailwind + Context API
</thinking>

<planning>
Structure nécessaire pour: ${userPrompt}

Architecture recommandée:
${template.architecture}

Pages requises:
${template.pages}

Composants clés:
${template.components}

État global:
${template.state}
</planning>

<implementation>
Génère une application complète avec:

1. Structure de fichiers moderne
2. Composants React fonctionnels avec hooks
3. Pages Next.js avec routing
4. Styling Tailwind responsive
5. État géré avec Context API
6. API routes si nécessaire
7. Configuration complète

IMPORTANT: Assure-toi que tous les imports sont corrects et que l'app démarre sans erreur.
</implementation>

<verification>
Vérifie que:
- Tous les composants sont exportés correctement
- Les imports correspondent aux fichiers créés
- Le CSS Tailwind est cohérent
- Les hooks React sont utilisés correctement
- L'architecture est scalable
- Le code est production-ready
</verification>

Maintenant génère l'application complète basée sur: "${userPrompt}"
    `;
  }

  detectAppType(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('shop') || lowerPrompt.includes('store') || lowerPrompt.includes('marketplace')) {
      return 'ecommerce';
    }
    if (lowerPrompt.includes('saas') || lowerPrompt.includes('software') || lowerPrompt.includes('platform')) {
      return 'saas';
    }
    if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('admin') || lowerPrompt.includes('analytics')) {
      return 'dashboard';
    }
    if (lowerPrompt.includes('landing') || lowerPrompt.includes('marketing') || lowerPrompt.includes('promo')) {
      return 'landing';
    }

    return 'ecommerce'; // Default
  }

  extractMainFeatures(prompt) {
    const features = [];
    const lowerPrompt = prompt.toLowerCase();

    // Common features detection
    if (lowerPrompt.includes('auth') || lowerPrompt.includes('login') || lowerPrompt.includes('register')) {
      features.push('Authentication');
    }
    if (lowerPrompt.includes('cart') || lowerPrompt.includes('panier')) {
      features.push('Shopping Cart');
    }
    if (lowerPrompt.includes('payment') || lowerPrompt.includes('stripe') || lowerPrompt.includes('paypal')) {
      features.push('Payment Processing');
    }
    if (lowerPrompt.includes('search') || lowerPrompt.includes('filter')) {
      features.push('Search & Filter');
    }
    if (lowerPrompt.includes('admin') || lowerPrompt.includes('dashboard')) {
      features.push('Admin Panel');
    }
    if (lowerPrompt.includes('chat') || lowerPrompt.includes('message')) {
      features.push('Messaging System');
    }

    return features.length > 0 ? features.join(', ') : 'Core functionality';
  }

  estimateComplexity(prompt) {
    const words = prompt.split(' ').length;
    const features = this.extractMainFeatures(prompt).split(', ').length;

    if (words < 50 && features < 3) return 'Simple';
    if (words < 150 && features < 6) return 'Medium';
    return 'Complex';
  }

  getEcommerceTemplate() {
    return {
      architecture: `
- Frontend: Next.js 13+ avec App Router
- Styling: Tailwind CSS
- État: Context API + useReducer
- Base de données: Mock data ou API externe
- Paiements: Intégration Stripe (mock)`,

      pages: `
- Homepage avec hero + produits featured
- Catalogue produits avec filtres
- Page produit détaillée
- Panier d'achat
- Checkout process
- Profil utilisateur
- Admin dashboard (optionnel)`,

      components: `
- Header avec navigation et cart
- ProductCard pour affichage produits
- SearchBar avec filtres
- ShoppingCart sidebar
- ProductGallery avec zoom
- ReviewSystem avec étoiles
- Footer avec liens`,

      state: `
- CartContext pour panier
- UserContext pour authentication
- ProductsContext pour catalogue
- UIContext pour modals/loading`
    };
  }

  getSaasTemplate() {
    return {
      architecture: `
- Frontend: Next.js avec TypeScript
- Styling: Tailwind + Radix UI
- État: Zustand ou Context API
- API: Next.js API routes
- Auth: NextAuth.js`,

      pages: `
- Landing page marketing
- Dashboard principal
- Settings & profil
- Billing & pricing
- Documentation/Help
- Admin panel`,

      components: `
- Navigation responsive
- Dashboard widgets
- Data tables
- Charts & analytics
- Settings forms
- Subscription management`,

      state: `
- AuthContext pour utilisateur
- AppContext pour données app
- SubscriptionContext pour billing
- NotificationContext pour alerts`
    };
  }

  getDashboardTemplate() {
    return {
      architecture: `
- Frontend: Next.js + TypeScript
- Styling: Tailwind CSS
- Charts: Recharts ou Chart.js
- État: Context API
- Data: Mock API ou external`,

      pages: `
- Dashboard overview
- Analytics détaillées
- Data management
- Reports & exports
- User management
- Settings`,

      components: `
- Sidebar navigation
- StatCards pour KPIs
- Charts components
- DataTable avec pagination
- FilterBar pour données
- ExportButton pour rapports`,

      state: `
- DataContext pour analytics
- UserContext pour permissions
- FiltersContext pour vues
- UIContext pour sidebar`
    };
  }

  getLandingTemplate() {
    return {
      architecture: `
- Frontend: Next.js statique
- Styling: Tailwind CSS
- Animations: Framer Motion
- SEO: Next.js head optimization
- Deployment: Vercel ready`,

      pages: `
- Homepage avec sections
- About/Company page
- Services/Features page
- Contact & support
- Blog (optionnel)
- Pricing (optionnel)`,

      components: `
- Hero section animée
- Features showcase
- Testimonials carousel
- CTA buttons
- Contact form
- Footer avec liens sociaux`,

      state: `
- ContactContext pour forms
- UIContext pour animations
- ThemeContext pour dark/light
- ModalContext pour popups`
    };
  }

  // Méthode pour améliorer un prompt existant
  improvePrompt(originalPrompt) {
    const improved = this.enhancePrompt(originalPrompt);

    // Ajouter des instructions spécifiques selon le type détecté
    const appType = this.detectAppType(originalPrompt);
    const specificInstructions = this.getSpecificInstructions(appType);

    return improved + '\n\n' + specificInstructions;
  }

  getSpecificInstructions(appType) {
    const instructions = {
      ecommerce: `
SPÉCIFIQUE E-COMMERCE:
- Utilise des images placeholder réalistes
- Implémente un système de filtres fonctionnel
- Ajoute des animations sur hover des produits
- Code un panier avec localStorage
- Inclus des reviews et ratings`,

      saas: `
SPÉCIFIQUE SAAS:
- Dashboard avec vraies métriques simulées
- Système d'onboarding multi-étapes
- Modals et notifications toast
- Tables de données avec tri/pagination
- Thème dark/light`,

      dashboard: `
SPÉCIFIQUE DASHBOARD:
- Charts interactifs avec données réelles
- Filtres de dates fonctionnels
- Export CSV/PDF
- Responsive design pour mobile
- Loading states et error handling`,

      landing: `
SPÉCIFIQUE LANDING:
- Animations smooth et performantes
- CTAs optimisés pour conversion
- SEO parfait avec meta tags
- Performance 100/100 Lighthouse
- Mobile-first responsive`
    };

    return instructions[appType] || instructions.ecommerce;
  }
}