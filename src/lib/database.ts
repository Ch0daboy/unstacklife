import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

// Initialize SQLite database
const db = new Database(':memory:'); // Use in-memory database for demo

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    sub_genre TEXT,
    tone TEXT,
    heat_level TEXT,
    perspective TEXT,
    target_audience TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sub_chapters (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending',
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
  CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
  CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(book_id, order_index);
  CREATE INDEX IF NOT EXISTS idx_sub_chapters_chapter_id ON sub_chapters(chapter_id);
  CREATE INDEX IF NOT EXISTS idx_sub_chapters_order ON sub_chapters(chapter_id, order_index);
`);

// User management
export const createUser = (email: string, password: string) => {
  const id = uuidv4();
  const hashedPassword = btoa(password); // Simple base64 encoding (not secure for production)
  
  const stmt = db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)');
  stmt.run(id, email, hashedPassword);
  
  return { id, email };
};

export const authenticateUser = (email: string, password: string) => {
  const hashedPassword = btoa(password);
  const stmt = db.prepare('SELECT id, email FROM users WHERE email = ? AND password = ?');
  return stmt.get(email, hashedPassword) as { id: string; email: string } | undefined;
};

export const getUserById = (id: string) => {
  const stmt = db.prepare('SELECT id, email FROM users WHERE id = ?');
  return stmt.get(id) as { id: string; email: string } | undefined;
};

// Book management
export const saveBook = (book: any, userId: string) => {
  const bookStmt = db.prepare(`
    INSERT OR REPLACE INTO books 
    (id, user_id, title, description, genre, sub_genre, tone, heat_level, perspective, target_audience, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  bookStmt.run(
    book.id,
    userId,
    book.title,
    book.description,
    book.genre,
    book.subGenre,
    book.tone,
    book.heatLevel,
    book.perspective,
    book.targetAudience,
    book.status
  );

  // Save chapters
  if (book.chapters) {
    const chapterStmt = db.prepare(`
      INSERT OR REPLACE INTO chapters 
      (id, book_id, title, description, status, order_index, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const subChapterStmt = db.prepare(`
      INSERT OR REPLACE INTO sub_chapters 
      (id, chapter_id, title, description, content, status, order_index, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    book.chapters.forEach((chapter: any, chapterIndex: number) => {
      chapterStmt.run(
        chapter.id,
        book.id,
        chapter.title,
        chapter.description,
        chapter.status,
        chapterIndex
      );

      if (chapter.subChapters) {
        chapter.subChapters.forEach((subChapter: any, subIndex: number) => {
          subChapterStmt.run(
            subChapter.id,
            chapter.id,
            subChapter.title,
            subChapter.description,
            subChapter.content,
            subChapter.status,
            subIndex
          );
        });
      }
    });
  }

  return book;
};

export const loadBook = (bookId: string, userId: string) => {
  const bookStmt = db.prepare('SELECT * FROM books WHERE id = ? AND user_id = ?');
  const book = bookStmt.get(bookId, userId) as any;
  
  if (!book) return null;

  const chaptersStmt = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY order_index');
  const chapters = chaptersStmt.all(bookId) as any[];

  for (const chapter of chapters) {
    const subChaptersStmt = db.prepare('SELECT * FROM sub_chapters WHERE chapter_id = ? ORDER BY order_index');
    chapter.subChapters = subChaptersStmt.all(chapter.id) as any[];
  }

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
    status: book.status,
    chapters: chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      status: chapter.status,
      expanded: false,
      subChapters: chapter.subChapters?.map((subChapter: any) => ({
        id: subChapter.id,
        title: subChapter.title,
        description: subChapter.description,
        content: subChapter.content,
        status: subChapter.status
      }))
    }))
  };
};

export const loadAllBooks = (userId: string) => {
  const stmt = db.prepare(`
    SELECT id, title, description, genre, sub_genre, tone, heat_level, perspective, target_audience, status, created_at
    FROM books 
    WHERE user_id = ? 
    ORDER BY updated_at DESC
  `);
  
  const books = stmt.all(userId) as any[];
  
  return books.map(book => ({
    id: book.id,
    title: book.title,
    description: book.description,
    genre: book.genre,
    subGenre: book.sub_genre,
    tone: book.tone,
    heatLevel: book.heat_level,
    perspective: book.perspective,
    targetAudience: book.target_audience,
    status: book.status,
    chapters: [] // Will be loaded separately when needed
  }));
};

export const deleteBook = (bookId: string, userId: string) => {
  const stmt = db.prepare('DELETE FROM books WHERE id = ? AND user_id = ?');
  stmt.run(bookId, userId);
};

export default db;