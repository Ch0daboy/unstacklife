import React, { useState } from 'react';
import { BookOpen, Sparkles, Wand2 } from 'lucide-react';
import { generateBookOutline } from '../services/geminiService';
import { Book } from '../types';
import { getUserProfile } from '../services/userService';

interface BookPromptProps {
  onBookGenerated: (book: Book) => void;
  apiKeys: {gemini: string; perplexity: string};
}

const GENRES = [
  'Romance',
  'Fantasy',
  'Science Fiction',
  'Mystery/Thriller',
  'Historical Fiction',
  'Contemporary Fiction',
  'Young Adult',
  'Non-Fiction',
  'Self-Help',
  'Business',
  'Biography/Memoir',
  'Other'
];

const HEAT_LEVELS = [
  {
    value: 'clean',
    label: 'Clean/Wholesome',
    description: 'Focus on romantic love and connection without explicit sexual content. Limited to kissing, hugs, and meaningful glances.'
  },
  {
    value: 'sweet',
    label: 'Sweet',
    description: 'Closed-door scenes where intimate moments are implied. Focus on emotional development and declarations of love.'
  },
  {
    value: 'sensual',
    label: 'Sensual/Warm',
    description: 'On-page love scenes with euphemistic language, focusing on emotional aspects rather than explicit details.'
  },
  {
    value: 'steamy',
    label: 'Steamy/Hot',
    description: 'Explicit sexual content with detailed descriptions and multiple intimate scenes.'
  },
  {
    value: 'spicy',
    label: 'Spicy/Erotic',
    description: 'Heavy emphasis on sexual activity with detailed descriptions, including side character interactions.'
  },
  {
    value: 'explicit',
    label: 'Explicit/Pornographic',
    description: 'Highly detailed and graphic descriptions of sexual acts, exploring characters\' sexual desires in detail.'
  }
];

