import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OutlineView from '@/components/OutlineView';
import type { Book, BookChapter } from '@/types';

vi.mock('@/services/coverServiceBackend', () => ({
  generateBookCoverWithBedrock: vi.fn(async (book: Book) => {
    return 'data:image/png;base64,TESTIMAGEBASE64';
  }),
}));

// Minimal book and handlers for rendering
const makeBook = (): Book => ({
  id: 'b1',
  title: 'Test Book',
  author: 'Author',
  description: 'Desc',
  genre: 'Non-Fiction',
  subGenre: '',
  tone: '',
  perspective: '',
  status: 'draft',
  chapters: [
    { id: 'c1', title: 'Chapter 1', description: 'd', status: 'pending' },
  ],
});

describe('OutlineView', () => {
  it('renders and generates cover via single button', async () => {
    const onUpdateBook = vi.fn();
    const book = makeBook();

    render(
      <OutlineView
        book={book}
        onChapterClick={vi.fn()}
        onNewBook={vi.fn()}
        onUpdateBook={onUpdateBook}
        apiKeys={{}}
        region={undefined}
        isCancelled={false}
        onCancel={vi.fn()}
        onResume={vi.fn()}
      />
    );

    const btn = await screen.findByRole('button', { name: /generate cover/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(onUpdateBook).toHaveBeenCalled();
      const updated = onUpdateBook.mock.calls[0][0] as Book;
      expect(updated.coverUrl?.startsWith('data:image/png;base64,')).toBe(true);
    });
  });
});

