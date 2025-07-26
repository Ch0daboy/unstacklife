import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit3, Wand2, Check, X, Save, RefreshCw, Type, BookOpen } from 'lucide-react';
import { Book, BookChapter, SubChapter } from '../types';
import { editContent, editWholeBook } from '../services/editingService';

interface BookEditorProps {
  book: Book;
  onBack: () => void;
  onUpdateBook: (book: Book) => void;
  apiKeys: {gemini: string; perplexity: string};
}

interface ChangePreview {
  id: string;
  type: 'section' | 'whole-book';
  originalContent: string;
  newContent: string;
  chapterId?: string;
  subChapterId?: string;
  prompt: string;
}

const BookEditor: React.FC<BookEditorProps> = ({ 
  book, 
  onBack, 
  onUpdateBook,
  apiKeys 
}) => {
  const [editingBook, setEditingBook] = useState<Book>(book);
  const [selectedText, setSelectedText] = useState('');
  const [selectionContext, setSelectionContext] = useState<{
    chapterId: string;
    subChapterId: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [changePreview, setChangePreview] = useState<ChangePreview | null>(null);
  const [editMode, setEditMode] = useState<'selection' | 'whole-book'>('selection');
  
  useEffect(() => {
    setEditingBook(book);
  }, [book]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Find which chapter/subchapter the selection belongs to
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
    
    const chapterElement = element?.closest('[data-chapter-id]');
    const subChapterElement = element?.closest('[data-subchapter-id]');
    
    if (chapterElement && subChapterElement) {
      const chapterId = chapterElement.getAttribute('data-chapter-id');
      const subChapterId = subChapterElement.getAttribute('data-subchapter-id');
      
      if (chapterId && subChapterId) {
        setSelectedText(selectedText);
        setSelectionContext({
          chapterId,
          subChapterId,
          startOffset: range.startOffset,
          endOffset: range.endOffset
        });
      }
    }
  };

  const handleEditPrompt = (mode: 'selection' | 'whole-book') => {
    setEditMode(mode);
    setShowPromptModal(true);
  };

  const processEdit = async () => {
    if (!editPrompt.trim()) return;

    setIsProcessing(true);
    try {
      if (editMode === 'whole-book') {
        const newBook = await editWholeBook(editingBook, editPrompt, apiKeys.gemini);
        setChangePreview({
          id: Date.now().toString(),
          type: 'whole-book',
          originalContent: JSON.stringify(editingBook.chapters),
          newContent: JSON.stringify(newBook.chapters),
          prompt: editPrompt
        });
      } else if (selectedText && selectionContext) {
        const chapter = editingBook.chapters.find(c => c.id === selectionContext.chapterId);
        const subChapter = chapter?.subChapters?.find(sc => sc.id === selectionContext.subChapterId);
        
        if (subChapter?.content) {
          const newContent = await editContent(
            subChapter.content,
            selectedText,
            editPrompt,
            apiKeys.gemini
          );
          
          setChangePreview({
            id: Date.now().toString(),
            type: 'section',
            originalContent: subChapter.content,
            newContent,
            chapterId: selectionContext.chapterId,
            subChapterId: selectionContext.subChapterId,
            prompt: editPrompt
          });
        }
      }
    } catch (error) {
      console.error('Error processing edit:', error);
      alert('Failed to process edit. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowPromptModal(false);
      setEditPrompt('');
    }
  };

  const acceptChange = () => {
    if (!changePreview) return;

    if (changePreview.type === 'whole-book') {
      try {
        const newChapters = JSON.parse(changePreview.newContent);
        const updatedBook = { ...editingBook, chapters: newChapters };
        setEditingBook(updatedBook);
      } catch (error) {
        console.error('Error applying whole book changes:', error);
      }
    } else if (changePreview.chapterId && changePreview.subChapterId) {
      const updatedChapters = editingBook.chapters.map(chapter => {
        if (chapter.id === changePreview.chapterId) {
          return {
            ...chapter,
            subChapters: chapter.subChapters?.map(subChapter => {
              if (subChapter.id === changePreview.subChapterId) {
                return { ...subChapter, content: changePreview.newContent };
              }
              return subChapter;
            })
          };
        }
        return chapter;
      });
      
      setEditingBook({ ...editingBook, chapters: updatedChapters });
    }
    
    setChangePreview(null);
    setSelectedText('');
    setSelectionContext(null);
  };

  const rejectChange = () => {
    setChangePreview(null);
    setSelectedText('');
    setSelectionContext(null);
  };

  const saveChanges = () => {
    onUpdateBook(editingBook);
    alert('Changes saved successfully!');
  };

  const resetChanges = () => {
    if (confirm('Are you sure you want to reset all changes? This will revert to the original book.')) {
      setEditingBook(book);
      setChangePreview(null);
      setSelectedText('');
      setSelectionContext(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Edit: {editingBook.title}</h1>
                <p className="text-gray-600">AI-powered book editor</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetChanges}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={saveChanges}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>

        {/* Editing Toolbar */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <div className="flex items-center gap-2 text-blue-700">
            <Type className="w-5 h-5" />
            <span className="font-medium">Editing Tools:</span>
          </div>
          
          <button
            onClick={() => handleEditPrompt('selection')}
            disabled={!selectedText}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Edit Selection
            {selectedText && <span className="text-xs bg-blue-800 px-2 py-1 rounded">({selectedText.length} chars)</span>}
          </button>
          
          <button
            onClick={() => handleEditPrompt('whole-book')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Edit Whole Book
          </button>
          
          {selectedText && (
            <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border">
              Selected: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
            </div>
          )}
        </div>
      </div>

      {/* Change Preview */}
      {changePreview && (
        <div className="bg-white rounded-xl shadow-lg border-l-4 border-yellow-500">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Preview Changes - {changePreview.type === 'whole-book' ? 'Whole Book' : 'Selected Section'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={acceptChange}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={rejectChange}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Edit Prompt:</p>
              <p className="text-blue-800">{changePreview.prompt}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Original:</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 h-64 overflow-y-auto">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {changePreview.type === 'whole-book' ? 'Whole book content...' : changePreview.originalContent}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Proposed Changes:</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 h-64 overflow-y-auto">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {changePreview.type === 'whole-book' ? 'Updated book content...' : changePreview.newContent}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Content */}
      <div className="space-y-4" onMouseUp={handleTextSelection}>
        {editingBook.chapters.map((chapter, chapterIndex) => (
          <div key={chapter.id} className="bg-white rounded-xl shadow-lg" data-chapter-id={chapter.id}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Chapter {chapterIndex + 1}: {chapter.title}
              </h2>
              
              {chapter.subChapters?.map((subChapter, subIndex) => (
                <div key={subChapter.id} className="mb-6" data-subchapter-id={subChapter.id}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    {chapterIndex + 1}.{subIndex + 1} {subChapter.title}
                  </h3>
                  
                  <div className="prose prose-gray max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap select-text">
                      {subChapter.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {editMode === 'whole-book' ? 'Edit Whole Book' : 'Edit Selected Text'}
                </h3>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {editMode === 'selection' && selectedText && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Selected Text:</p>
                  <p className="text-blue-800 text-sm">"{selectedText.substring(0, 200)}{selectedText.length > 200 ? '...' : ''}"</p>
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="editPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  What changes would you like to make?
                </label>
                <textarea
                  id="editPrompt"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder={editMode === 'whole-book' 
                    ? "Describe the changes you want to make across the entire book..."
                    : "Describe how you want to modify the selected text..."
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={processEdit}
                  disabled={!editPrompt.trim() || isProcessing}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Apply Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookEditor;