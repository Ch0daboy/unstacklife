import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CodexResponse {
  output: string;
  error?: string;
}

/**
 * Codex CLI Service - Local alternative to Gemini API
 * Uses the local Codex CLI for content generation
 */

const callCodexCLI = async (prompt: string, options: {
  maxTokens?: number;
  temperature?: number;
  isCancelledFn?: () => boolean;
} = {}): Promise<string> => {
  const { maxTokens = 2048, temperature = 0.7, isCancelledFn } = options;

  // Check for cancellation before starting
  if (isCancelledFn && isCancelledFn()) {
    throw new Error('Generation cancelled');
  }

  try {
    // Create a temporary prompt file to handle multiline prompts
    const tempPromptFile = `/tmp/codex_prompt_${Date.now()}.txt`;
    const fs = await import('fs');
    await fs.promises.writeFile(tempPromptFile, prompt, 'utf8');

    // Build codex CLI command
    const codexCommand = [
      'codex',
      'generate',
      `--prompt-file="${tempPromptFile}"`,
      `--max-tokens=${maxTokens}`,
      `--temperature=${temperature}`,
      '--model=code-davinci-002',
      '--format=text'
    ].join(' ');

    console.log('🔧 Calling Codex CLI:', codexCommand);

    // Execute codex CLI command
    const { stdout, stderr } = await execAsync(codexCommand, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    // Clean up temp file
    try {
      await fs.promises.unlink(tempPromptFile);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }

    if (stderr) {
      console.warn('Codex CLI stderr:', stderr);
    }

    if (!stdout || stdout.trim().length === 0) {
      throw new Error('Empty response from Codex CLI');
    }

    // Check for cancellation after generation
    if (isCancelledFn && isCancelledFn()) {
      throw new Error('Generation cancelled');
    }

    return stdout.trim();

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('Codex CLI not found. Please install codex CLI: npm install -g @openai/codex-cli');
    }
    
    if (error.message?.includes('cancelled')) {
      throw error;
    }

    console.error('Codex CLI Error:', error);
    throw new Error(`Codex CLI error: ${error.message}`);
  }
};

export const generateBookOutline = async (
  title: string, 
  description: string, 
  genre: string,
  isCancelledFn?: () => boolean
): Promise<any[]> => {
  const prompt = `Create a comprehensive book outline for the following book:

Title: ${title}
Description: ${description}
Genre: ${genre}

Generate a detailed chapter structure with the following format for each chapter:
- Chapter number and title
- Brief description of what happens in the chapter
- 3-5 sub-sections with titles and descriptions

Return the outline as a JSON array where each chapter object has:
{
  "id": "unique-id",
  "title": "Chapter Title",
  "description": "Chapter description",
  "subChapters": [
    {
      "id": "unique-id",
      "title": "Sub-chapter title",
      "description": "Sub-chapter description",
      "status": "pending"
    }
  ]
}

Generate 8-12 chapters total. Focus on creating a compelling narrative structure.`;

  try {
    const response = await callCodexCLI(prompt, { 
      maxTokens: 3000, 
      temperature: 0.8,
      isCancelledFn 
    });
    
    // Try to parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: create a basic structure if JSON parsing fails
    console.warn('Could not parse JSON from Codex response, using fallback structure');
    return createFallbackOutline(title, description);
    
  } catch (error) {
    console.error('Error generating book outline with Codex:', error);
    throw error;
  }
};

export const generateChapterOutline = async (
  chapterTitle: string, 
  chapterDescription: string,
  isCancelledFn?: () => boolean
): Promise<any[]> => {
  const prompt = `Create a detailed outline for this book chapter:

Chapter Title: ${chapterTitle}
Chapter Description: ${chapterDescription}

Generate 3-6 sub-sections for this chapter. Each sub-section should have:
- A compelling title
- A detailed description of the content
- Clear narrative flow

Return as a JSON array with this format:
[
  {
    "id": "unique-id",
    "title": "Sub-section title",
    "description": "Detailed description of content",
    "status": "pending"
  }
]

Focus on creating engaging, well-structured content sections.`;

  try {
    const response = await callCodexCLI(prompt, { 
      maxTokens: 1500, 
      temperature: 0.7,
      isCancelledFn 
    });
    
    // Try to parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback structure
    return createFallbackSubChapters(chapterTitle);
    
  } catch (error) {
    console.error('Error generating chapter outline with Codex:', error);
    throw error;
  }
};

