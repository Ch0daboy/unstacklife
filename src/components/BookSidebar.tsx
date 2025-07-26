import React, { useState, useEffect } from 'react';
import { Book, BookOpen, Plus, Trash2, Clock, CheckCircle2, Play } from 'lucide-react';
import { Book as BookType } from '../types';
import { loadAllBooks, deleteBook } from '../services/bookService';
import { loadBook } from '../services/bookService';

interface BookSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectBook: (book: BookType) => void;
  onNewBook: () => void;
  currentBookId?: string;
}

const BookSidebar: React.FC<BookSidebarProps> = ({
  isOpen,
  onToggle,
  onSelectBook,
  onNewBook,
  currentBookId
}) => {
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const loadedBooks = await loadAllBooks();
      setBooks(loadedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      try {
        await deleteBook(bookId);
        setBooks(books.filter(book => book.id !== bookId));
      } catch (error) {
        console.error('Error deleting book:', error);
        alert('Failed to delete book. Please try again.');
      }
    }
  };

  const handleSelectBook = async (book: BookType) => {
    try {
      // Load full book details including chapters
      const fullBook = await loadBook(book.id);
      if (fullBook) {
        onSelectBook(fullBook);
      }
    } catch (error) {
      console.error('Error loading book:', error);
      onSelectBook(book); // Fallback to basic book data
    }
  };
  const getStatusIcon = (book: BookType) => {
    const completedChapters = book.chapters.filter(ch => ch.status === 'completed').length;
    const totalChapters = book.chapters.length;
    const isCompleted = completedChapters === totalChapters && book.chapters.every(ch => 
      ch.subChapters && ch.subChapters.every(sc => sc.status === 'completed')
    );

    if (isCompleted) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (completedChapters > 0) {
      return <Play className="w-4 h-4 text-blue-500" />;
    } else {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProgressText = (book: BookType) => {
    const completedChapters = book.chapters.filter(ch => ch.status === 'completed').length;
    const totalChapters = book.chapters.length;
    return `${completedChapters}/${totalChapters} chapters`;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-10
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/generated-image.png" 
                alt="Unstack Logo" 
                className="h-8 w-auto"
              />
              <h2 className="text-lg font-semibold text-gray-800">My Books</h2>
            </div>
            
            <button
              onClick={onNewBook}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Book
            </button>
          </div>

          {/* Books List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No books yet</p>
                <p className="text-sm">Create your first book to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {books.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => handleSelectBook(book)}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md group
                      ${currentBookId === book.id 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-800 text-sm line-clamp-2 flex-1 mr-2">
                        {book.title}
                      </h3>
                      {book.coverUrl && (
                        <img 
                          src={book.coverUrl} 
                          alt={`${book.title} cover`}
                          className="w-8 h-12 object-cover rounded-sm mr-2 flex-shrink-0"
                        />
                      )}
                      <button
                        onClick={(e) => handleDeleteBook(book.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(book)}
                      <span className="text-xs text-gray-600">
                        {getProgressText(book)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {book.genre}
                      </span>
                      <span>
                        {new Date(book.chapters[0]?.id ? Date.now() : Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    {book.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {book.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BookSidebar;