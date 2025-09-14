// src/quality/enhancer.js - Amélioration Qualité Automatique
export class QualityEnhancer {
  constructor() {
    this.qualityRules = this.initializeRules();
    this.minScore = 8; // Score minimum sur 10
  }

  async enhance(output, originalPrompt = '') {
    console.log('🔍 Analyse qualité en cours...');

    const score = this.evaluate(output);
    console.log(`📊 Score qualité: ${score}/10`);

    if (score < this.minScore) {
      console.log('⚠️ Qualité insuffisante, amélioration nécessaire');
      const issues = this.detectIssues(output);
      return await this.fixIssues(output, issues, originalPrompt);
    }

    console.log('✅ Qualité acceptable');
    return {
      enhanced: output,
      score,
      improvements: []
    };
  }

  evaluate(output) {
    let score = 10;
    const issues = [];

    // Vérification structure JSON
    if (!this.isValidJSON(output)) {
      score -= 3;
      issues.push('Invalid JSON structure');
    }

    // Vérification contenu
    try {
      const parsed = JSON.parse(output);

      // Vérifier les champs requis
      if (!parsed.name || !parsed.files) {
        score -= 2;
        issues.push('Missing required fields');
      }

      // Vérifier la qualité des fichiers
      if (parsed.files && Array.isArray(parsed.files)) {
        const fileScore = this.evaluateFiles(parsed.files);
        score = Math.min(score, fileScore);
      }

      // Vérifier la cohérence
      const coherenceScore = this.evaluateCoherence(parsed);
      score = Math.min(score, coherenceScore);

    } catch (e) {
      score = 3; // JSON invalide
      issues.push('JSON parsing failed');
    }

    return Math.max(0, Math.min(10, score));
  }

  isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  evaluateFiles(files) {
    let score = 10;

    for (const file of files) {
      // Vérifier la structure du fichier
      if (!file.path || !file.content || !file.type) {
        score -= 1;
        continue;
      }

      // Vérifier le contenu selon le type
      const contentScore = this.evaluateFileContent(file);
      if (contentScore < 8) {
        score -= (10 - contentScore) * 0.2;
      }
    }

    return Math.max(5, score);
  }

  evaluateFileContent(file) {
    const { content, type, path } = file;

    switch (type) {
      case 'component':
        return this.evaluateReactComponent(content);
      case 'page':
        return this.evaluateReactPage(content);
      case 'api':
        return this.evaluateApiRoute(content);
      case 'style':
        return this.evaluateCSS(content);
      default:
        return 8; // Score neutre pour types inconnus
    }
  }

  evaluateReactComponent(content) {
    let score = 10;

    // Vérifications React
    if (!content.includes('export default') && !content.includes('export const')) {
      score -= 2;
    }

    if (!content.includes('import React') && !content.includes('import {')) {
      score -= 1;
    }

    // Vérifier hooks React
    const hasHooks = content.includes('useState') || content.includes('useEffect') || content.includes('useContext');
    if (content.includes('function ') && !hasHooks && content.length > 200) {
      score -= 1; // Composant complexe sans hooks
    }

    // Vérifier Tailwind CSS
    if (content.includes('className') && !content.includes('className="')) {
      score -= 1; // Problème de syntaxe className
    }

    return Math.max(5, score);
  }

  evaluateReactPage(content) {
    let score = 10;

    // Vérifications pages Next.js
    if (!content.includes('export default')) {
      score -= 2;
    }

    // Vérifier SEO
    if (!content.includes('Head') && !content.includes('<title>')) {
      score -= 1;
    }

    // Vérifier responsive design
    if (content.includes('className') && !content.includes('md:') && !content.includes('lg:')) {
      score -= 1;
    }

    return Math.max(5, score);
  }

  evaluateApiRoute(content) {
    let score = 10;

    // Vérifications API Next.js
    if (!content.includes('export default') && !content.includes('export async function')) {
      score -= 2;
    }

    // Vérifier gestion erreurs
    if (!content.includes('try') || !content.includes('catch')) {
      score -= 1;
    }

    return Math.max(5, score);
  }

  evaluateCSS(content) {
    let score = 10;

    // Vérifications CSS/Tailwind
    if (content.includes('!important')) {
      score -= 1; // Éviter !important
    }

    return Math.max(7, score);
  }