export const generateContent = async (
  sectionTitle: string,
  sectionDescription: string,
  isCancelledFn?: () => boolean
): Promise<string> => {
  const prompt = `Write comprehensive, high-quality content for the following section:

Section Title: ${sectionTitle}
Section Description: ${sectionDescription}

Requirements:
- Write 3-5 paragraphs of engaging, well-structured content
- Make it suitable for an eBook format
- Use clear, compelling prose appropriate for the topic
- Do not include markdown formatting or section headers
- Focus on providing valuable, informative content

Write the content now:`;

  try {
    const response = await callCodexCLI(prompt, { 
      maxTokens: 2048, 
      temperature: 0.7,
      isCancelledFn 
    });
    
    return response.trim();
    
  } catch (error) {
    console.error('Error generating content with Codex:', error);
    throw error;
  }
};

export const generateContentWithHeatLevel = async (
  sectionTitle: string,
  sectionDescription: string,
  heatLevel: string,
  perspective: string = '',
  isCancelledFn?: () => boolean
): Promise<string> => {
  const heatLevelInstructions = {
    'clean': 'Write clean, wholesome content with no sexual content or adult themes. Focus on emotional connection and sweet romance.',
    'sweet': 'Write sweet romantic content with light romantic tension. Keep it PG-13 with kissing and emotional intimacy.',
    'sensual': 'Write sensual content with moderate romantic tension. Include passionate kissing and emotional/physical attraction.',
    'steamy': 'Write steamy romantic content with sexual tension and desire. Include passionate scenes but fade to black.',
    'spicy': 'Write spicy romantic content with explicit sexual tension and desire. Include detailed passionate scenes.',
    'explicit': 'Write explicit romantic content with detailed intimate scenes and adult themes.'
  };

  const perspectiveNote = perspective ? `Write in ${perspective === 'first' ? 'first person' : perspective === 'third-limited' ? 'third person limited' : 'third person omniscient'} perspective.` : '';

  const prompt = `Write romantic content for the following section:

Section Title: ${sectionTitle}
Section Description: ${sectionDescription}

Heat Level: ${heatLevel}
Instructions: ${heatLevelInstructions[heatLevel as keyof typeof heatLevelInstructions] || heatLevelInstructions.clean}
${perspectiveNote}

Requirements:
- Write 3-5 paragraphs appropriate for the specified heat level
- Make it suitable for romance eBook format
- Use engaging, emotional prose
- Match the heat level guidelines precisely
- Do not include markdown formatting or section headers

Write the content now:`;

  try {
    const response = await callCodexCLI(prompt, { 
      maxTokens: 2048, 
      temperature: 0.8,
      isCancelledFn 
    });
    
    return response.trim();
    
  } catch (error) {
    console.error('Error generating heat level content with Codex:', error);
    throw error;
  }
};

// Fallback functions for when AI parsing fails
const createFallbackOutline = (title: string, description: string): any[] => {
  const { v4: uuidv4 } = require('uuid');
  
  return [
    {
      id: uuidv4(),
      title: "Introduction",
      description: "Setting the stage and introducing key concepts",
      subChapters: createFallbackSubChapters("Introduction")
    },
    {
      id: uuidv4(),
      title: "Development",
      description: "Exploring the main themes and ideas",
      subChapters: createFallbackSubChapters("Development")
    },
    {
      id: uuidv4(),
      title: "Conclusion",
      description: "Bringing everything together and final thoughts",
      subChapters: createFallbackSubChapters("Conclusion")
    }
  ];
};

const createFallbackSubChapters = (chapterTitle: string): any[] => {
  const { v4: uuidv4 } = require('uuid');
  
  return [
    {
      id: uuidv4(),
      title: `${chapterTitle} - Part 1`,
      description: `Opening section of ${chapterTitle}`,
      status: "pending"
    },
    {
      id: uuidv4(),
      title: `${chapterTitle} - Part 2`,
      description: `Development section of ${chapterTitle}`,
      status: "pending"
    },
    {
      id: uuidv4(),
      title: `${chapterTitle} - Part 3`,
      description: `Conclusion section of ${chapterTitle}`,
      status: "pending"
    }
  ];
};