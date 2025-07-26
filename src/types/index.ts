export interface SubChapter {
  id: string;
  title: string;
  description: string;
  content?: string;
  status: 'pending' | 'generating' | 'completed';
}

export interface BookChapter {
  id: string;
  title: string;
  description: string;
  subChapters?: SubChapter[];
  status: 'pending' | 'generating' | 'completed';
  expanded?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  description: string;
  genre: string;
  subGenre?: string;
  tone: string;
  heatLevel?: string;
  perspective?: string;
  coverUrl?: string;
  chapters: BookChapter[];
  status: 'draft' | 'generating' | 'completed';
}