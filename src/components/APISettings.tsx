import React, { useState } from 'react';
import { Key, Zap } from 'lucide-react';

interface APISettingsProps {
  onAPIKeysSet: (keys: {gemini: string; perplexity: string}) => void;
}

const APISettings: React.FC<APISettingsProps> = ({ onAPIKeysSet }) => {
  const [geminiKey, setGeminiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [perplexityKey, setPerplexityKey] = useState(import.meta.env.VITE_PERPLEXITY_API_KEY || '');

  // Auto-submit if keys are available from environment
  React.useEffect(() => {
    if (geminiKey && perplexityKey) {
      onAPIKeysSet({
        gemini: geminiKey,
        perplexity: perplexityKey
      });
    }
  }, [geminiKey, perplexityKey, onAPIKeysSet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiKey.trim() && perplexityKey.trim()) {
      onAPIKeysSet({
        gemini: geminiKey.trim(),
        perplexity: perplexityKey.trim()
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <img 
            src="/generated-image.png" 
            alt="Unstack Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">API Configuration</h2>
          <p className="text-gray-600">Enter your API keys to get started with Unstack's AI-powered eBook generation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="gemini" className="block text-sm font-medium text-gray-700 mb-2">
              Google Gemini API Key
            </label>
            <input
              type="password"
              id="gemini"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Google AI Studio
              </a>
            </p>
          </div>

          <div>
            <label htmlFor="perplexity" className="block text-sm font-medium text-gray-700 mb-2">
              Perplexity AI API Key
            </label>
            <input
              type="password"
              id="perplexity"
              value={perplexityKey}
              onChange={(e) => setPerplexityKey(e.target.value)}
              placeholder="Enter your Perplexity API key"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                Perplexity AI
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={!geminiKey.trim() || !perplexityKey.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Continue to eBook Generator
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-medium text-blue-900 mb-2">Security Note</h3>
          <p className="text-sm text-blue-800">
            Your API keys are stored locally in your browser and are never sent to our servers. 
            They are only used to communicate directly with Google Gemini and Perplexity AI services.
          </p>
        </div>
      </div>
    </div>
  );
};

export default APISettings;