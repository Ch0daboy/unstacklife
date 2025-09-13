import React, { useState } from 'react';
import { useEffect } from 'react';
import { Menu, Settings } from 'lucide-react';
import AuthWrapper from './components/AuthWrapper';
import { supabase } from './lib/supabase';
import BookSidebar from './components/BookSidebar';
import BookPrompt from './components/BookPrompt';
import OutlineView from './components/OutlineView';
import ChapterView from './components/ChapterView';
import BookEditor from './components/BookEditor';
import AIConfigPanel from './components/AIConfigPanel';
import APISettings from './components/APISettings';
import { Book, BookChapter } from './types';
import { saveBook, loadBook } from './services/bookService';
import { isLocalAIEnabled, getAICredentials } from './config/aiConfig';

function App() {
  const [currentStep, setCurrentStep] = useState<'prompt' | 'outline' | 'chapter' | 'edit'>('prompt');
  const [book, setBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<BookChapter | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showAPISettings, setShowAPISettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<any>(() => ({
    ...getAICredentials(),
    perplexity: (import.meta as any).env?.VITE_PERPLEXITY_API_KEY || getAICredentials().perplexity || ''
  }));

  // Handle OAuth callback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // OAuth callback successful
        console.log('OAuth sign in successful');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const region = (apiKeys?.bedrock?.region) || (import.meta as any).env?.VITE_AWS_REGION || 'us-west-2'; // AWS region from runtime or env

  const handleBookGenerated = (generatedBook: Book) => {
    saveBookToDatabase(generatedBook);
    setBook(generatedBook);
    setCurrentStep('outline');
  };

  const saveBookToDatabase = async (bookToSave: Book) => {
    try {
      await saveBook(bookToSave);
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  const handleChapterClick = (chapter: BookChapter) => {
    setSelectedChapter(chapter);
    setCurrentStep('chapter');
  };

  const handleBackToOutline = () => {
    setSelectedChapter(null);
    setCurrentStep('outline');
  };

  const handleUpdateChapter = (updatedChapter: BookChapter) => {
    if (!book) return;
    
    const updatedChapters = book.chapters.map(ch => 
      ch.id === updatedChapter.id ? updatedChapter : ch
    );
    
    const updatedBook = { ...book, chapters: updatedChapters };
    setBook(updatedBook);
    setSelectedChapter(updatedChapter);
    
    // Auto-save progress
    saveBookToDatabase(updatedBook);
  };

  const handleNewBook = () => {
    setBook(null);
    setSelectedChapter(null);
    setCurrentStep('prompt');
  };

  const handleSelectBook = async (selectedBook: Book) => {
    try {
      const fullBook = await loadBook(selectedBook.id);
      if (fullBook) {
        setBook(fullBook);
        setSelectedChapter(null);
        setIsCancelled(false);
        // Check if we're in edit mode from URL hash
        const hash = window.location.hash;
        if (hash.startsWith('#edit/')) {
          setCurrentStep('edit');
        } else {
          setCurrentStep('outline');
        }
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading book:', error);
      alert('Failed to load book. Please try again.');
    }
  };

  const handleNewBookFromSidebar = () => {
    setBook(null);
    setSelectedChapter(null);
    setCurrentStep('prompt');
    setIsCancelled(false);
    setSidebarOpen(false);
  };

  const handleEditBook = () => {
    if (book) {
      setCurrentStep('edit');
      window.location.hash = `#edit/${book.id}`;
    }
  };

  const handleBackFromEdit = () => {
    setCurrentStep('outline');
    window.location.hash = '';
  };

  // Handle URL hash changes for edit mode
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#edit/') && book) {
        setCurrentStep('edit');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [book]);

  return (
    <AuthWrapper>
      <div className="flex h-screen">
        {/* Sidebar */}
        <BookSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectBook={handleSelectBook}
          onNewBook={handleNewBookFromSidebar}
          currentBookId={book?.id}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-4">
                  <img 
                    src="/generated-image.png" 
                    alt="Unstack Logo" 
                    className="h-10 w-auto"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-800">Unstack</h1>
                      {isLocalAIEnabled() && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                          Local AI Mode
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 hidden sm:block">Create comprehensive eBooks with AI-powered research and generation</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAPISettings(true)}
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm text-gray-700"
                  title="API Keys"
                >
                  API Keys
                </button>
                <button
                  onClick={() => setShowAIConfig(!showAIConfig)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  title="AI Configuration"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {currentStep === 'prompt' && (
                <BookPrompt 
                  onBookGenerated={handleBookGenerated}
                  apiKeys={apiKeys}
                  region={region}
                />
              )}

              {currentStep === 'outline' && book && (
                <OutlineView 
                  book={book}
                  onChapterClick={handleChapterClick}
                  onNewBook={handleNewBook}
                  onUpdateBook={(updatedBook) => {
                    setBook(updatedBook);
                    saveBookToDatabase(updatedBook);
                  }}
                  apiKeys={apiKeys}
                  region={region}
                  isCancelled={isCancelled}
                  onCancel={() => setIsCancelled(true)}
                  onResume={() => setIsCancelled(false)}
                />
              )}

              {currentStep === 'chapter' && selectedChapter && book && (
                <ChapterView 
                  chapter={selectedChapter}
                  onBack={handleBackToOutline}
                  onUpdateChapter={handleUpdateChapter}
                  apiKeys={apiKeys}
                  region={region}
                  isCancelled={isCancelled}
                  onCancel={() => setIsCancelled(true)}
                  onResume={() => setIsCancelled(false)}
                />
              )}

              {currentStep === 'edit' && book && (
                <BookEditor 
                  book={book}
                  onBack={handleBackFromEdit}
                  onUpdateBook={(updatedBook) => {
                    setBook(updatedBook);
                    saveBookToDatabase(updatedBook);
                  }}
                  apiKeys={apiKeys}
                />
              )}
            </div>
          </main>
        </div>

        {/* AI Configuration Panel */}
        <AIConfigPanel 
          isOpen={showAIConfig}
          onClose={() => setShowAIConfig(false)}
        />

        {/* API Settings Modal */}
        {showAPISettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <APISettings
                onAPIKeysSet={(keys) => setApiKeys(keys)}
                onClose={() => setShowAPISettings(false)}
              />
            </div>
          </div>
        )}
      </div>
    </AuthWrapper>
  );
}

export default App;
