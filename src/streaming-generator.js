import { EventEmitter } from 'events';
import { StreamingHandler } from './streaming-handler.js';
import { SCoTEnhancer } from './intelligence/scot-enhancer.js';
import { SemanticCache } from './cache/semantic-cache.js';
import { QualityEnhancer } from './quality/enhancer.js';
import { UnsplashService } from './unsplash-service.js';

export class StreamingGenerator extends EventEmitter {
  constructor(apiKey) {
    super();

    // Services intégrés
    this.streamingHandler = new StreamingHandler();
    this.scotEnhancer = new SCoTEnhancer();
    this.semanticCache = new SemanticCache();
    this.qualityEnhancer = new QualityEnhancer();
    this.unsplash = new UnsplashService();

    // Configuration
    this.useCache = true;
    this.enhancePrompts = true;
    this.qualityCheck = true;
  }

  async init() {
    // Initialiser le cache sémantique
    await this.semanticCache.init();
    await this.semanticCache.preloadCommonPatterns();
  }

  async generate(userPrompt, metadata = {}) {
    const startTime = Date.now();
    console.log('🚀 Génération avancée démarrée');

    try {
      // Étape 0: Vérifier le cache sémantique
      if (this.useCache) {
        this.emit('progress', {
          step: 'cache_check',
          progress: 5,
          message: 'Vérification du cache sémantique...'
        });

        const cached = await this.semanticCache.getCached(userPrompt);
        if (cached) {
          console.log('🎯 Cache hit - génération instantanée');
          this.emit('progress', {
            step: 'cache_hit',
            progress: 100,
            message: 'Résultat trouvé en cache'
          });

          return {
            ...cached,
            cached: true,
            processingTime: Date.now() - startTime
          };
        }
      }

      // Étape 1: Amélioration du prompt avec SCoT
      this.emit('progress', {
        step: 'prompt_enhancement',
        progress: 10,
        message: 'Amélioration du prompt avec Chain-of-Thought...'
      });

      let enhancedPrompt = userPrompt;
      if (this.enhancePrompts) {
        enhancedPrompt = this.scotEnhancer.enhancePrompt(userPrompt);
        console.log('✨ Prompt amélioré avec SCoT');
      }

      // Étape 2: Génération streaming principale
      this.emit('progress', {
        step: 'main_generation',
        progress: 20,
        message: 'Génération streaming en cours...'
      });

      const rawResult = await this.streamingHandler.generateWithStream(
        enhancedPrompt,
        (progressData) => {
          // Propager les événements de streaming
          this.emit('progress', {
            step: 'streaming',
            progress: 20 + (progressData.processed || 0) / 10,
            message: progressData.preview ? `Génération: ...${progressData.preview}` : 'Streaming...'
          });
        }
      );

      // Étape 3: Amélioration qualité
      this.emit('progress', {
        step: 'quality_enhancement',
        progress: 80,
        message: 'Amélioration de la qualité...'
      });

      let finalResult = rawResult;
      let qualityReport = { score: 10, improvements: [] };

      if (this.qualityCheck) {
        const qualityResult = await this.qualityEnhancer.enhance(rawResult, userPrompt);
        finalResult = qualityResult.enhanced;
        qualityReport = {
          score: qualityResult.score,
          improvements: qualityResult.improvements
        };
        console.log(`🔧 Qualité améliorée - Score: ${qualityResult.score}/10`);
      }

      // Étape 4: Enrichissement avec images
      this.emit('progress', {
        step: 'image_fetching',
        progress: 90,
        message: 'Ajout des images...'
      });

      const enrichedResult = await this.enrichWithImages(finalResult, userPrompt);

      // Étape 5: Mise en cache
      this.emit('progress', {
        step: 'caching',
        progress: 95,
        message: 'Mise en cache...'
      });

      if (this.useCache && qualityReport.score >= 8) {
        await this.semanticCache.setCached(userPrompt, enrichedResult, {
          qualityScore: qualityReport.score,
          generatedAt: Date.now(),
          processingTime: Date.now() - startTime,
          ...metadata
        });
        console.log('💾 Résultat mis en cache');
      }

      // Résultat final
      this.emit('progress', {
        step: 'complete',
        progress: 100,
        message: 'Génération terminée avec succès'
      });

      const finalOutput = {
        ...enrichedResult,
        metadata: {
          ...metadata,
          processingTime: Date.now() - startTime,
          qualityScore: qualityReport.score,
          improvements: qualityReport.improvements,
          cached: false,
          generatedAt: Date.now()
        }
      };

      console.log(`✅ Génération complète en ${Date.now() - startTime}ms`);
      return finalOutput;

    } catch (error) {
      console.error('❌ Erreur génération:', error);

      this.emit('progress', {
        step: 'error',
        progress: 0,
        message: `Erreur: ${error.message}`
      });

      // Fallback: retourner structure basique
      return this.createFallbackResult(userPrompt, error);
    }
  }

