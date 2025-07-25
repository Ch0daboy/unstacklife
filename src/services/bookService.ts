import { Book, BookChapter, SubChapter } from '../types';
import { supabase } from '../lib/supabase';


export const saveBook = async (book: Book): Promise<Book> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  // Save/update book
  const { data: bookData, error: bookError } = await supabase
    .from('books')
    .upsert({
      id: book.id,
      user_id: user.id,
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
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (bookError) throw bookError;

  // Delete existing chapters and sub-chapters
  await supabase.from('chapters').delete().eq('book_id', book.id);

  // Save chapters
  if (book.chapters && book.chapters.length > 0) {
    const chaptersToInsert = book.chapters.map((chapter, index) => ({
      id: chapter.id,
      book_id: book.id,
      title: chapter.title,
      description: chapter.description,
      status: chapter.status,
      order_index: index
    }));

    const { error: chaptersError } = await supabase
      .from('chapters')
      .insert(chaptersToInsert);

    if (chaptersError) throw chaptersError;

    // Save sub-chapters
    const subChaptersToInsert: any[] = [];
    book.chapters.forEach((chapter) => {
      if (chapter.subChapters) {
        chapter.subChapters.forEach((subChapter, subIndex) => {
          subChaptersToInsert.push({
            id: subChapter.id,
            chapter_id: chapter.id,
            title: subChapter.title,
            description: subChapter.description,
            content: subChapter.content,
            status: subChapter.status,
            order_index: subIndex
          });
        });
      }
    });

    if (subChaptersToInsert.length > 0) {
      const { error: subChaptersError } = await supabase
        .from('sub_chapters')
        .insert(subChaptersToInsert);

      if (subChaptersError) throw subChaptersError;
    }
  }

  return book;
};

export const loadBook = async (bookId: string): Promise<Book | null> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  // Load book
  const { data: bookData, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (bookError || !bookData) return null;

  // Load chapters
  const { data: chaptersData, error: chaptersError } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index');

  if (chaptersError) throw chaptersError;

  // Load sub-chapters
  const { data: subChaptersData, error: subChaptersError } = await supabase
    .from('sub_chapters')
    .select('*')
    .in('chapter_id', chaptersData?.map(c => c.id) || [])
    .order('order_index');

  if (subChaptersError) throw subChaptersError;

  // Assemble the book structure
  const chapters: BookChapter[] = (chaptersData || []).map(chapter => {
    const chapterSubChapters = (subChaptersData || [])
      .filter(sc => sc.chapter_id === chapter.id)
      .map(sc => ({
        id: sc.id,
        title: sc.title,
        description: sc.description || '',
        content: sc.content || '',
        status: sc.status as 'pending' | 'generating' | 'completed'
      }));

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description || '',
      status: chapter.status as 'pending' | 'generating' | 'completed',
      expanded: false,
      subChapters: chapterSubChapters
    };
  });

  return {
    id: bookData.id,
    title: bookData.title,
    description: bookData.description || '',
    genre: bookData.genre || '',
    subGenre: bookData.sub_genre,
    tone: bookData.tone || '',
    heatLevel: bookData.heat_level,
    perspective: bookData.perspective,
    targetAudience: bookData.target_audience,
    coverUrl: bookData.cover_url,
    status: bookData.status as 'draft' | 'generating' | 'completed',
    chapters
  };
};

export const loadAllBooks = async (): Promise<Book[]> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data: booksData, error: booksError } = await supabase
    .from('books')
    .select(`
      *,
      chapters (
        id,
        title,
        description,
        status,
        order_index,
        sub_chapters (
          id,
          title,
          description,
          content,
          status,
          order_index
        )
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (booksError) throw booksError;

  return (booksData || []).map(bookData => {
    const chapters: BookChapter[] = (bookData.chapters || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || '',
        status: chapter.status as 'pending' | 'generating' | 'completed',
        expanded: false,
        subChapters: (chapter.sub_chapters || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((sc: any) => ({
            id: sc.id,
            title: sc.title,
            description: sc.description || '',
            content: sc.content || '',
            status: sc.status as 'pending' | 'generating' | 'completed'
          }))
      }));

    return {
      id: bookData.id,
      title: bookData.title,
      description: bookData.description || '',
      genre: bookData.genre || '',
      subGenre: bookData.sub_genre,
      tone: bookData.tone || '',
      heatLevel: bookData.heat_level,
      perspective: bookData.perspective,
      targetAudience: bookData.target_audience,
      coverUrl: bookData.cover_url,
      status: bookData.status as 'draft' | 'generating' | 'completed',
      chapters
    };
  });
};

export const deleteBook = async (bookId: string): Promise<void> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .eq('user_id', user.id);

  if (error) throw error;
};