import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Play, Search, CheckCircle, Square } from 'lucide-react';
import { BookChapter, SubChapter } from '../types';
import { generateChapterOutline, generateContent } from '../services/bedrockService';
import { researchAndGenerate } from '../services/contentService';

interface ChapterViewProps {
  chapter: BookChapter;
  onBack: () => void;
  onUpdateChapter: (chapter: BookChapter) => void;
  apiKeys: {perplexity: string};
  region?: string;
  isCancelled: boolean;
  onCancel: () => void;
  onResume: () => void;
}

const ChapterView: React.FC<ChapterViewProps> = ({ 
  chapter, 
  onBack, 
  onUpdateChapter,
  apiKeys,
  region,
  isCancelled,
  onCancel,
  onResume 
}) => {
  const [localChapter, setLocalChapter] = useState<BookChapter>(chapter);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

  useEffect(() => {
    setLocalChapter(chapter);
  }, [chapter]);

  useEffect(() => {
    if (!localChapter.subChapters && !isGeneratingOutline) {
      generateOutline();
    }
  }, []);

  const generateOutline = async () => {
    setIsGeneratingOutline(true);
    try {
      const outline = await generateChapterOutline(localChapter.title, localChapter.description, region || 'us-east-1');
      const updatedChapter = { ...localChapter, subChapters: outline };
      setLocalChapter(updatedChapter);
      onUpdateChapter(updatedChapter);
    } catch (error) {
      console.error('Error generating chapter outline:', error);
      alert('Failed to generate chapter outline. Please try again.');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerate = async (subChapter: SubChapter, withResearch: boolean = false) => {
    if (isCancelled) return;

    const updatedSubChapter = { ...subChapter, status: 'generating' as const };
    const updatedSubChapters = (Array.isArray(localChapter.subChapters) ? localChapter.subChapters : [])
      .map(sc => sc.id === subChapter.id ? updatedSubChapter : sc);
    
    const updatedChapter = { ...localChapter, subChapters: updatedSubChapters };
    setLocalChapter(updatedChapter);
    onUpdateChapter(updatedChapter);

    try {
      let content: string;
      
      if (withResearch) {
        content = await researchAndGenerate(subChapter.title, subChapter.description, apiKeys, region || 'us-east-1', () => isCancelled);
      } else {
        content = await generateContent(subChapter.title, subChapter.description, region || 'us-east-1', () => isCancelled);
      }

      // Check if cancelled during generation
      if (isCancelled) {
        const cancelledSubChapter = { ...subChapter, status: 'pending' as const };
        const cancelledSubChapters = (Array.isArray(localChapter.subChapters) ? localChapter.subChapters : [])
          .map(sc => sc.id === subChapter.id ? cancelledSubChapter : sc);
        
        const cancelledChapter = { ...localChapter, subChapters: cancelledSubChapters };
        setLocalChapter(cancelledChapter);
        onUpdateChapter(cancelledChapter);
        return;
      }

      const completedSubChapter = { 
        ...updatedSubChapter, 
        content, 
        status: 'completed' as const 
      };
      
      const finalSubChapters = (Array.isArray(localChapter.subChapters) ? localChapter.subChapters : [])
        .map(sc => sc.id === subChapter.id ? completedSubChapter : sc);
      
      const finalChapter = { ...localChapter, subChapters: finalSubChapters };
      setLocalChapter(finalChapter);
      onUpdateChapter(finalChapter);
    } catch (error) {
      console.error('Error generating content:', error);
      if (!isCancelled) {
        alert('Failed to generate content. Please try again.');
      }
      
      // Reset status on error
      const resetSubChapter = { ...subChapter, status: 'pending' as const };
      const resetSubChapters = (Array.isArray(localChapter.subChapters) ? localChapter.subChapters : [])
        .map(sc => sc.id === subChapter.id ? resetSubChapter : sc);
      
      const resetChapter = { ...localChapter, subChapters: resetSubChapters };
      setLocalChapter(resetChapter);
      onUpdateChapter(resetChapter);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'generating': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{localChapter.title}</h1>
              <p className="text-gray-600">{localChapter.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isGeneratingOutline && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Generating Chapter Outline</h3>
          <p className="text-gray-600">Creating detailed sections for this chapter...</p>
        </div>
      )}

      {/* Sub-chapters */}
      {localChapter.subChapters && Array.isArray(localChapter.subChapters) && (
        <div className="space-y-4">
          {localChapter.subChapters.map((subChapter, index) => (
            <div key={subChapter.id} className="bg-white rounded-xl shadow-lg">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{subChapter.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{subChapter.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(subChapter.status)}`}>
                    {subChapter.status === 'completed' ? 'Complete' : 
                     subChapter.status === 'generating' ? 'Generating' : 'Pending'}
                  </span>
                </div>

                {subChapter.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleGenerate(subChapter)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Generate
                    </button>
                    <button
                      onClick={() => handleGenerate(subChapter, true)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Research + Generate
                    </button>
                  </div>
                )}

                {subChapter.status === 'generating' && (
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3 text-blue-600">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">
                        {isCancelled ? 'Cancelling...' : 'Generating content...'}
                      </span>
                    </div>
                    {!isCancelled ? (
                      <button
                        onClick={onCancel}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                      >
                        <Square className="w-4 h-4" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={onResume}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Resume
                      </button>
                    )}
                  </div>
                )}

                {subChapter.status === 'completed' && subChapter.content && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Content generated successfully</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="prose prose-sm max-w-none">
                        {subChapter.content.split('\n').map((paragraph, idx) => (
                          <p key={idx} className="mb-3 text-gray-700 leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChapterView;