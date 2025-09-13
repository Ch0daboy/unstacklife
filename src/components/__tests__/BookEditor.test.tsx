import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookEditor from '@/components/BookEditor';
import type { Book } from '@/types';

vi.mock('@/services/editingService', () => ({
  editContent: vi.fn(async (content: string) => content + ' [edited]'),
  editWholeBook: vi.fn(async (book: Book) => ({
    ...book,
    chapters: book.chapters.map(c => ({
      ...c,
      description: (c.description || '') + ' [edited]',
    })),
  })),
}));

const baseBook: Book = {
  id: 'b',
  title: 'Book',
  author: 'A',
  description: 'D',
  genre: 'Non-Fiction',
  subGenre: '',
  tone: '',
  perspective: '',
  status: 'draft',
  chapters: [
    {
      id: 'c1',
      title: 'Ch1',
      description: 'desc',
      status: 'completed',
      subChapters: [
        { id: 's1', title: 'S1', description: 'sd', status: 'completed', content: 'content' },
      ],
    },
  ],
};

describe('BookEditor', () => {
  it('opens whole-book edit modal and processes edit', async () => {
    render(
      <BookEditor
        book={baseBook}
        onBack={vi.fn()}
        onUpdateBook={vi.fn()}
        apiKeys={{ gemini: '', perplexity: '' }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit whole book/i }));
    const textarea = screen.getByLabelText(/what changes would you like/i);
    fireEvent.change(textarea, { target: { value: 'Make it better' } });
    fireEvent.click(screen.getByRole('button', { name: /apply changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/preview changes/i)).toBeInTheDocument();
    });
  });
});

