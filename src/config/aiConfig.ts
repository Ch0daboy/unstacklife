/**
 * AI Configuration for BookGen
 * Controls which AI services are used for content generation
 */

export interface BedrockCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

export interface AIConfig {
  useLocalAI: boolean;
  services: {
    // External API services (Cloud-based)
    bedrock: {
      enabled: boolean;
      credentials?: BedrockCredentials;
    };
    gemini: {
      enabled: boolean;
      apiKey?: string;
    };
    perplexity: {
      enabled: boolean;
      apiKey?: string;
    };
    // Local CLI services
    codex: {
      enabled: boolean;
      available?: boolean;
    };
    claudeCode: {
      enabled: boolean;
      available?: boolean;
    };
  };
}

// Available Bedrock models
export const BEDROCK_MODELS = {
  PRIMARY: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  FAST: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  PREMIUM: 'anthropic.claude-3-opus-20240229-v1:0',
  LLAMA: 'meta.llama3-1-405b-instruct-v1:0',
  TITAN: 'amazon.titan-text-premier-v1:0'
} as const;

export type BedrockModelId = typeof BEDROCK_MODELS[keyof typeof BEDROCK_MODELS];

// Default configuration - can be overridden by environment variables
const defaultConfig: AIConfig = {
  useLocalAI: import.meta.env.VITE_USE_LOCAL_AI === 'true' || false,
  services: {
    bedrock: {
      enabled: !import.meta.env.VITE_USE_LOCAL_AI,
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
      }
    },
    gemini: {
      enabled: !import.meta.env.VITE_USE_LOCAL_AI,
      apiKey: import.meta.env.VITE_GEMINI_API_KEY
    },
    perplexity: {
      enabled: !import.meta.env.VITE_USE_LOCAL_AI,
      apiKey: import.meta.env.VITE_PERPLEXITY_API_KEY
    },
    codex: {
      enabled: import.meta.env.VITE_USE_LOCAL_AI === 'true' || false,
      available: undefined // Will be checked at runtime
    },
    claudeCode: {
      enabled: import.meta.env.VITE_USE_LOCAL_AI === 'true' || false,
      available: undefined // Will be checked at runtime
    }
  }
};

let currentConfig: AIConfig = { ...defaultConfig };

export const getAIConfig = (): AIConfig => {
  return currentConfig;
};

export const updateAIConfig = (newConfig: Partial<AIConfig>): void => {
  currentConfig = { ...currentConfig, ...newConfig };
};

export const toggleLocalAI = (useLocal: boolean): void => {
  currentConfig.useLocalAI = useLocal;
  currentConfig.services.bedrock.enabled = !useLocal;
  currentConfig.services.gemini.enabled = !useLocal;
  currentConfig.services.perplexity.enabled = !useLocal;
  currentConfig.services.codex.enabled = useLocal;
  currentConfig.services.claudeCode.enabled = useLocal;
};

export const isLocalAIEnabled = (): boolean => {
  return currentConfig.useLocalAI;
};

export const getEnabledServices = () => {
  const enabled = Object.entries(currentConfig.services)
    .filter(([_, service]) => service.enabled)
    .map(([name, _]) => name);
  
  return enabled;
};

// Helper function to get API keys in the format expected by existing components
export const getApiKeys = () => {
  if (currentConfig.useLocalAI) {
    return {
      bedrock: null, // Not used in local mode
      gemini: '', // Not used in local mode
      perplexity: '', // Not used in local mode
      codex: currentConfig.services.codex.available || false,
      claudeCode: currentConfig.services.claudeCode.available || false
    };
  } else {
    return {
      bedrock: currentConfig.services.bedrock.credentials,
      gemini: currentConfig.services.gemini.apiKey || '',
      perplexity: currentConfig.services.perplexity.apiKey || ''
    };
  }
};

// Helper function to get full AI credentials
export const getAICredentials = () => {
  return {
    bedrock: currentConfig.services.bedrock.credentials,
    gemini: currentConfig.services.gemini.apiKey,
    perplexity: currentConfig.services.perplexity.apiKey
  };
};