  evaluateCoherence(parsed) {
    let score = 10;

    // Vérifier cohérence des imports
    const importIssues = this.checkImportCoherence(parsed.files || []);
    score -= importIssues * 0.5;

    // Vérifier cohérence des noms
    const namingIssues = this.checkNamingCoherence(parsed);
    score -= namingIssues * 0.3;

    return Math.max(6, score);
  }

  checkImportCoherence(files) {
    let issues = 0;
    const componentNames = new Set();

    // Collecter les noms de composants
    files.forEach(file => {
      if (file.type === 'component') {
        const match = file.path.match(/([^/]+)\.js$/);
        if (match) {
          componentNames.add(match[1]);
        }
      }
    });

    // Vérifier les imports
    files.forEach(file => {
      const imports = file.content.match(/import.*from ['"](\.\.?\/.*)['"]/g) || [];

      imports.forEach(importLine => {
        const pathMatch = importLine.match(/from ['"](\.\.?\/.*)['"]/);
        if (pathMatch) {
          const importPath = pathMatch[1];
          const componentMatch = importLine.match(/import\s+{?([^}]+)}?/);

          if (componentMatch) {
            const importedNames = componentMatch[1].split(',').map(n => n.trim());
            // Vérifier que les imports existent
            importedNames.forEach(name => {
              if (!componentNames.has(name) && !name.includes('use') && name !== 'React') {
                issues++;
              }
            });
          }
        }
      });
    });

    return Math.min(issues, 5);
  }

  checkNamingCoherence(parsed) {
    let issues = 0;

    if (parsed.files) {
      parsed.files.forEach(file => {
        // Vérifier convention nommage fichiers
        if (file.type === 'component' && !file.path.match(/^[A-Z][a-zA-Z]*\.js$/)) {
          if (!file.path.includes('/')) { // Ignorer les paths complets
            issues++;
          }
        }

        // Vérifier cohérence nom fichier / contenu
        const fileName = file.path.split('/').pop().replace('.js', '');
        if (file.type === 'component' && !file.content.includes(`function ${fileName}`) && !file.content.includes(`const ${fileName}`)) {
          issues++;
        }
      });
    }

    return Math.min(issues, 3);
  }

  detectIssues(output) {
    const issues = [];

    // JSON invalide
    if (!this.isValidJSON(output)) {
      issues.push({
        type: 'json_invalid',
        severity: 'critical',
        description: 'JSON structure is invalid'
      });
      return issues;
    }

    try {
      const parsed = JSON.parse(output);

      // Champs manquants
      if (!parsed.name) {
        issues.push({
          type: 'missing_field',
          severity: 'high',
          field: 'name',
          description: 'Application name is missing'
        });
      }

      if (!parsed.files || !Array.isArray(parsed.files)) {
        issues.push({
          type: 'missing_field',
          severity: 'critical',
          field: 'files',
          description: 'Files array is missing or invalid'
        });
      }

      // Vérifications fichiers
      if (parsed.files) {
        parsed.files.forEach((file, index) => {
          if (!file.path) {
            issues.push({
              type: 'file_invalid',
              severity: 'high',
              fileIndex: index,
              description: 'File path is missing'
            });
          }

          if (!file.content) {
            issues.push({
              type: 'file_empty',
              severity: 'medium',
              fileIndex: index,
              description: 'File content is empty'
            });
          }
        });
      }

    } catch (e) {
      issues.push({
        type: 'json_parse_error',
        severity: 'critical',
        description: 'JSON parsing failed: ' + e.message
      });
    }

    return issues;
  }

  async fixIssues(output, issues, originalPrompt) {
    console.log(`🔧 Correction de ${issues.length} problèmes...`);

    let fixed = output;
    const improvements = [];

    for (const issue of issues) {
      try {
        const result = await this.fixSingleIssue(fixed, issue, originalPrompt);
        fixed = result.fixed;
        improvements.push(result.improvement);
      } catch (error) {
        console.warn(`Impossible de corriger: ${issue.type}`, error.message);
      }
    }

    const finalScore = this.evaluate(fixed);
    console.log(`✨ Score après amélioration: ${finalScore}/10`);

    return {
      enhanced: fixed,
      score: finalScore,
      improvements
    };
  }

  async fixSingleIssue(output, issue, originalPrompt) {
    switch (issue.type) {
      case 'json_invalid':
        return this.fixJSONStructure(output);

      case 'missing_field':
        return this.fixMissingField(output, issue.field, originalPrompt);

      case 'file_invalid':
      case 'file_empty':
        return this.fixFileIssue(output, issue);

      default:
        return { fixed: output, improvement: `Skipped unknown issue: ${issue.type}` };
    }
  }

  fixJSONStructure(output) {
    // Tentative de réparation JSON
    let fixed = output.trim();

    // Supprimer texte avant/après JSON
    const jsonMatch = fixed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      fixed = jsonMatch[0];
    }

    // Corrections communes
    fixed = fixed
      .replace(/,(\s*[}\]])/g, '$1') // Virgules finales
      .replace(/'/g, '"')           // Quotes simples -> doubles
      .replace(/(\w+):/g, '"$1":'); // Clés sans quotes

    try {
      JSON.parse(fixed);
      return {
        fixed,
        improvement: 'Fixed JSON structure'
      };
    } catch (e) {
      // Fallback: créer JSON minimal valide
      const fallback = {
        name: "Generated App",
        description: "Generated application",
        files: [],
        dependencies: [],
        instructions: ["npm install", "npm run dev"]
      };

      return {
        fixed: JSON.stringify(fallback, null, 2),
        improvement: 'Created fallback JSON structure'
      };
    }
  }

  fixMissingField(output, field, originalPrompt) {
    try {
      const parsed = JSON.parse(output);

      switch (field) {
        case 'name':
          parsed.name = this.generateAppName(originalPrompt);
          break;
        case 'files':
          parsed.files = [];
          break;
        case 'dependencies':
          parsed.dependencies = ['react', 'next', 'tailwindcss'];
          break;
      }

      return {
        fixed: JSON.stringify(parsed, null, 2),
        improvement: `Added missing field: ${field}`
      };
    } catch (e) {
      return { fixed: output, improvement: `Could not fix missing field: ${field}` };
    }
  }

  fixFileIssue(output, issue) {
    try {
      const parsed = JSON.parse(output);

      if (parsed.files && parsed.files[issue.fileIndex]) {
        const file = parsed.files[issue.fileIndex];

        if (!file.path) {
          file.path = `Component${issue.fileIndex}.js`;
        }

        if (!file.content) {
          file.content = this.generateBasicFileContent(file.type || 'component');
        }

        if (!file.type) {
          file.type = 'component';
        }
      }

      return {
        fixed: JSON.stringify(parsed, null, 2),
        improvement: `Fixed file issue at index ${issue.fileIndex}`
      };
    } catch (e) {
      return { fixed: output, improvement: `Could not fix file issue: ${issue.type}` };
    }
  }

  generateAppName(prompt) {
    // Extraire nom potentiel du prompt
    const words = prompt.toLowerCase().split(' ');
    const meaningful = words.filter(w =>
      w.length > 3 &&
      !['create', 'build', 'make', 'develop', 'website', 'application', 'app'].includes(w)
    );

    if (meaningful.length > 0) {
      return meaningful[0].charAt(0).toUpperCase() + meaningful[0].slice(1) + 'App';
    }

    return 'GeneratedApp';
  }

  generateBasicFileContent(type) {
    const templates = {
      component: `import React from 'react';

export default function Component() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Component</h1>
    </div>
  );
}`,

      page: `import React from 'react';
import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
        <title>Page</title>
      </Head>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold">Page</h1>
      </div>
    </>
  );
}`,

      api: `export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ message: 'API endpoint' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}`
    };

    return templates[type] || templates.component;
  }

  initializeRules() {
    return {
      json: {
        weight: 3,
        check: (output) => this.isValidJSON(output)
      },
      completeness: {
        weight: 2,
        check: (parsed) => parsed.name && parsed.files
      },
      fileQuality: {
        weight: 2,
        check: (parsed) => parsed.files && parsed.files.every(f => f.path && f.content)
      },
      coherence: {
        weight: 2,
        check: (parsed) => this.checkImportCoherence(parsed.files || []) < 2
      },
      bestPractices: {
        weight: 1,
        check: (parsed) => true // Placeholder pour vérifications avancées
      }
    };
  }
}