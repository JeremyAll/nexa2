// src/cache/semantic-cache.js - Cache Sémantique Simple mais Efficace
import fs from 'fs/promises';
import path from 'path';

export class SemanticCache {
  constructor() {
    this.cache = new Map();
    this.cachePath = './data/cache';
    this.maxCacheSize = 100; // Limite de 100 entrées
    this.similarityThreshold = 0.75; // 75% de similarité minimum
  }

  async init() {
    // Créer le dossier de cache
    await fs.mkdir(this.cachePath, { recursive: true });

    // Charger le cache depuis le disque
    await this.loadFromDisk();
  }

  async getCached(prompt) {
    // Normaliser le prompt
    const normalized = this.normalizePrompt(prompt);

    // Recherche exacte d'abord
    if (this.cache.has(normalized)) {
      const entry = this.cache.get(normalized);
      entry.lastAccessed = Date.now();
      entry.hits++;
      return entry.result;
    }

    // Recherche approximative
    for (const [key, value] of this.cache.entries()) {
      const similarity = this.calculateSimilarity(normalized, key);

      if (similarity >= this.similarityThreshold) {
        console.log(`📦 Cache hit avec ${(similarity * 100).toFixed(1)}% similarité`);

        // Mettre à jour les stats
        value.lastAccessed = Date.now();
        value.hits++;

        return value.result;
      }
    }

    return null;
  }

  async setCached(prompt, result, metadata = {}) {
    const normalized = this.normalizePrompt(prompt);

    // Vérifier la taille du cache
    if (this.cache.size >= this.maxCacheSize) {
      await this.evictOldest();
    }

    const entry = {
      prompt: normalized,
      result,
      metadata,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      hits: 0
    };

    this.cache.set(normalized, entry);

    // Sauvegarder sur disque de façon asynchrone
    this.saveToDisk().catch(console.error);

    console.log(`💾 Prompt mis en cache (taille: ${this.cache.size})`);
  }

  normalizePrompt(prompt) {
    return prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Supprimer ponctuation
      .replace(/\s+/g, ' ')    // Normaliser espaces
      .trim()
      .slice(0, 500); // Limiter à 500 chars pour éviter les clés trop longues
  }

  calculateSimilarity(str1, str2) {
    // Similarité basée sur les mots communs
    const words1 = new Set(str1.split(' ').filter(w => w.length > 3));
    const words2 = new Set(str2.split(' ').filter(w => w.length > 3));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    // Jaccard similarity avec bonus pour longueur similaire
    const jaccard = intersection.size / union.size;
    const lengthBonus = 1 - Math.abs(str1.length - str2.length) / Math.max(str1.length, str2.length) * 0.3;

    return Math.min(jaccard * lengthBonus, 1);
  }

  async evictOldest() {
    // Supprimer l'entrée la moins récemment utilisée
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Éviction du cache: entrée ancienne supprimée`);
    }
  }

  async saveToDisk() {
    try {
      const cacheData = Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        ...value
      }));

      const filePath = path.join(this.cachePath, 'semantic-cache.json');
      await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.warn('Erreur sauvegarde cache:', error.message);
    }
  }

  async loadFromDisk() {
    try {
      const filePath = path.join(this.cachePath, 'semantic-cache.json');
      const data = await fs.readFile(filePath, 'utf-8');
      const cacheData = JSON.parse(data);

      // Restaurer le cache en Map
      this.cache.clear();
      for (const entry of cacheData) {
        const { key, ...value } = entry;
        this.cache.set(key, value);
      }

      console.log(`📁 Cache restauré: ${this.cache.size} entrées`);
    } catch (error) {
      console.log('Aucun cache à restaurer (premier démarrage)');
    }
  }

  // Méthodes utilitaires pour monitoring
  getStats() {
    const stats = {
      size: this.cache.size,
      totalHits: 0,
      avgHits: 0,
      oldestEntry: null,
      newestEntry: null
    };

    let oldestTime = Date.now();
    let newestTime = 0;

    for (const [key, value] of this.cache.entries()) {
      stats.totalHits += value.hits;

      if (value.createdAt < oldestTime) {
        oldestTime = value.createdAt;
        stats.oldestEntry = new Date(value.createdAt).toISOString();
      }

      if (value.createdAt > newestTime) {
        newestTime = value.createdAt;
        stats.newestEntry = new Date(value.createdAt).toISOString();
      }
    }

    stats.avgHits = stats.size > 0 ? (stats.totalHits / stats.size).toFixed(2) : 0;

    return stats;
  }

  async clearCache() {
    this.cache.clear();

    try {
      const filePath = path.join(this.cachePath, 'semantic-cache.json');
      await fs.unlink(filePath);
      console.log('🧹 Cache vidé complètement');
    } catch (error) {
      console.log('Cache vidé (pas de fichier à supprimer)');
    }
  }

  // Préchargement de patterns communs
  async preloadCommonPatterns() {
    const commonPatterns = [
      {
        prompt: "create ecommerce website online store",
        type: "ecommerce",
        features: ["products", "cart", "checkout", "auth"]
      },
      {
        prompt: "build saas dashboard analytics platform",
        type: "saas",
        features: ["dashboard", "charts", "subscription", "auth"]
      },
      {
        prompt: "make landing page marketing website",
        type: "landing",
        features: ["hero", "features", "testimonials", "contact"]
      }
    ];

    for (const pattern of commonPatterns) {
      const normalized = this.normalizePrompt(pattern.prompt);

      // Seulement si pas déjà en cache
      if (!this.cache.has(normalized)) {
        this.cache.set(normalized, {
          prompt: normalized,
          result: null, // Sera rempli lors de la première génération
          metadata: {
            ...pattern,
            preloaded: true
          },
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          hits: 0
        });
      }
    }

    console.log(`🚀 ${commonPatterns.length} patterns préchargés`);
  }

  // Analyse de performance du cache
  analyzePerformance() {
    const analysis = {
      hitRate: 0,
      mostPopular: null,
      leastPopular: null,
      suggestions: []
    };

    let maxHits = 0;
    let minHits = Infinity;
    let totalRequests = 0;

    for (const [key, value] of this.cache.entries()) {
      totalRequests += value.hits;

      if (value.hits > maxHits) {
        maxHits = value.hits;
        analysis.mostPopular = key.slice(0, 50) + '...';
      }

      if (value.hits < minHits) {
        minHits = value.hits;
        analysis.leastPopular = key.slice(0, 50) + '...';
      }
    }

    analysis.hitRate = this.cache.size > 0 ? (totalRequests / this.cache.size).toFixed(2) : 0;

    // Suggestions d'amélioration
    if (analysis.hitRate < 2) {
      analysis.suggestions.push("Taux de hit faible - considérer réduire le seuil de similarité");
    }

    if (this.cache.size < 10) {
      analysis.suggestions.push("Cache petit - considérer précharger des patterns communs");
    }

    return analysis;
  }
}