  async enrichWithImages(result, originalPrompt) {
    try {
      // Tenter de parser le résultat
      let parsed;
      if (typeof result === 'string') {
        parsed = JSON.parse(result);
      } else {
        parsed = result;
      }

      // Déterminer les mots-clés pour images
      const imageKeywords = this.extractImageKeywords(originalPrompt, parsed);

      if (imageKeywords.length > 0) {
        const images = {};

        for (const keyword of imageKeywords.slice(0, 3)) { // Max 3 catégories
          try {
            const unsplashImages = await this.unsplash.searchImages(keyword, 2);
            images[keyword] = unsplashImages;
          } catch (error) {
            console.warn(`Images pour "${keyword}" non disponibles:`, error.message);
            images[keyword] = [];
          }
        }

        parsed.images = images;
      }

      return parsed;
    } catch (error) {
      console.warn('Enrichissement images échoué:', error.message);
      return result; // Retourner résultat sans images
    }
  }

  extractImageKeywords(prompt, parsedResult) {
    const keywords = [];
    const lowerPrompt = prompt.toLowerCase();

    // Mots-clés basés sur le type d'app
    if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('shop')) {
      keywords.push('products', 'shopping', 'business');
    } else if (lowerPrompt.includes('food') || lowerPrompt.includes('restaurant')) {
      keywords.push('food', 'restaurant', 'cooking');
    } else if (lowerPrompt.includes('travel') || lowerPrompt.includes('vacation')) {
      keywords.push('travel', 'vacation', 'landscape');
    } else if (lowerPrompt.includes('tech') || lowerPrompt.includes('software')) {
      keywords.push('technology', 'software', 'computer');
    } else {
      // Mots-clés génériques
      keywords.push('business', 'office', 'modern');
    }

    // Ajouter mots-clés du nom de l'app si disponible
    if (parsedResult && parsedResult.name) {
      const appName = parsedResult.name.toLowerCase();
      if (appName.includes('music')) keywords.push('music');
      if (appName.includes('fitness')) keywords.push('fitness');
      if (appName.includes('education')) keywords.push('education');
    }

    return [...new Set(keywords)]; // Supprimer doublons
  }

  createFallbackResult(prompt, error) {
    const appName = this.extractAppName(prompt) || 'GeneratedApp';

    return {
      projectType: 'fallback',
      name: appName,
      description: `Application générée à partir de: "${prompt}"`,
      error: error.message,
      pages: [{
        name: 'Home',
        path: '/',
        components: ['Header', 'Footer'],
        layout: 'Basic homepage layout',
        seo: { title: appName, description: 'Generated application' }
      }],
      components: [
        { name: 'Header', props: [], hooks: [], dependencies: [] },
        { name: 'Footer', props: [], hooks: [], dependencies: [] }
      ],
      contexts: [
        { name: 'AppContext', state: ['loading', 'user'], actions: ['setLoading'] }
      ],
      apiRoutes: [
        { path: '/api/health', method: 'GET', description: 'Health check' }
      ],
      images: {},
      designSystem: {
        colors: { primary: '#3B82F6', secondary: '#64748B' },
        typography: { fontFamily: 'Inter, sans-serif' }
      },
      metadata: {
        generatedAt: Date.now(),
        prompt,
        fallback: true,
        error: error.message
      }
    };
  }

  extractAppName(prompt) {
    // Simple extraction du nom depuis le prompt
    const words = prompt.split(' ');
    const meaningfulWords = words.filter(w =>
      w.length > 3 &&
      !['create', 'build', 'make', 'develop', 'application', 'app', 'website'].includes(w.toLowerCase())
    );

    if (meaningfulWords.length > 0) {
      return meaningfulWords[0].charAt(0).toUpperCase() + meaningfulWords[0].slice(1) + 'App';
    }

    return 'MyApp';
  }

  // Méthodes de configuration
  setCacheEnabled(enabled) {
    this.useCache = enabled;
    console.log(`Cache ${enabled ? 'activé' : 'désactivé'}`);
  }

  setPromptEnhancement(enabled) {
    this.enhancePrompts = enabled;
    console.log(`Amélioration prompts ${enabled ? 'activée' : 'désactivée'}`);
  }

  setQualityCheck(enabled) {
    this.qualityCheck = enabled;
    console.log(`Vérification qualité ${enabled ? 'activée' : 'désactivée'}`);
  }

  // Méthodes utilitaires
  async getCacheStats() {
    return this.semanticCache.getStats();
  }

  async clearCache() {
    return this.semanticCache.clearCache();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}