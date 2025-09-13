import { Book } from '../types';

// Generate book cover by calling backend (server-side Bedrock Titan)
export const generateBookCoverWithBedrock = async (
  book: Book
): Promise<string> => {
  const response = await fetch('/api/cover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: book.title,
      genre: book.genre,
      description: book.description || ''
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cover generation failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data?.dataUrl) {
    throw new Error('Cover generation returned no image');
  }
  return data.dataUrl as string;
};

