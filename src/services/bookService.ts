import { Book, BookChapter, SubChapter } from '../types';
import { saveBook as dbSaveBook, loadBook as dbLoadBook, loadAllBooks as dbLoadAllBooks, deleteBook as dbDeleteBook } from '../lib/database';
import { getCurrentUser } from '../lib/auth';

// Convert database format to app format
const convertDatabaseBookToBook = (dbBook: any): Book => {
  return {
    id: dbBook.id,
    title: dbBook.title,
    description: dbBook.description || '',
    genre: dbBook.genre,
    subGenre: dbBook.subGenre,
    tone: dbBook.tone,
    heatLevel: dbBook.heatLevel,
    perspective: dbBook.perspective,
    targetAudience: dbBook.targetAudience,
    status: dbBook.status as 'draft' | 'generating' | 'completed',
    chapters: dbBook.chapters || []
  };
};

export const saveBook = async (book: Book): Promise<Book> => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const savedBook = dbSaveBook(book, user.id);
  return convertDatabaseBookToBook(savedBook);
};

export const loadBook = async (bookId: string): Promise<Book | null> => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const bookData = dbLoadBook(bookId, user.id);
  if (!bookData) return null;
  
  return convertDatabaseBookToBook(bookData);
};

export const loadAllBooks = async (): Promise<Book[]> => {
  const user = getCurrentUser();
  if (!user) return [];

  const booksData = dbLoadAllBooks(user.id);
  return booksData.map((bookData: any) => convertDatabaseBookToBook(bookData));
};

export const deleteBook = async (bookId: string): Promise<void> => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  dbDeleteBook(bookId, user.id);
};