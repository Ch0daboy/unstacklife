import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Claude Code Service - Local alternative to Perplexity API
 * Uses Claude Code CLI for research and content generation
 */

interface ClaudeCodeOptions {
  maxTokens?: number;
  temperature?: number;
  isCancelledFn?: () => boolean;
}

const callClaudeCodeCLI = async (prompt: string, options: ClaudeCodeOptions = {}): Promise<string> => {
  const { isCancelledFn } = options;

  // Check for cancellation before starting
  if (isCancelledFn && isCancelledFn()) {
    throw new Error('Generation cancelled');
  }

  try {
    // Create a temporary prompt file to handle multiline prompts
    const tempPromptFile = `/tmp/claude_prompt_${Date.now()}.txt`;
    const fs = await import('fs');
    await fs.promises.writeFile(tempPromptFile, prompt, 'utf8');

    // Build Claude Code CLI command
    const claudeCommand = [
      'claude',
      'code',
      `--prompt-file="${tempPromptFile}"`,
      '--format=text',
      '--local-mode'
    ].join(' ');

    console.log('🤖 Calling Claude Code CLI:', claudeCommand);

    // Execute Claude Code CLI command
    const { stdout, stderr } = await execAsync(claudeCommand, {
      timeout: 90000, // 90 second timeout for research tasks
      maxBuffer: 20 * 1024 * 1024 // 20MB buffer for research content
    });

    // Clean up temp file
    try {
      await fs.promises.unlink(tempPromptFile);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }

    if (stderr) {
      console.warn('Claude Code CLI stderr:', stderr);
    }

    if (!stdout || stdout.trim().length === 0) {
      throw new Error('Empty response from Claude Code CLI');
    }

    // Check for cancellation after generation
    if (isCancelledFn && isCancelledFn()) {
      throw new Error('Generation cancelled');
    }

    return stdout.trim();

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('Claude Code CLI not found. Please install Claude Code CLI from: https://claude.ai/code');
    }
    
    if (error.message?.includes('cancelled')) {
      throw error;
    }

    console.error('Claude Code CLI Error:', error);
    throw new Error(`Claude Code CLI error: ${error.message}`);
  }
};

