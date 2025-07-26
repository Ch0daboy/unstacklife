// Browser-compatible local storage database implementation
interface User {
  id: string;
  email: string;
  password: string;
  created_at: string;
}

interface DatabaseBook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  genre: string | null;
  sub_genre: string | null;
  tone: string | null;
  heat_level: string | null;
  perspective: string | null;
  target_audience: string | null;
  cover_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseChapter {
  id: string;
  book_id: string;
  title: string;
  description: string | null;
  status: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface DatabaseSubChapter {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  content: string | null;
  status: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Generate UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Storage keys
const STORAGE_KEYS = {
  USERS: 'book_app_users',
  BOOKS: 'book_app_books',
  CHAPTERS: 'book_app_chapters',
  SUB_CHAPTERS: 'book_app_sub_chapters'
};

// Helper functions for localStorage operations
const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// User management
export const createUser = (email: string, password: string) => {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    throw new Error('User with this email already exists');
  }
  
  const id = generateUUID();
  const hashedPassword = btoa(password); // Simple base64 encoding (not secure for production)
  
  const newUser: User = {
    id,
    email,
    password: hashedPassword,
    created_at: new Date().toISOString()
  };
  
  users.push(newUser);
  saveToStorage(STORAGE_KEYS.USERS, users);
  
  return { id, email };
};

export const authenticateUser = (email: string, password: string) => {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const hashedPassword = btoa(password);
  
  const user = users.find(u => u.email === email && u.password === hashedPassword);
  return user ? { id: user.id, email: user.email } : undefined;
};

export const getUserById = (id: string) => {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const user = users.find(u => u.id === id);
  return user ? { id: user.id, email: user.email } : undefined;
};

// Book management
export const saveBook = (book: any, userId: string) => {
  const now = new Date().toISOString();
  
  // Save book
  const books = getFromStorage<DatabaseBook>(STORAGE_KEYS.BOOKS);
  const existingBookIndex = books.findIndex(b => b.id === book.id);
  
  const dbBook: DatabaseBook = {
    id: book.id,
    user_id: userId,
    title: book.title,
    description: book.description,
    genre: book.genre,
    sub_genre: book.subGenre,
    tone: book.tone,
    heat_level: book.heatLevel,
    perspective: book.perspective,
    target_audience: book.targetAudience,
    cover_url: book.coverUrl,
    status: book.status,
    created_at: existingBookIndex >= 0 ? books[existingBookIndex].created_at : now,
    updated_at: now
  };
  
  if (existingBookIndex >= 0) {
    books[existingBookIndex] = dbBook;
  } else {
    books.push(dbBook);
  }
  saveToStorage(STORAGE_KEYS.BOOKS, books);

  // Save chapters
  if (book.chapters) {
    const chapters = getFromStorage<DatabaseChapter>(STORAGE_KEYS.CHAPTERS);
    const subChapters = getFromStorage<DatabaseSubChapter>(STORAGE_KEYS.SUB_CHAPTERS);
    
    // Remove existing chapters for this book
    const filteredChapters = chapters.filter(c => c.book_id !== book.id);
    const filteredSubChapters = subChapters.filter(sc => {
      const chapter = chapters.find(c => c.id === sc.chapter_id);
      return !chapter || chapter.book_id !== book.id;
    });

    book.chapters.forEach((chapter: any, chapterIndex: number) => {
      const dbChapter: DatabaseChapter = {
        id: chapter.id,
        book_id: book.id,
        title: chapter.title,
        description: chapter.description,
        status: chapter.status,
        order_index: chapterIndex,
        created_at: now,
        updated_at: now
      };
      filteredChapters.push(dbChapter);

      if (chapter.subChapters) {
        chapter.subChapters.forEach((subChapter: any, subIndex: number) => {
          const dbSubChapter: DatabaseSubChapter = {
            id: subChapter.id,
            chapter_id: chapter.id,
            title: subChapter.title,
            description: subChapter.description,
            content: subChapter.content,
            status: subChapter.status,
            order_index: subIndex,
            created_at: now,
            updated_at: now
          };
          filteredSubChapters.push(dbSubChapter);
        });
      }
    });

    saveToStorage(STORAGE_KEYS.CHAPTERS, filteredChapters);
    saveToStorage(STORAGE_KEYS.SUB_CHAPTERS, filteredSubChapters);
  }

  return book;
};

export const loadBook = (bookId: string, userId: string) => {
  const books = getFromStorage<DatabaseBook>(STORAGE_KEYS.BOOKS);
  const book = books.find(b => b.id === bookId && b.user_id === userId);
  
  if (!book) return null;

  const chapters = getFromStorage<DatabaseChapter>(STORAGE_KEYS.CHAPTERS);
  const subChapters = getFromStorage<DatabaseSubChapter>(STORAGE_KEYS.SUB_CHAPTERS);
  
  const bookChapters = chapters
    .filter(c => c.book_id === bookId)
    .sort((a, b) => a.order_index - b.order_index);

  const chaptersWithSubChapters = bookChapters.map(chapter => {
    const chapterSubChapters = subChapters
      .filter(sc => sc.chapter_id === chapter.id)
      .sort((a, b) => a.order_index - b.order_index);
    
    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      status: chapter.status,
      expanded: false,
      subChapters: chapterSubChapters.map(subChapter => ({
        id: subChapter.id,
        title: subChapter.title,
        description: subChapter.description,
        content: subChapter.content,
        status: subChapter.status
      }))
    };
  });

  return {
    id: book.id,
    title: book.title,
    description: book.description,
    genre: book.genre,
    subGenre: book.sub_genre,
    tone: book.tone,
    heatLevel: book.heat_level,
    perspective: book.perspective,
    targetAudience: book.target_audience,
    coverUrl: book.cover_url,
    status: book.status,
    chapters: chaptersWithSubChapters
  };
};

export const loadAllBooks = (userId: string) => {
  const books = getFromStorage<DatabaseBook>(STORAGE_KEYS.BOOKS);
  
  const userBooks = books
    .filter(b => b.user_id === userId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  
  return userBooks.map(book => ({
    id: book.id,
    title: book.title,
    description: book.description,
    genre: book.genre,
    subGenre: book.sub_genre,
    tone: book.tone,
    heatLevel: book.heat_level,
    perspective: book.perspective,
    targetAudience: book.target_audience,
    coverUrl: book.cover_url,
    status: book.status,
    chapters: [] // Will be loaded separately when needed
  }));
};

export const deleteBook = (bookId: string, userId: string) => {
  // Remove book
  const books = getFromStorage<DatabaseBook>(STORAGE_KEYS.BOOKS);
  const filteredBooks = books.filter(b => !(b.id === bookId && b.user_id === userId));
  saveToStorage(STORAGE_KEYS.BOOKS, filteredBooks);
  
  // Remove chapters
  const chapters = getFromStorage<DatabaseChapter>(STORAGE_KEYS.CHAPTERS);
  const bookChapterIds = chapters.filter(c => c.book_id === bookId).map(c => c.id);
  const filteredChapters = chapters.filter(c => c.book_id !== bookId);
  saveToStorage(STORAGE_KEYS.CHAPTERS, filteredChapters);
  
  // Remove sub-chapters
  const subChapters = getFromStorage<DatabaseSubChapter>(STORAGE_KEYS.SUB_CHAPTERS);
  const filteredSubChapters = subChapters.filter(sc => !bookChapterIds.includes(sc.chapter_id));
  saveToStorage(STORAGE_KEYS.SUB_CHAPTERS, filteredSubChapters);
};

export default null; // No database instance needed for localStorage implementation