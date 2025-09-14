'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PremiumButton,
  GlassCard,
  FloatingOrbs,
  PremiumInput,
  GradientText,
  LoadingSpinner,
  ProgressiveReveal
} from '../components/ui/design-system.js';

export default function HomePage() {
  // État pour la génération
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState(new Map());
  const [previewHtml, setPreviewHtml] = useState('');

  // État pour l'interface
  const [prompt, setPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedDomain, setDetectedDomain] = useState('general');

  const steps = [
    { icon: '🧠', label: 'Analyse', message: 'Analyse intelligente du prompt...' },
    { icon: '💡', label: 'Architecture', message: 'Création de l\'architecture...' },
    { icon: '🎨', label: 'UI/UX', message: 'Génération des composants UI...' },
    { icon: '⚙️', label: 'Logique', message: 'Implémentation de la logique...' },
    { icon: '🔧', label: 'Integration', message: 'Assemblage des composants...' },
    { icon: '✨', label: 'Optimisation', message: 'Finalisation et optimisation...' },
    { icon: '🚀', label: 'Finalisation', message: 'Génération terminée !' }
  ];

  /**
   * Démarrer la génération
   */
  const startGeneration = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setShowPreview(true);
    setProgress(0);
    setCurrentStep(0);
    setMessages([]);
    setGeneratedFiles(new Map());
    setPreviewHtml('');

    try {
      const response = await fetch('/api/baml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          options: {
            includeTests: true,
            optimizePerformance: true
          }
        })
      });

      if (!response.body) throw new Error('No response stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let streamEnded = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done || streamEnded) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              streamEnded = true;
              break;
            }

            try {
              const message = JSON.parse(data);
              handleStreamMessage(message);
            } catch (e) {
              console.error('Error parsing message:', e, 'Data:', data);
            }
          }
        }
        if (streamEnded) break;
      }
    } catch (error) {
      console.error('Generation error:', error);
      addMessage(`❌ Erreur: ${error.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Gestion des messages de streaming
   */
  const handleStreamMessage = (message) => {
    switch (message.type) {
      case 'domain':
        setCurrentStep(0);
        setDetectedDomain(message.domain || 'general');
        addMessage(`🎯 ${message.message}`, 'info');
        setProgress(5);
        break;

      case 'generation_start':
        setCurrentStep(1);
        addMessage(`🚀 ${message.message}`, 'info');
        setProgress(15);
        break;

      case 'progress':
        const stepIndex = Math.min(Math.floor((message.percentage || 50) / 16), 5);
        setCurrentStep(stepIndex + 1);
        setProgress(message.percentage || 50);
        addMessage(`⚡ ${message.message || 'Progression...'}`, 'info');
        break;

      case 'content':
        setCurrentStep(6);
        setProgress(100);

        // Traiter le contenu généré
        if (message.chunk) {
          // Simuler des fichiers générés
          const files = new Map([
            ['index.html', message.chunk],
            ['styles.css', generateBasicCSS()],
            ['script.js', generateBasicJS()]
          ]);
          setGeneratedFiles(files);
          setPreviewHtml(message.chunk);
        }

        addMessage(`✅ Génération terminée avec succès !`, 'success');
        break;

      case 'error':
        addMessage(`❌ ${message.error}`, 'error');
        break;

      default:
        addMessage(`ℹ️ ${message.message || 'Étape en cours...'}`, 'info');
    }
  };

  /**
   * Générer du CSS basique pour la démo
   */
  const generateBasicCSS = () => `
/* Styles générés automatiquement */
body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
.button:hover { background: #0056b3; }
  `;

  /**
   * Générer du JS basique pour la démo
   */
  const generateBasicJS = () => `
// Script généré automatiquement
document.addEventListener('DOMContentLoaded', function() {
  console.log('Application initialisée');

  // Ajouter des interactions de base
  const buttons = document.querySelectorAll('.button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      console.log('Bouton cliqué:', button.textContent);
    });
  });
});
  `;

  /**
   * Ajout d'un message au log
   */
  const addMessage = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    setMessages(prev => [...prev, { time, text, type }]);
  };

  if (!showPreview) {
    // Interface d'accueil
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        <FloatingOrbs />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <ProgressiveReveal>
            <GlassCard variant="gradient" padding="xl" animated className="w-full max-w-4xl">
              <div className="text-center mb-12">
                <ProgressiveReveal delay={200}>
                  <h1 className="text-6xl font-bold mb-4">
                    <GradientText gradient="premium" animated>
                      NEXA AI
                    </GradientText>
                  </h1>
                </ProgressiveReveal>

                <ProgressiveReveal delay={400}>
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Générateur de code IA avancé avec preview en temps réel et architecture intelligente
                  </p>
                </ProgressiveReveal>
              </div>

              <ProgressiveReveal delay={600}>
                <div className="space-y-6">
                  <PremiumInput
                    label="Décrivez votre projet"
                    placeholder="Ex: Créer une landing page pour un restaurant avec menu et système de réservation..."
                    value={prompt}
                    onChange={setPrompt}
                    className="text-lg"
                  />

                  <div className="flex justify-center">
                    <PremiumButton
                      variant="gradient"
                      size="xl"
                      onClick={startGeneration}
                      disabled={!prompt.trim()}
                      loading={isGenerating}
                      className="px-16"
                    >
                      {isGenerating ? 'Génération en cours...' : 'Générer avec IA'}
                    </PremiumButton>
                  </div>
                </div>
              </ProgressiveReveal>

              <ProgressiveReveal delay={800}>
                <div className="mt-16 grid md:grid-cols-3 gap-8">
                  <GlassCard padding="lg" animated>
                    <div className="text-center">
                      <div className="text-4xl mb-4">🧠</div>
                      <h3 className="text-lg font-semibold text-white mb-2">IA Avancée</h3>
                      <p className="text-gray-400 text-sm">Architecture intelligente avec Claude Sonnet-4</p>
                    </div>
                  </GlassCard>

                  <GlassCard padding="lg" animated>
                    <div className="text-center">
                      <div className="text-4xl mb-4">⚡</div>
                      <h3 className="text-lg font-semibold text-white mb-2">Preview Live</h3>
                      <p className="text-gray-400 text-sm">Visualisation en temps réel du code généré</p>
                    </div>
                  </GlassCard>

                  <GlassCard padding="lg" animated>
                    <div className="text-center">
                      <div className="text-4xl mb-4">🚀</div>
                      <h3 className="text-lg font-semibold text-white mb-2">Prêt à déployer</h3>
                      <p className="text-gray-400 text-sm">Code optimisé et prêt pour la production</p>
                    </div>
                  </GlassCard>
                </div>
              </ProgressiveReveal>
            </GlassCard>
          </ProgressiveReveal>
        </div>
      </div>
    );
  }

  // Interface de génération avec preview
  return (
    <div className="h-screen bg-gray-950 flex">
      {/* LEFT PANEL - 30% */}
      <div className="w-[30%] border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <GlassCard padding="md">
            <div className="text-sm text-gray-400 mb-1">
              {isGenerating ? 'Génération en cours' : progress === 100 ? 'Génération terminée' : 'En attente'}
            </div>
            <div className="text-white font-medium">
              {prompt.slice(0, 60)}...
            </div>
            {detectedDomain !== 'general' && (
              <div className="mt-2 text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg px-2 py-1">
                🎯 {detectedDomain.toUpperCase()} Expert Mode
              </div>
            )}
            <button
              onClick={() => { setShowPreview(false); setProgress(0); setCurrentStep(0); setDetectedDomain('general'); }}
              className="mt-2 text-xs text-purple-400 hover:text-purple-300"
            >
              ← Nouveau projet
            </button>
          </GlassCard>
        </div>

        {/* Progress Steps */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  index === currentStep
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30'
                    : index < currentStep
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-gray-800/50'
                }`}
              >
                <div className={`text-2xl ${index === currentStep ? 'animate-pulse' : ''}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{step.label}</div>
                  <div className="text-sm text-gray-400">{step.message}</div>
                </div>
                {index < currentStep && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Live Messages */}
          <div className="mt-8 space-y-2">
            <div className="text-sm text-gray-400 mb-2">Logs temps réel</div>
            <div className="bg-gray-900 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  En attente de démarrage...
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`mb-1 ${
                    msg.type === 'success' ? 'text-green-400' :
                    msg.type === 'error' ? 'text-red-400' :
                    msg.type === 'warning' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}>
                    <span className="text-gray-500">[{msg.time}]</span> {msg.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - 70% */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="h-16 border-b border-gray-800 flex items-center px-6">
          <div className="flex space-x-1">
            {['preview', 'code', 'files'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab === 'preview' && '🖥️ Preview'}
                {tab === 'code' && '📝 Code'}
                {tab === 'files' && '📁 Files'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-900 p-8">
          {activeTab === 'preview' && (
            <div className="w-full h-full rounded-xl border border-gray-800 bg-white">
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0 rounded-xl"
                  title="Application Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="lg" variant="gradient" className="mx-auto mb-4" />
                        <div className="text-gray-600">Génération du preview...</div>
                      </>
                    ) : (
                      <>
                        <div className="text-gray-400 text-6xl mb-4">🖥️</div>
                        <div className="text-gray-600">Preview disponible après génération</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="w-full h-full rounded-xl border border-gray-800 bg-gray-950 p-6 overflow-auto">
              {selectedFile && generatedFiles.get(selectedFile) ? (
                <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                  <code>{generatedFiles.get(selectedFile)}</code>
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">📝</div>
                    <div>Sélectionnez un fichier pour voir le code</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="w-full h-full rounded-xl border border-gray-800 bg-gray-950 p-6">
              {generatedFiles.size > 0 ? (
                <div className="space-y-2">
                  <div className="text-gray-400 text-sm mb-4">
                    Fichiers générés ({generatedFiles.size})
                  </div>
                  {Array.from(generatedFiles.keys()).map((filePath) => (
                    <button
                      key={filePath}
                      onClick={() => {
                        setSelectedFile(filePath);
                        setActiveTab('code');
                      }}
                      className="w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                      <div className="text-2xl">
                        {filePath.endsWith('.html') ? '🌐' :
                         filePath.endsWith('.css') ? '🎨' :
                         filePath.endsWith('.js') ? '⚡' : '📄'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{filePath}</div>
                        <div className="text-gray-400 text-sm">
                          {generatedFiles.get(filePath)?.length || 0} caractères
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">📁</div>
                    <div>Fichiers disponibles après génération</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}