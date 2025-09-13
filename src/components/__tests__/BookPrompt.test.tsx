import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookPrompt from '@/components/BookPrompt';

vi.mock('@/services/userService', () => ({
  getUserProfile: vi.fn(async () => null),
}));

vi.mock('@/services/aiServiceRouter', () => ({
  generateContent: vi.fn(async () => ({ result: 'Generated description.' })),
  generateBookOutline: vi.fn(async () => ({
    result: {
      id: 'b1',
      title: 'T',
      author: 'A',
      description: 'D',
      genre: 'Non-Fiction',
      subGenre: '',
      tone: '',
      perspective: '',
      status: 'draft',
      chapters: [{ id: 'c1', title: 'C', description: 'CD', status: 'pending' }],
    },
    usedService: 'gemini',
  })),
}));

describe('BookPrompt', () => {
  it('generates description when clicking button after selecting genre', async () => {
    render(<BookPrompt onBookGenerated={vi.fn()} apiKeys={{}} />);

    // Select a genre to enable the button
    fireEvent.change(screen.getByLabelText(/genre/i), { target: { value: 'Romance' } });

    const btn = screen.getByRole('button', { name: /generate description/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByLabelText(/book description/i)).toHaveValue('Generated description.');
    });
  });
});