export const researchTopic = async (
  topic: string, 
  description: string,
  isCancelledFn?: () => boolean
): Promise<string> => {
  const prompt = `Research and provide comprehensive information about: ${topic}

Context: ${description}

Please provide detailed research covering:
1. Key facts and current information about this topic
2. Recent developments, trends, or updates
3. Expert opinions, statistics, or research findings
4. Practical applications, examples, or case studies
5. Important considerations, nuances, or different perspectives
6. Relevant background information or historical context

Focus on providing accurate, well-researched information that would be valuable for creating educational and informative content on this topic. Ensure the information is up-to-date and from reliable sources.

Research findings:`;

  try {
    const response = await callClaudeCodeCLI(prompt, { isCancelledFn });
    return response;
  } catch (error) {
    console.error('Error researching topic with Claude Code:', error);
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
- Write 4-6 paragraphs of engaging, well-structured content
- Make it suitable for an eBook format
- Use clear, compelling prose appropriate for the topic
- Ensure the content is informative and valuable to readers
- Write in a professional yet engaging tone
- Do not include markdown formatting or section headers
- Focus on providing substantive, meaningful content

Please write the content now:`;

  try {
    const response = await callClaudeCodeCLI(prompt, { isCancelledFn });
    return response;
  } catch (error) {
    console.error('Error generating content with Claude Code:', error);
    throw error;
  }
};

export const generateBookOutline = async (
  title: string,
  description: string,
  genre: string,
  perspective?: string,
  tone?: string,
  isCancelledFn?: () => boolean
): Promise<any[]> => {
  const perspectiveNote = perspective ? `\nPerspective: ${perspective}` : '';
  const toneNote = tone ? `\nTone: ${tone}` : '';

  const prompt = `Create a comprehensive book outline for the following book:

Title: ${title}
Description: ${description}
Genre: ${genre}${perspectiveNote}${toneNote}

Generate a detailed chapter structure with 8-12 chapters. For each chapter, provide:
- A compelling chapter title
- A comprehensive description of what happens in the chapter
- The chapter's role in the overall narrative arc

Return the outline as a JSON array where each chapter object has this exact format:
{
  "id": "chapter-1",
  "title": "Chapter Title Here",
  "description": "Detailed description of what happens in this chapter and its purpose in the book",
  "status": "pending"
}

Focus on creating a compelling narrative structure that engages readers and provides value. Ensure each chapter builds upon the previous one and contributes to the overall book's goals.

JSON outline:`;

  try {
    const response = await callClaudeCodeCLI(prompt, { isCancelledFn });
    
    // Try to parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const outline = JSON.parse(jsonMatch[0]);
      // Ensure each chapter has a proper ID and status
      return outline.map((chapter: any, index: number) => ({
        ...chapter,
        id: chapter.id || `chapter-${index + 1}`,
        status: 'pending'
      }));
    }
    
    // Fallback: create a basic structure if JSON parsing fails
    console.warn('Could not parse JSON from Claude Code response, using fallback structure');
    return createFallbackOutline(title, description);
    
  } catch (error) {
    console.error('Error generating book outline with Claude Code:', error);
    throw error;
  }
};

export const generateChapterOutline = async (
  chapterTitle: string,
  chapterDescription: string,
  isCancelledFn?: () => boolean
): Promise<any[]> => {
  const prompt = `Create a detailed sub-chapter outline for this book chapter:

Chapter Title: ${chapterTitle}
Chapter Description: ${chapterDescription}

Generate 4-6 sub-sections for this chapter. Each sub-section should:
- Have a compelling, descriptive title
- Include a detailed description of the content and purpose
- Flow naturally into the next section
- Contribute meaningfully to the chapter's overall goals

Return as a JSON array with this exact format:
[
  {
    "id": "subsection-1",
    "title": "Sub-section Title Here",
    "description": "Detailed description of what content will be covered in this sub-section",
    "status": "pending"
  }
]

Focus on creating well-structured, engaging content sections that provide real value to readers.

JSON sub-sections:`;

  try {
    const response = await callClaudeCodeCLI(prompt, { isCancelledFn });
    
    // Try to parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const subChapters = JSON.parse(jsonMatch[0]);
      // Ensure each sub-chapter has a proper ID and status
      return subChapters.map((subChapter: any, index: number) => ({
        ...subChapter,
        id: subChapter.id || `subsection-${index + 1}`,
        status: 'pending'
      }));
    }
    
    // Fallback structure
    return createFallbackSubChapters(chapterTitle);
    
  } catch (error) {
    console.error('Error generating chapter outline with Claude Code:', error);
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
    'clean': 'Write clean, wholesome romantic content with no sexual content. Focus on emotional connection, sweet moments, and pure romance. Keep it family-friendly.',
    'sweet': 'Write sweet romantic content with light romantic tension. Include emotional intimacy, hand-holding, and sweet kisses. Keep it PG-13.',
    'sensual': 'Write sensual romantic content with moderate romantic tension. Include passionate kissing, emotional and physical attraction, and romantic desire.',
    'steamy': 'Write steamy romantic content with strong sexual tension and desire. Include passionate scenes with emotional depth, but fade to black before explicit content.',
    'spicy': 'Write spicy romantic content with explicit sexual tension, desire, and passionate scenes. Include detailed romantic and intimate moments.',
    'explicit': 'Write explicit romantic content with detailed intimate scenes and adult themes. Include mature romantic content appropriate for adult readers.'
  };

  const perspectiveNote = perspective ? `Write in ${perspective === 'first' ? 'first person' : perspective === 'third-limited' ? 'third person limited' : 'third person omniscient'} perspective.` : '';

  const prompt = `Write romantic content for the following section:

Section Title: ${sectionTitle}
Section Description: ${sectionDescription}

Heat Level: ${heatLevel}
Heat Level Guidelines: ${heatLevelInstructions[heatLevel as keyof typeof heatLevelInstructions] || heatLevelInstructions.clean}
${perspectiveNote}

Requirements:
- Write 4-6 paragraphs of romantic content appropriate for the specified heat level
- Make it suitable for romance eBook format
- Use engaging, emotional, and evocative prose
- Follow the heat level guidelines precisely
- Create compelling character interactions and romantic tension
- Include sensory details and emotional depth
- Do not include markdown formatting or section headers

Please write the romantic content now:`;

  try {
    const response = await callClaudeCodeCLI(prompt, { isCancelledFn });
    return response;
  } catch (error) {
    console.error('Error generating heat level content with Claude Code:', error);
    throw error;
  }
};

// Enhanced research with multiple angles
export const researchAndAnalyze = async (
  topic: string,
  description: string,
  researchAngles: string[] = [],
  isCancelledFn?: () => boolean
): Promise<string> => {
  const anglesText = researchAngles.length > 0 
    ? `\nSpecific research angles to explore: ${researchAngles.join(', ')}`
    : '';

  const prompt = `Conduct comprehensive research and analysis on: ${topic}

Context: ${description}${anglesText}

Please provide an in-depth analysis covering:

1. **Current State & Facts**: What are the key facts, current status, and established knowledge?

2. **Recent Developments**: What are the latest trends, changes, or developments in this area?

3. **Multiple Perspectives**: What are different viewpoints, expert opinions, or schools of thought?

4. **Evidence & Data**: What statistics, studies, or evidence support different positions?

5. **Practical Applications**: How is this knowledge applied in real-world situations?

6. **Future Implications**: What are the potential future developments or consequences?

7. **Critical Analysis**: What are the strengths, limitations, or gaps in current understanding?

Provide well-researched, balanced, and insightful analysis that would be valuable for creating authoritative content on this topic.

Research and analysis:`;

  try {
    const response = await callClaudeCodeCLI(prompt, { isCancelledFn });
    return response;
  } catch (error) {
    console.error('Error conducting research and analysis with Claude Code:', error);
    throw error;
  }
};

// Fallback functions for when AI parsing fails
const createFallbackOutline = (title: string, description: string): any[] => {
  const { v4: uuidv4 } = require('uuid');
  
  return [
    {
      id: uuidv4(),
      title: "Introduction and Foundation",
      description: "Setting the stage, introducing key concepts and establishing the foundation for the book's main themes.",
      status: "pending"
    },
    {
      id: uuidv4(),
      title: "Core Concepts and Principles",
      description: "Exploring the fundamental ideas, principles, and theories that form the backbone of this topic.",
      status: "pending"
    },
    {
      id: uuidv4(),
      title: "Practical Applications",
      description: "Real-world examples, case studies, and practical applications of the concepts discussed.",
      status: "pending"
    },
    {
      id: uuidv4(),
      title: "Advanced Topics and Considerations",
      description: "Diving deeper into complex aspects, advanced techniques, and important considerations.",
      status: "pending"
    },
    {
      id: uuidv4(),
      title: "Future Implications and Conclusions",
      description: "Looking ahead at future developments, summarizing key insights, and drawing final conclusions.",
      status: "pending"
    }
  ];
};

const createFallbackSubChapters = (chapterTitle: string): any[] => {
  const { v4: uuidv4 } = require('uuid');
  
  return [
    {
      id: uuidv4(),
      title: `${chapterTitle}: Opening Concepts`,
      description: `Introduction to the key ideas and concepts in ${chapterTitle}`,
      status: "pending"
    },
    {
      id: uuidv4(),
      title: `${chapterTitle}: Development and Analysis`,
      description: `Detailed exploration and analysis of the main themes in ${chapterTitle}`,
      status: "pending"
    },
    {
      id: uuidv4(),
      title: `${chapterTitle}: Practical Examples`,
      description: `Real-world applications and examples related to ${chapterTitle}`,
      status: "pending"
    },
    {
      id: uuidv4(),
      title: `${chapterTitle}: Synthesis and Integration`,
      description: `Bringing together the key points and insights from ${chapterTitle}`,
      status: "pending"
    }
  ];
};