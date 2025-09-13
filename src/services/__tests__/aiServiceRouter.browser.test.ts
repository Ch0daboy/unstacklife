import { generateContent } from '@/services/aiServiceRouter';

// In browser-like environment, Bedrock calls are disabled and should fallback to Gemini
vi.mock('@/services/geminiService', () => ({
  generateContent: vi.fn(async () => 'Gemini content'),
}));
vi.mock('@/services/bedrockService', () => ({
  generateContent: vi.fn(async () => 'Bedrock content'),
}));

describe('aiServiceRouter (browser)', () => {
  it('uses Bedrock via backend in browser', async () => {
    // Mock bedrock service to simulate backend usage
    const bedrock = await import('@/services/bedrockService');
    vi.spyOn(bedrock, 'generateContent').mockResolvedValueOnce('Bedrock content');

    const { result, usedService } = await generateContent('t', 'd', {});
    expect(result).toBe('Bedrock content');
    expect(usedService).toBe('bedrock');
  });
});
