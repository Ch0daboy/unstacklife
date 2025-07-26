import React, { useState, useEffect } from 'react';
import { Volume2, Download, Play, Settings, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Book, VoiceOption, AudiobookData } from '../types';
import { 
  getAvailableVoices, 
  selectVoiceForBook, 
  analyzeBookForVoiceSelection,
  generateAudiobook,
  formatDuration
} from '../services/ttsService';
import AudioPlayer from './AudioPlayer';

interface AudiobookGeneratorProps {
  book: Book;
  onAudiobookGenerated?: (audiobook: AudiobookData) => void;
  onClose?: () => void;
}

const AudiobookGenerator: React.FC<AudiobookGeneratorProps> = ({ 
  book, 
  onAudiobookGenerated,
  onClose 
}) => {
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentChapter, setCurrentChapter] = useState('');
  const [generatedAudiobook, setGeneratedAudiobook] = useState<AudiobookData | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = getAvailableVoices();
      setAvailableVoices(voices);
      
      if (voices.length > 0) {
        const recommended = selectVoiceForBook(book, voices);
        setSelectedVoice(recommended);
      }
    };

    // Voices might not be loaded immediately
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
    } else {
      loadVoices();
    }

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [book]);

  const analysis = analyzeBookForVoiceSelection(book);

  const handleVoicePreview = (voice: VoiceOption) => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(
        `Hello, I'm ${voice.voice.name}. This is how I would narrate your book "${book.title}".`
      );
      utterance.voice = voice.voice;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      speechSynthesis.speak(utterance);
    }
  };

  const handleGenerateAudiobook = async () => {
    if (!selectedVoice) {
      setError('Please select a voice for narration');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setCurrentChapter('');

    try {
      const audiobook = await generateAudiobook(
        book,
        selectedVoice.voice,
        (progress, chapter) => {
          setGenerationProgress(progress);
          setCurrentChapter(chapter);
        }
      );

      setGeneratedAudiobook(audiobook);
      onAudiobookGenerated?.(audiobook);
      setShowPlayer(true);
    } catch (err) {
      console.error('Error generating audiobook:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audiobook');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAudiobook = async () => {
    if (!generatedAudiobook) return;

    try {
      const { exportAudiobook } = await import('../services/exportService');
      await exportAudiobook(book, generatedAudiobook);
    } catch (error) {
      console.error('Error exporting audiobook:', error);
      alert('Failed to export audiobook. Please try again.');
    }
  };

  const getVoiceRecommendationText = () => {
    const confidence = Math.round(analysis.confidence * 100);
    const gender = analysis.recommendedGender;
    
    if (confidence > 70) {
      return `Highly recommended: ${gender} voice (${confidence}% confidence)`;
    } else if (confidence > 50) {
      return `Suggested: ${gender} voice (${confidence}% confidence)`;
    } else {
      return 'No strong preference detected - choose any voice you prefer';
    }
  };

  if (showPlayer && generatedAudiobook) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Audiobook Player</h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadAudiobook}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => setShowPlayer(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Generator
            </button>
          </div>
        </div>
        <AudioPlayer audiobook={generatedAudiobook} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Generate Audiobook</h3>
          <p className="text-gray-600 mt-1">Convert "{book.title}" to an audiobook</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Book Analysis */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Voice Recommendation</h4>
        <p className="text-blue-800 text-sm mb-2">{getVoiceRecommendationText()}</p>
        <div className="text-xs text-blue-600">
          <p>Analysis based on: {book.perspective} perspective, {book.genre} genre</p>
        </div>
      </div>

      {/* Voice Selection */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Select Narrator Voice</h4>
        {availableVoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Loading available voices...</p>
          </div>
        ) : (
          <div className="grid gap-3 max-h-64 overflow-y-auto">
            {availableVoices.map((voiceOption, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedVoice?.voice.name === voiceOption.voice.name
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${voiceOption.isRecommended ? 'ring-2 ring-blue-200' : ''}`}
                onClick={() => setSelectedVoice(voiceOption)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {voiceOption.voice.name}
                      </span>
                      {voiceOption.isRecommended && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>Gender: {voiceOption.gender}</span>
                      <span>Language: {voiceOption.language}</span>
                      <span>Quality: {voiceOption.voice.localService ? 'High' : 'Standard'}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoicePreview(voiceOption);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Preview voice"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Loader className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="font-medium text-gray-900">Generating Audiobook...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {currentChapter ? `Processing: ${currentChapter}` : 'Preparing...'}
          </p>
        </div>
      )}

      {/* Generated Audiobook Info */}
      {generatedAudiobook && !showPlayer && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium text-green-900">Audiobook Generated Successfully!</span>
          </div>
          <div className="text-sm text-green-800">
            <p>Chapters: {generatedAudiobook.audioChapters.filter(ch => ch.status === 'completed').length}</p>
            <p>Total Duration: ~{formatDuration(generatedAudiobook.totalDuration || 0)}</p>
            <p>Voice: {generatedAudiobook.selectedVoice}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!generatedAudiobook ? (
          <button
            onClick={handleGenerateAudiobook}
            disabled={!selectedVoice || isGenerating}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                Generate Audiobook
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowPlayer(true)}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Play Audiobook
            </button>
            <button
              onClick={handleDownloadAudiobook}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </>
        )}
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This feature uses your browser's built-in text-to-speech engine. 
          For higher quality audio, consider using professional TTS services like ElevenLabs or Google Cloud TTS.
        </p>
      </div>
    </div>
  );
};

export default AudiobookGenerator;