const BookPrompt: React.FC<BookPromptProps> = ({ onBookGenerated, apiKeys }) => {
  const [prompt, setPrompt] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [subGenre, setSubGenre] = useState('');
  const [tone, setTone] = useState('');
  const [customTone, setCustomTone] = useState('');
  const [heatLevel, setHeatLevel] = useState('');
  const [perspective, setPerspective] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [targetAudience, setTargetAudience] = useState('');

  // Load user's default author name on component mount
  React.useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.default_author_name) {
          setAuthor(profile.default_author_name);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Don't show error to user, just continue without auto-fill
      }
    };
    
    loadUserProfile();
  }, []);

  const ROMANCE_SUBGENRES = [
    'Contemporary',
    'Historical',
    'Paranormal',
    'Fantasy',
    'Regency',
    'Western',
    'Romantic Suspense',
    'Military',
    'Sports',
    'Billionaire/CEO',
    'Small Town',
    'Second Chance',
    'Enemies to Lovers',
    'Friends to Lovers',
    'Fake Relationship',
    'Single Parent',
    'Holiday/Christmas',
    'Medical',
    'Motorcycle Club/Biker',
    'Mafia',
    'Royal',
    'Time Travel',
    'Alien/Sci-Fi',
    'Vampire/Shifter',
    'Gothic',
    'Inspirational/Christian'
  ];

  const PERSPECTIVES = [
    {
      value: 'first',
      label: 'First Person',
      description: 'Narrated from "I" perspective, offering intimate access to one character\'s thoughts and feelings'
    },
    {
      value: 'third-limited',
      label: 'Third Person Limited',
      description: 'Narrated from "he/she" perspective, following one character\'s viewpoint'
    },
    {
      value: 'third-omniscient',
      label: 'Third Person Omniscient',
      description: 'Narrated from "he/she" perspective with access to multiple characters\' thoughts'
    },
    {
      value: 'second',
      label: 'Second Person',
      description: 'Narrated from "you" perspective, addressing the reader directly (rare but powerful)'
    }
  ];

  const generateDescription = async () => {
    if (!genre) {
      alert('Please select a genre first to generate a description.');
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const actualTone = tone === 'Other' ? customTone : tone;
      
      let descriptionPrompt = `Generate a compelling book description for a ${genre} book`;
      
      if (subGenre && isRomance) {
        descriptionPrompt += ` in the ${subGenre} sub-genre`;
      }
      
      if (actualTone) {
        descriptionPrompt += ` with a ${actualTone.toLowerCase()} tone`;
      }
      
      if (perspective) {
        const perspectiveLabels = {
          'first': 'first person',
          'third-limited': 'third person limited',
          'third-omniscient': 'third person omniscient',
          'second': 'second person'
        };
        descriptionPrompt += ` written in ${perspectiveLabels[perspective as keyof typeof perspectiveLabels]}`;
      }
      
      if (heatLevel && isRomance) {
        const heatLevelLabels = {
          'clean': 'clean/wholesome',
          'sweet': 'sweet',
          'sensual': 'sensual',
          'steamy': 'steamy',
          'spicy': 'spicy',
          'explicit': 'explicit'
        };
        descriptionPrompt += ` with ${heatLevelLabels[heatLevel as keyof typeof heatLevelLabels]} heat level`;
      }
      
      if (targetAudience) {
        descriptionPrompt += ` for ${targetAudience}`;
      }
      
      descriptionPrompt += `. The description should be 2-3 sentences that outline what the book will cover, its main themes, and what readers can expect to learn or experience. Make it engaging and specific to the genre and settings provided.`;

      // Use the same Gemini API call structure from generateBookOutline
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKeys.gemini}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: descriptionPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedDescription = data.candidates[0]?.content?.parts[0]?.text || '';
      setPrompt(generatedDescription.trim());
    } catch (error) {
      console.error('Error generating description:', error);
      alert('Failed to generate description. Please try again.');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const book = await generateBookOutline(prompt, genre, subGenre, targetAudience, heatLevel, perspective, author, apiKeys.gemini);
      onBookGenerated(book);
    } catch (error) {
      console.error('Error generating book outline:', error);
      alert('Failed to generate book outline. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isRomance = genre.toLowerCase() === 'romance';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <img 
            src="/generated-image.png" 
            alt="Unstack Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Your eBook</h2>
          <p className="text-gray-600">Describe the book you want to create and let Unstack's AI generate a comprehensive outline</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Book Description
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the book you want to create. Include the topic, main themes, and any specific requirements..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              required
            />
          </div>
          
          <div className="flex justify-center">
            <button
              type="button"
              onClick={generateDescription}
              disabled={isGeneratingDescription || !genre}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isGeneratingDescription ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Description
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                Author Name (from your settings)
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name for this book..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-filled from your user settings, but you can edit it for this book
              </p>
            </div>

            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select a genre...</option>
                {GENRES.map((genreOption) => (
                  <option key={genreOption} value={genreOption}>
                    {genreOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience (Optional)
              </label>
              <input
                type="text"
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Entrepreneurs, Students, General readers"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {tone === 'Other' && (
            <div>
              <label htmlFor="customTone" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Tone
              </label>
              <input
                type="text"
                id="customTone"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder="Describe your desired tone..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          )}

          {isRomance && (
            <div>
              <label htmlFor="subGenre" className="block text-sm font-medium text-gray-700 mb-2">
                Romance Sub-Genre (Optional)
              </label>
              <select
                id="subGenre"
                value={subGenre}
                onChange={(e) => setSubGenre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select a sub-genre...</option>
                {ROMANCE_SUBGENRES.map((subGenreOption) => (
                  <option key={subGenreOption} value={subGenreOption}>
                    {subGenreOption}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isRomance && (
            <div>
              <label htmlFor="heatLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Heat Level
              </label>
              <select
                id="heatLevel"
                value={heatLevel}
                onChange={(e) => setHeatLevel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select heat level...</option>
                {HEAT_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              {heatLevel && (
                <p className="text-xs text-gray-600 mt-2">
                  {HEAT_LEVELS.find(level => level.value === heatLevel)?.description}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="perspective" className="block text-sm font-medium text-gray-700 mb-2">
              Narrative Perspective (Optional)
            </label>
            <select
              id="perspective"
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select perspective...</option>
              {PERSPECTIVES.map((perspectiveOption) => (
                <option key={perspectiveOption.value} value={perspectiveOption.value}>
                  {perspectiveOption.label}
                </option>
              ))}
            </select>
            {perspective && (
              <p className="text-xs text-gray-600 mt-2">
                {PERSPECTIVES.find(p => p.value === perspective)?.description}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Outline...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Book Outline
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default BookPrompt;