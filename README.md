# BookGen - AI-Powered Book & Audiobook Creator

BookGen is a sophisticated React/TypeScript web application that generates comprehensive books and audiobooks using advanced AI technology. Create professional-quality content from simple prompts with multi-step generation workflows and intelligent research capabilities.

![BookGen Interface](./public/generated-image.png)

## 🚀 Features

### Content Generation
- **Multi-Step Workflow**: Prompt → Outline → Chapter Writing → Full Editing
- **AI-Powered Research**: Integration with Perplexity API for fact-checked, well-researched content
- **Dual Generation Modes**: Quick generation or research-enhanced content creation
- **Smart Content Organization**: Automatic chapter and sub-chapter structuring

### User Experience
- **Progress Control**: Stop and resume content generation at any point
- **Real-Time Progress**: Live updates and status tracking during generation
- **Persistent Storage**: All work automatically saved to Supabase
- **Responsive Design**: Optimized for desktop and mobile devices

### Export & Publishing
- **Multiple Formats**: Export to PDF and EPUB
- **Audiobook Creation**: Text-to-speech audiobook generation with voice customization
- **Cover Art Generation**: AI-generated book covers using Gemini Imagen or DALL-E
- **Professional Formatting**: Publication-ready output

### Genre Specialization
- **Romance Heat Levels**: Specialized romance writing with adjustable heat levels (Clean to Explicit)
- **Multiple Perspectives**: First person, third person limited/omniscient, second person
- **Tone Customization**: Adjust writing tone to match genre and audience
- **Cross-Version Creation**: Generate multiple versions with different heat levels

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for modern, responsive styling
- **Lucide React** for consistent iconography

### Backend & Services
- **Supabase** - Authentication, database, and real-time features
- **Google Gemini API** - Primary content generation and image creation
- **Perplexity API** - Research and fact-checking
- **Web Speech API** - Browser-native text-to-speech

### Architecture
- Component-based architecture with TypeScript interfaces
- Service layer pattern for business logic encapsulation
- Real-time state management with React hooks
- Automatic data persistence and synchronization

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key
- Perplexity API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bookgen.git
   cd bookgen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_PERPLEXITY_API_KEY=your_perplexity_api_key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the migration files from `supabase/migrations/`
   - Enable Row Level Security (RLS) for user data isolation

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

### Creating Your First Book

1. **Start with a Prompt**
   - Enter your book concept, genre, and requirements
   - Specify target audience, tone, and perspective
   - For romance: Select appropriate heat level

2. **Review the Outline**
   - AI generates a comprehensive chapter structure
   - Modify chapters and descriptions as needed
   - Use bulk generation or individual chapter creation

3. **Generate Content**
   - Choose between quick generation or research-enhanced writing
   - Monitor real-time progress with stop/resume controls
   - Content automatically saves as it's generated

4. **Edit and Refine**
   - Use the built-in editor for final touches
   - Make adjustments to tone, style, or content
   - Generate alternative versions if needed

5. **Publish and Share**
   - Export to PDF or EPUB formats
   - Create audiobook versions with customizable voices
   - Generate professional cover art

### Advanced Features

#### Content Generation Control
- **Stop/Resume**: Pause generation at any time, make adjustments, then continue
- **Progress Tracking**: Visual progress bars and status indicators
- **Batch Operations**: Generate all chapters or individual sections

#### Romance Writing Tools
- **Heat Level Conversion**: Transform existing content to different heat levels
- **Perspective Options**: Switch between first/third person narratives
- **Tone Adaptation**: Adjust writing style for different audiences

#### Export Options
- **PDF Export**: Professional formatting with cover art
- **EPUB Creation**: eBook format compatible with all readers  
- **Audiobook Generation**: Multiple voice options and speed controls
- **Cover Art**: AI-generated covers matching your book's theme

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AuthWrapper.tsx     # Supabase authentication
│   ├── BookPrompt.tsx      # Initial book creation form
│   ├── OutlineView.tsx     # Book outline management
│   ├── ChapterView.tsx     # Individual chapter editing
│   ├── BookEditor.tsx      # Full book editing interface
│   ├── BookSidebar.tsx     # Navigation and book management
│   └── AudiobookGenerator.tsx # TTS audiobook creation
├── services/            # Business logic services
│   ├── bookService.ts      # Supabase CRUD operations
│   ├── contentService.ts   # AI content generation logic
│   ├── geminiService.ts    # Google Gemini API integration
│   ├── perplexityService.ts # Perplexity API research
│   ├── ttsService.ts       # Text-to-speech generation
│   ├── exportService.ts    # PDF/EPUB export functionality
│   └── coverService.ts     # AI cover art generation
├── lib/                 # Core utilities
│   ├── supabase.ts         # Supabase client setup
│   ├── auth.ts             # Authentication utilities
│   └── database.ts         # Database types and schemas
├── types/               # TypeScript definitions
│   └── index.ts            # Core data models
└── App.tsx              # Main application component
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Yes |
| `VITE_PERPLEXITY_API_KEY` | Perplexity API key | Yes |

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

### Key Development Features

- **Hot Module Replacement**: Instant updates during development
- **TypeScript Integration**: Full type safety and IntelliSense
- **ESLint Configuration**: Consistent code style enforcement
- **Responsive Design**: Mobile-first Tailwind CSS approach

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Configure environment variables on your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode requirements
- Use functional components with hooks
- Maintain consistent code formatting with ESLint
- Test functionality across different browsers
- Document new features and API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** - Advanced AI content generation
- **Perplexity** - Intelligent research and fact-checking
- **Supabase** - Backend-as-a-service platform
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Beautiful & consistent icon library

## 📞 Support

For support, questions, or feature requests:
- Open an issue on [GitHub Issues](https://github.com/yourusername/bookgen/issues)
- Check the [Documentation](https://github.com/yourusername/bookgen/wiki)
- Join our [Discord Community](https://discord.gg/bookgen)

---

**BookGen** - Transform your ideas into professional books and audiobooks with the power of AI. ✨📚🎧