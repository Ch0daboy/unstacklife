# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookGen is a React/TypeScript web application that generates AI-powered books and audiobooks. It uses Supabase for authentication and data storage, with AI services from Amazon Bedrock (Claude 3.5 Haiku for text, Titan Image Generator v2 for images) and Perplexity for research. The app supports multi-step book creation (prompt → outline → chapter writing → editing) and audiobook generation with TTS.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production 
- `npm run lint` - Run ESLint on all TypeScript/React files
- `npm run preview` - Preview production build locally

### Environment Setup
Create a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key_id
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key
```

## Architecture Overview

### Core Application Flow
The app follows a multi-step workflow managed by `App.tsx`:
1. **prompt** - User inputs book requirements (BookPrompt component)
2. **outline** - Generated book outline review (OutlineView component)  
3. **chapter** - Individual chapter content generation (ChapterView component)
4. **edit** - Full book editing interface (BookEditor component)

### Directory Structure
```
src/
├── components/         # React components (11 files)
│   ├── AuthWrapper.tsx     # Supabase authentication wrapper
│   ├── BookPrompt.tsx      # Initial book generation form
│   ├── OutlineView.tsx     # Book outline display/editing
│   ├── ChapterView.tsx     # Chapter content generation
│   ├── BookEditor.tsx      # Full book editing interface
│   ├── BookSidebar.tsx     # Navigation sidebar
│   ├── AudiobookGenerator.tsx # TTS audiobook generation
│   └── [others]
├── services/          # Business logic services (9 files)
│   ├── bookService.ts      # Supabase book CRUD operations
│   ├── contentService.ts   # AI content generation logic
│   ├── bedrockService.ts    # Amazon Bedrock API integration
│   ├── perplexityService.ts # Perplexity API integration
│   ├── ttsService.ts       # Text-to-speech audiobook generation
│   ├── exportService.ts    # PDF/ZIP export functionality
│   └── [others]
├── lib/               # Core utilities
│   ├── supabase.ts         # Supabase client configuration
│   ├── auth.ts             # Authentication utilities
│   └── database.ts         # Database schema types
├── types/             # TypeScript type definitions
│   └── index.ts            # Book, Chapter, AudiobookData interfaces
└── App.tsx            # Main application with step management
```

### Data Models
Core types defined in `src/types/index.ts`:
- **Book** - Main book entity with chapters, metadata, and status
- **BookChapter** - Individual chapters with subchapters 
- **SubChapter** - Nested content sections within chapters
- **AudiobookData** - TTS-generated audiobook with voice settings
- **AudioChapter** - Individual audio files per chapter

### State Management
- No external state management library used
- State managed through React hooks in main App component
- Book data persisted to Supabase automatically via `bookService.ts`
- Real-time updates handled through Supabase subscriptions

### Authentication
- Supabase Auth with OAuth providers supported
- AuthWrapper component handles authentication state
- User session management with auto-refresh tokens
- Protected routes require authenticated users

### AI Integration
- **Gemini API** - Primary content generation service
- **Perplexity API** - Research and fact-checking
- **Web Speech API** - Browser-native TTS for audiobooks
- Content generation supports multiple genres, tones, perspectives

## Key Implementation Details

### Service Layer Pattern
Services encapsulate business logic and external API calls:
- Each service handles one domain (books, content, TTS, etc.)
- Services return typed data matching TypeScript interfaces  
- Error handling with user-friendly messages
- API keys loaded from environment variables

### Component Architecture
- Functional components with TypeScript interfaces for props
- Lucide React for consistent iconography
- Tailwind CSS for styling with responsive design
- Components handle their own loading/error states

### Database Integration
- Supabase PostgreSQL with typed client
- Row Level Security (RLS) for user data isolation
- Real-time subscriptions for collaborative features
- Migration files in `supabase/migrations/`

### Development Guidelines
- TypeScript strict mode enabled
- ESLint configured for React hooks and TypeScript
- No testing framework currently configured
- Vite for fast development and optimized builds
- Tailwind CSS for consistent styling patterns