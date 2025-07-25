import React, { useState } from 'react';
import { BookOpen, ChevronRight, Play, Search, RotateCcw, Download, FileText, Heart, Image, Palette } from 'lucide-react';
import { Book, BookChapter } from '../types';
import { generateAllContent, generateAllContentWithResearch, convertRomanceHeatLevel } from '../services/contentService';
import { exportToPDF, exportToEPUB } from '../services/exportService';
import { generateBookCover, generateBookCoverWithDALLE } from '../services/coverService';

interface OutlineViewProps {
  book: Book;
  onChapterClick: (chapter: BookChapter) => void;
  onNewBook: () => void;
  onUpdateBook: (book: Book) => void;
  apiKeys: {gemini: string; perplexity: string};
}

const OutlineView: React.FC<OutlineViewProps> = ({ 
  book, 
  onChapterClick, 
  onNewBook, 
  onUpdateBook, 
  apiKeys 
}) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showHeatLevelSelector, setShowHeatLevelSelector] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [selectedNewHeatLevel, setSelectedNewHeatLevel] = useState('');

  const HEAT_LEVELS = [
    { value: 'clean', label: 'Clean/Wholesome' },
    { value: 'sweet', label: 'Sweet' },
    { value: 'sensual', label: 'Sensual/Warm' },
    { value: 'steamy', label: 'Steamy/Hot' },
    { value: 'spicy', label: 'Spicy/Erotic' },
    { value: 'explicit', label: 'Explicit/Pornographic' }
  ];

  const handleGenerateAll = async (withResearch: boolean = false) => {
    setIsGeneratingAll(true);
    try {
      let updatedBook = { ...book };
      
      if (withResearch) {
        updatedBook = await generateAllContentWithResearch(updatedBook, apiKeys, (progress) => {
          onUpdateBook(progress);
        });
      } else {
        updatedBook = await generateAllContent(updatedBook, apiKeys.gemini, (progress) => {
          onUpdateBook(progress);
        });
      }
      
      onUpdateBook(updatedBook);
    } catch (error) {
      console.error('Error generating all content:', error);
      alert('Failed to generate all content. Please try again.');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleConvertHeatLevel = async () => {
    if (!selectedNewHeatLevel) return;
    
    setIsConverting(true);
    try {
      const convertedBook = await convertRomanceHeatLevel(
        book, 
        selectedNewHeatLevel, 
        apiKeys, 
        (progress) => {
          // You might want to show this as a separate book or update in place
          console.log('Conversion progress:', progress);
        }
      );
      
      // For now, we'll replace the current book with the converted one
      // In a full app, you might want to create a new book entry
      onUpdateBook(convertedBook);
      setShowHeatLevelSelector(false);
      setSelectedNewHeatLevel('');
    } catch (error) {
      console.error('Error converting heat level:', error);
      alert('Failed to convert heat level. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };
  const handleExport = async (format: 'pdf' | 'epub') => {
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        await exportToPDF(book);
      } else {
        await exportToEPUB(book);
      }
    } catch (error) {
      console.error('Error exporting book:', error);
      alert(`Failed to export book as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateCover = async (useDALLE: boolean = false) => {
    // For demo purposes, we'll use a placeholder API key prompt
    // In a real app, you'd have this configured in environment variables or user settings
    const apiKey = useDALLE 
      ? prompt('Enter your OpenAI API key for DALL-E:') 
      : prompt('Enter your Hugging Face API key:');
    
    if (!apiKey) return;
    
    setIsGeneratingCover(true);
    try {
      const coverUrl = useDALLE 
        ? await generateBookCoverWithDALLE(book, apiKey)
        : await generateBookCover(book, apiKey);
      
      const updatedBook = { ...book, coverUrl };
      onUpdateBook(updatedBook);
      setShowCoverOptions(false);
    } catch (error) {
      console.error('Error generating cover:', error);
      alert('Failed to generate cover. Please check your API key and try again.');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'generating': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const completedChapters = book.chapters.filter(ch => ch.status === 'completed').length;
  const progressPercentage = (completedChapters / book.chapters.length) * 100;
  const isBookCompleted = completedChapters === book.chapters.length && book.chapters.every(ch => 
    ch.subChapters && ch.subChapters.every(sc => sc.status === 'completed')
  );
  const isRomanceBook = book.genre.toLowerCase() === 'romance';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              {book.coverUrl ? (
                <img 
                  src={book.coverUrl} 
                  alt={`${book.title} cover`}
                  className="w-16 h-24 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{book.title}</h1>
              <div className="space-y-1">
                <p className="text-gray-600">{book.description}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span><strong>Genre:</strong> {book.genre}</span>
                  {book.subGenre && <span><strong>Sub-Genre:</strong> {book.subGenre}</span>}
                  <span><strong>Tone:</strong> {book.tone}</span>
                  {book.perspective && <span><strong>Perspective:</strong> {book.perspective === 'first' ? 'First Person' : book.perspective === 'third-limited' ? 'Third Person Limited' : book.perspective === 'third-omniscient' ? 'Third Person Omniscient' : book.perspective === 'second' ? 'Second Person' : book.perspective}</span>}
                  {book.heatLevel && book.genre.toLowerCase() === 'romance' && (
                    <span><strong>Heat Level:</strong> {book.heatLevel}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onNewBook}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            New Book
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{completedChapters}/{book.chapters.length} chapters</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isBookCompleted ? (
          <div className="flex gap-3">
            {/* Cover Generation */}
            <div className="space-y-3">
              {!showCoverOptions ? (
                <button
                  onClick={() => setShowCoverOptions(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Palette className="w-5 h-5" />
                  Generate Cover
                </button>
              ) : (
                <div className="bg-purple-50 p-4 rounded-xl space-y-3">
                  <h4 className="font-medium text-purple-900">Choose Cover Generation Service</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateCover(false)}
                      disabled={isGeneratingCover}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Image className="w-4 h-4" />
                      {isGeneratingCover ? 'Generating...' : 'Hugging Face'}
                    </button>
                    <button
                      onClick={() => handleGenerateCover(true)}
                      disabled={isGeneratingCover}
                      className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Palette className="w-4 h-4" />
                      {isGeneratingCover ? 'Generating...' : 'DALL-E'}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCoverOptions(false)}
                    className="w-full px-4 py-2 text-purple-600 hover:text-purple-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleGenerateAll(false)}
              disabled={isGeneratingAll}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {isGeneratingAll ? 'Generating...' : 'Generate All'}
            </button>
            <button
              onClick={() => handleGenerateAll(true)}
              disabled={isGeneratingAll}
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              {isGeneratingAll ? 'Researching...' : 'Research & Generate All'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 px-6 rounded-xl">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Book completed! Ready for export.</span>
            </div>
            <div className="flex gap-3">
            {/* Romance Heat Level Conversion */}
            {/* Cover Generation */}
            <div className="space-y-3">
              {!showCoverOptions ? (
                <button
                  onClick={() => setShowCoverOptions(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Palette className="w-5 h-5" />
                  {book.coverUrl ? 'Regenerate Cover' : 'Generate Cover'}
                </button>
              ) : (
                <div className="bg-purple-50 p-4 rounded-xl space-y-3">
                  <h4 className="font-medium text-purple-900">Choose Cover Generation Service</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateCover(false)}
                      disabled={isGeneratingCover}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Image className="w-4 h-4" />
                      {isGeneratingCover ? 'Generating...' : 'Hugging Face'}
                    </button>
                    <button
                      onClick={() => handleGenerateCover(true)}
                      disabled={isGeneratingCover}
                      className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Palette className="w-4 h-4" />
                      {isGeneratingCover ? 'Generating...' : 'DALL-E'}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCoverOptions(false)}
                    className="w-full px-4 py-2 text-purple-600 hover:text-purple-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            {isRomanceBook && (
              <div className="space-y-3">
                {!showHeatLevelSelector ? (
                  <button
                    onClick={() => setShowHeatLevelSelector(true)}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 px-6 rounded-xl font-medium hover:from-pink-700 hover:to-rose-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Heart className="w-5 h-5" />
                    Create Version with Different Heat Level
                  </button>
                ) : (
                  <div className="bg-pink-50 p-4 rounded-xl space-y-3">
                    <h4 className="font-medium text-pink-900">Convert to Different Heat Level</h4>
                    <select
                      value={selectedNewHeatLevel}
                      onChange={(e) => setSelectedNewHeatLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Select new heat level...</option>
                      {HEAT_LEVELS.filter(level => level.value !== book.heatLevel).map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConvertHeatLevel}
                        disabled={!selectedNewHeatLevel || isConverting}
                        className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white py-2 px-4 rounded-lg font-medium hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {isConverting ? 'Converting...' : 'Convert'}
                      </button>
                      <button
                        onClick={() => {
                          setShowHeatLevelSelector(false);
                          setSelectedNewHeatLevel('');
                        }}
                        className="px-4 py-2 text-pink-600 hover:text-pink-800 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Exporting...' : 'Export as PDF'}
              </button>
              <button
                onClick={() => handleExport('epub')}
                disabled={isExporting}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Exporting...' : 'Export as EPUB'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chapters List */}
      <div className="space-y-4">
        {book.chapters.map((chapter, index) => (
          <div 
            key={chapter.id}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
            onClick={() => onChapterClick(chapter)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                      {chapter.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{chapter.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(chapter.status)}`}>
                    {chapter.status === 'completed' ? 'Complete' : 
                     chapter.status === 'generating' ? 'Generating' : 'Pending'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutlineView;