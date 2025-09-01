import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Zap, Cloud, Cpu } from 'lucide-react';
import { getAIConfig, toggleLocalAI, isLocalAIEnabled, updateAIConfig } from '../config/aiConfig';
import { checkLocalAIAvailability } from '../services/localContentService';

interface AIConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ isOpen, onClose }) => {
  const [localAvailability, setLocalAvailability] = useState({ codex: false, claudeCode: false });
  const [isChecking, setIsChecking] = useState(true);
  const [currentMode, setCurrentMode] = useState(isLocalAIEnabled());

  useEffect(() => {
    if (isOpen) {
      checkAvailability();
    }
  }, [isOpen]);

  const checkAvailability = async () => {
    setIsChecking(true);
    try {
      const availability = await checkLocalAIAvailability();
      setLocalAvailability(availability);
      
      // Update the config with availability
      const config = getAIConfig();
      updateAIConfig({
        services: {
          ...config.services,
          codex: { ...config.services.codex, available: availability.codex },
          claudeCode: { ...config.services.claudeCode, available: availability.claudeCode }
        }
      });
    } catch (error) {
      console.error('Error checking AI availability:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleModeToggle = (useLocal: boolean) => {
    toggleLocalAI(useLocal);
    setCurrentMode(useLocal);
  };

  const canUseLocalMode = localAvailability.codex || localAvailability.claudeCode;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">AI Configuration</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Service Mode</h3>
              
              {/* Cloud Mode */}
              <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                    !currentMode 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {!currentMode && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-800">Cloud AI Services</h4>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Production Ready
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      Uses external APIs (Gemini & Perplexity) for content generation and research.
                      Requires API keys and internet connection.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">High-quality content generation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">Advanced research capabilities</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">No local installation required</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleModeToggle(false)}
                      disabled={!currentMode}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {!currentMode ? 'Currently Active' : 'Switch to Cloud Mode'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Local Mode */}
              <div className="border rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                    currentMode 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {currentMode && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-800">Local AI Services</h4>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Testing Branch
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      Uses local CLI tools (Codex & Claude Code) for content generation.
                      Requires local installation but works offline.
                    </p>
                    
                    {isChecking ? (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-700">Checking local AI availability...</span>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          {localAvailability.codex ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm text-gray-700">
                            Codex CLI {localAvailability.codex ? 'Available' : 'Not Found'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {localAvailability.claudeCode ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm text-gray-700">
                            Claude Code CLI {localAvailability.claudeCode ? 'Available' : 'Not Found'}
                          </span>
                        </div>
                      </div>
                    )}

                    {!canUseLocalMode && !isChecking && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm text-yellow-800 font-medium">Local AI tools not found</p>
                            <p className="text-sm text-yellow-700 mt-1">
                              Install Codex CLI or Claude Code CLI to use local mode.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleModeToggle(true)}
                      disabled={currentMode || !canUseLocalMode}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentMode ? 'Currently Active' : canUseLocalMode ? 'Switch to Local Mode' : 'Local AI Not Available'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Installation Instructions */}
            {!canUseLocalMode && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Installation Instructions</h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-medium">For Codex CLI:</p>
                    <code className="block bg-gray-100 p-2 rounded mt-1">npm install -g @openai/codex-cli</code>
                  </div>
                  <div>
                    <p className="font-medium">For Claude Code CLI:</p>
                    <p>Download from: <a href="https://claude.ai/code" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://claude.ai/code</a></p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Status */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800">Current Configuration</h4>
              </div>
              <div className="space-y-1 text-sm text-gray-700">
                <p>Mode: <span className="font-medium">{currentMode ? 'Local AI' : 'Cloud AI'}</span></p>
                <p>Active Services: <span className="font-medium">
                  {currentMode 
                    ? [
                        localAvailability.codex && 'Codex CLI',
                        localAvailability.claudeCode && 'Claude Code CLI'
                      ].filter(Boolean).join(', ') || 'None'
                    : 'Gemini API, Perplexity API'
                  }
                </span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigPanel;