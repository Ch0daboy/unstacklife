import React, { useState } from 'react';
import { Zap, X } from 'lucide-react';
import { updateAIConfig, getAIConfig } from '../config/aiConfig';

interface APISettingsProps {
  onAPIKeysSet: (keys: any) => void;
  onClose?: () => void;
}

const DEFAULT_REGION = 'us-west-2';
const DEFAULT_MODEL = (import.meta as any).env?.VITE_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-haiku-20241022-v1:0';

const STORAGE_KEY = 'unstack_ai_credentials_v1';

const APISettings: React.FC<APISettingsProps> = ({ onAPIKeysSet, onClose }) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const storedObj = stored ? JSON.parse(stored) : {};

  const [awsAccessKey, setAwsAccessKey] = useState<string>(storedObj?.bedrock?.accessKeyId || (import.meta as any).env?.VITE_AWS_ACCESS_KEY_ID || '');
  const [awsSecretKey, setAwsSecretKey] = useState<string>(storedObj?.bedrock?.secretAccessKey || (import.meta as any).env?.VITE_AWS_SECRET_ACCESS_KEY || '');
  const [awsRegion, setAwsRegion] = useState<string>(storedObj?.bedrock?.region || (import.meta as any).env?.VITE_AWS_REGION || DEFAULT_REGION);
  const [modelId, setModelId] = useState<string>(storedObj?.bedrock?.modelId || DEFAULT_MODEL);
  const [perplexityKey, setPerplexityKey] = useState<string>(storedObj?.perplexity || (import.meta as any).env?.VITE_PERPLEXITY_API_KEY || '');

  React.useEffect(() => {
    if (awsAccessKey && awsSecretKey) {
      const payload = {
        bedrock: { accessKeyId: awsAccessKey, secretAccessKey: awsSecretKey, region: awsRegion || DEFAULT_REGION, modelId: modelId || DEFAULT_MODEL },
        perplexity: perplexityKey
      };
      onAPIKeysSet(payload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awsAccessKey.trim() || !awsSecretKey.trim()) return;

    const creds = {
      bedrock: {
        accessKeyId: awsAccessKey.trim(),
        secretAccessKey: awsSecretKey.trim(),
        region: (awsRegion || DEFAULT_REGION).trim(),
        modelId: (modelId || DEFAULT_MODEL).trim()
      },
      perplexity: perplexityKey.trim()
    };

    // Persist locally in browser (never sent to server)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));

    // Update in-memory config so router uses Bedrock first immediately
    updateAIConfig({
      services: {
        ...getAIConfig().services,
        bedrock: { enabled: true, credentials: creds.bedrock },
        perplexity: { ...getAIConfig().services.perplexity, apiKey: creds.perplexity },
        gemini: { ...getAIConfig().services.gemini }
      }
    });

    onAPIKeysSet(creds);
    if (onClose) onClose();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="text-center w-full">
            <img src="/generated-image.png" alt="Unstack Logo" className="h-16 w-auto mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-gray-800">API Configuration</h2>
            <p className="text-gray-600">Enter your AWS Bedrock and Perplexity keys (stored locally)</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="absolute right-6 top-6 p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="awsAccessKey" className="block text-sm font-medium text-gray-700 mb-2">
              AWS Access Key ID
            </label>
            <input
              type="password"
              id="awsAccessKey"
              value={awsAccessKey}
              onChange={(e) => setAwsAccessKey(e.target.value)}
              placeholder="Enter your AWS Access Key ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="awsSecretKey" className="block text-sm font-medium text-gray-700 mb-2">
              AWS Secret Access Key
            </label>
            <input
              type="password"
              id="awsSecretKey"
              value={awsSecretKey}
              onChange={(e) => setAwsSecretKey(e.target.value)}
              placeholder="Enter your AWS Secret Access Key"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Create your AWS credentials in the{' '}
              <a href="https://console.aws.amazon.com/iam/home#/security_credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                AWS Console
              </a>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="awsRegion" className="block text-sm font-medium text-gray-700 mb-2">AWS Region</label>
              <select id="awsRegion" value={awsRegion} onChange={(e) => setAwsRegion(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                {['us-west-2','us-east-1','eu-central-1','ap-southeast-1'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="modelId" className="block text-sm font-medium text-gray-700 mb-2">Claude Model ID</label>
              <input type="text" id="modelId" value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="anthropic.claude-3-5-haiku-20241022-v1:0" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
              <p className="text-xs text-gray-500 mt-1">Defaults to a fast Claude 3.5 model. You can paste any Bedrock model ID your policy allows.</p>
            </div>
          </div>

          <div>
            <label htmlFor="perplexity" className="block text-sm font-medium text-gray-700 mb-2">
              Perplexity AI API Key (optional)
            </label>
            <input
              type="password"
              id="perplexity"
              value={perplexityKey}
              onChange={(e) => setPerplexityKey(e.target.value)}
              placeholder="Enter your Perplexity API key"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
            disabled={!awsAccessKey.trim() || !awsSecretKey.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Continue to eBook Generator
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-medium text-blue-900 mb-2">Security Note</h3>
          <p className="text-sm text-blue-800">Your keys are stored locally in your browser and used only by your session to call Amazon Bedrock (via AWS SDK in your browser) and Perplexity. They are never sent to Unstack servers.</p>
        </div>
      </div>
    </div>
  );
};

export default APISettings;
