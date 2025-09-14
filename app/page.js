'use client';

import { useState } from 'react';

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState([]);

  const generateCode = async (apiEndpoint) => {
    setLoading(true);
    setResult('');
    setProgress([]);

    try {
      const response = await fetch(`/api/${apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content' || parsed.chunk) {
                setResult(prev => prev + (parsed.chunk || parsed.content || ''));
              } else {
                setProgress(prev => [...prev, parsed]);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Input */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">AI Code Generator</h2>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your application (e.g., 'Create an ecommerce store with cart and checkout')"
              className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none"
            />

            <div className="flex space-x-4 mt-4">
              <button
                onClick={() => generateCode('generate')}
                disabled={!prompt || loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Generating...' : 'Generate (Standard)'}
              </button>

              <button
                onClick={() => generateCode('baml')}
                disabled={!prompt || loading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Processing...' : 'BAML Pragmatic'}
              </button>
            </div>
          </div>

          {/* Progress Panel */}
          {progress.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">Progress</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {progress.map((step, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-blue-400">[{step.type}]</span> {step.message}
                    {step.domain && <span className="text-green-400 ml-2">Domain: {step.domain}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Output */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Code</h2>

          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-400">Generating code...</span>
              </div>
            ) : result ? (
              <pre className="text-sm text-green-400 whitespace-pre-wrap">{result}</pre>
            ) : (
              <div className="text-gray-500 text-center h-full flex items-center justify-center">
                Generated code will appear here...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Panel */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">✅</div>
            <div className="text-sm">Streaming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">✅</div>
            <div className="text-sm">BAML System</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">✅</div>
            <div className="text-sm">Cache</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">✅</div>
            <div className="text-sm">SCoT Enhancement</div>
          </div>
        </div>
      </div>
    </div>
  );
}