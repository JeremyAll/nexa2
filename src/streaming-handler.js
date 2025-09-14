// src/streaming-handler.js - SIMPLE ET EFFICACE
import Anthropic from '@anthropic-ai/sdk';

export class StreamingHandler {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
      timeout: 60000
    });
    this.model = 'claude-sonnet-4-20250514';
    this.systemPromptCache = null;
  }

  async generateWithStream(prompt, model = null, onProgress = () => {}) {
    // 1. Compression basique du prompt
    const optimized = this.compressPrompt(prompt);

    // Sélection du modèle et configuration adaptée
    const selectedModel = model || this.model;
    const config = this.getModelConfig(selectedModel);

    // 2. UN SEUL appel streaming avec config optimisée
    const stream = await this.client.messages.create({
      model: selectedModel,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: true, // CRITIQUE
      system: this.getSystemPrompt(config.complexity), // Mis en cache après 1er appel
      messages: [{
        role: 'user',
        content: optimized
      }]
    });

    // 3. Handler pour SSE avec progression
    return this.handleStreamWithProgress(stream, onProgress);
  }

  // Configuration par modèle pour optimiser performance
  getModelConfig(model) {
    const configs = {
      'claude-3-haiku-20240307': {
        maxTokens: 2000,
        temperature: 0.7,
        complexity: 'simple'
      },
      'claude-3-5-sonnet-20241022': {
        maxTokens: 8000,
        temperature: 0.7,
        complexity: 'detailed'
      },
      'claude-sonnet-4-20250514': {
        maxTokens: 12000,
        temperature: 0.7,
        complexity: 'comprehensive'
      }
    };

    return configs[model] || configs['claude-3-5-sonnet-20241022'];
  }

  compressPrompt(prompt) {
    // Compression simple mais efficace
    return prompt
      .replace(/please|could you|would you|can you/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/[.]{2,}/g, '...')
      .trim();
  }

  getSystemPrompt(complexity = 'detailed') {
    const cacheKey = `systemPrompt_${complexity}`;

    if (!this[cacheKey]) {
      const prompts = {
        simple: `You are a web application generator. Create simple, clean React components and applications.
Output valid JSON:
{
  "name": "app-name",
  "description": "brief description",
  "files": [{"path": "component.jsx", "content": "React code", "type": "component"}],
  "dependencies": ["react", "tailwindcss"]
}`,

        detailed: `You are an expert web application generator.
Generate complete, production-ready applications with:
- Modern React/Next.js architecture
- Tailwind CSS styling
- Complete file structure
- Working components and pages
- API routes when needed
- Responsive design

Output ONLY valid JSON in this structure:
{
  "name": "app-name",
  "description": "brief description",
  "files": [
    {
      "path": "relative/path/to/file",
      "content": "complete file content",
      "type": "component|page|api|style|config"
    }
  ],
  "dependencies": ["list", "of", "npm", "packages"],
  "instructions": ["setup", "steps"]
}`,

        comprehensive: `You are an expert full-stack web application architect and developer.
Generate complete, enterprise-grade applications with:
- Modern React/Next.js 13+ architecture with App Router
- Tailwind CSS with custom design system
- Complete file structure with proper organization
- Reusable components with TypeScript
- API routes with error handling
- Database integration patterns
- Authentication & authorization
- Responsive design with mobile-first approach
- Performance optimizations
- SEO best practices
- Testing structure

Output ONLY valid JSON in this comprehensive structure:
{
  "name": "app-name",
  "description": "detailed description",
  "files": [
    {
      "path": "relative/path/to/file",
      "content": "complete file content with proper imports and exports",
      "type": "component|page|api|style|config|middleware|hook|util"
    }
  ],
  "dependencies": ["comprehensive", "list", "of", "packages"],
  "devDependencies": ["development", "packages"],
  "scripts": {"dev": "next dev", "build": "next build"},
  "instructions": ["detailed", "setup", "steps"],
  "architecture": {
    "framework": "Next.js 13+",
    "styling": "Tailwind CSS",
    "state": "React Hooks + Context",
    "database": "recommended solution"
  }
}`
      };

      this[cacheKey] = prompts[complexity] || prompts.detailed;
    }

    return this[cacheKey];
  }

  async handleStreamWithProgress(stream, onProgress) {
    const chunks = [];
    let totalChunks = 0;
    let processedChunks = 0;

    try {
      for await (const message of stream) {
        if (message.type === 'content_block_delta') {
          const text = message.delta?.text || '';
          chunks.push(text);
          totalChunks++;

          // Callback de progression tous les 10 chunks
          if (totalChunks % 10 === 0) {
            onProgress({
              type: 'streaming',
              processed: totalChunks,
              preview: chunks.slice(-50).join('').slice(-200)
            });
          }
        }
      }

      const fullResult = chunks.join('');

      // Progression finale
      onProgress({
        type: 'complete',
        totalChunks,
        length: fullResult.length
      });

      return fullResult;

    } catch (error) {
      onProgress({
        type: 'error',
        error: error.message
      });
      throw error;
    }
  }

  // Méthode pour génération par chunks si nécessaire
  async generateLargeContent(prompt, maxChunkSize = 8000) {
    const sections = this.splitPromptIntoSections(prompt);
    const results = [];

    for (let i = 0; i < sections.length; i++) {
      const result = await this.generateWithStream(sections[i], (progress) => {
        console.log(`Section ${i + 1}/${sections.length}:`, progress);
      });
      results.push(result);
    }

    return this.combineResults(results);
  }

  splitPromptIntoSections(prompt) {
    // Simple splitting par phrases
    const sentences = prompt.split('. ');
    const sections = [];
    let currentSection = '';

    for (const sentence of sentences) {
      if ((currentSection + sentence).length > 1000) {
        if (currentSection) {
          sections.push(currentSection.trim());
          currentSection = sentence + '. ';
        }
      } else {
        currentSection += sentence + '. ';
      }
    }

    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }

    return sections.length > 0 ? sections : [prompt];
  }

  combineResults(results) {
    // Simple combinaison - peut être améliorée
    return results.join('\n\n');
  }
}