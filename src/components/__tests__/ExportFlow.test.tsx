import { render, screen, fireEvent } from '@testing-library/react';
import type { Book } from '@/types';

vi.mock('@/services/exportService', () => ({
  exportToPDF: vi.fn(async () => {}),
  exportToEPUB: vi.fn(async () => {}),
}));
vi.mock('@/services/coverServiceBackend', () => ({
  generateBookCoverWithBedrock: vi.fn(async () => 'data:image/png;base64,IMG'),
}));

// Import after mocks so OutlineView sees mocked modules
import OutlineView from '@/components/OutlineView';

const completedBook: Book = {
  id: 'b',
  title: 'Done Book',
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
      description: 'd',
      status: 'completed',
      subChapters: [
        { id: 's1', title: 'S1', description: 'sd', status: 'completed', content: 'content' },
      ],
    },
  ],
  coverUrl: 'data:image/png;base64,IMG',
};

describe('Export Flow', () => {
  it('invokes export services when clicking buttons', async () => {
    const { exportToPDF, exportToEPUB } = await import('@/services/exportService');
    render(
      <OutlineView
        book={completedBook}
        onChapterClick={vi.fn()}
        onNewBook={vi.fn()}
        onUpdateBook={vi.fn()}
        apiKeys={{}}
        isCancelled={false}
        onCancel={vi.fn()}
        onResume={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /export as pdf/i }));
    fireEvent.click(screen.getByRole('button', { name: /export as epub/i }));

    expect(exportToPDF).toHaveBeenCalled();
    expect(exportToEPUB).toHaveBeenCalled();
  });
});
