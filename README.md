# 📚 Unstack - AI-Powered eBook Generator

> Transform your ideas into complete books with the power of AI

Unstack is a comprehensive AI-powered platform that helps you create, edit, and publish complete books from simple prompts. Whether you're writing fiction, non-fiction, or specialized content, Unstack streamlines the entire book creation process with intelligent automation and professional-grade features.

## ✨ Features

### 🤖 AI-Powered Content Generation
- **Smart Book Outlines**: Generate comprehensive chapter structures from simple prompts
- **Intelligent Content Creation**: AI writes detailed chapters and sub-chapters
- **Research Integration**: Automatic topic research using Perplexity AI
- **Multiple AI Models**: Powered by Google Gemini for high-quality content generation

### 👤 Writing Personas System
- **Custom Author Profiles**: Create and manage multiple writing personas
- **AI Style Analysis**: Upload writing samples for automatic style extraction
- **Consistent Voice**: Maintain specific writing styles across all content
- **Export/Import**: Share personas between accounts or backup your collection
- **Genre Specialization**: Personas optimized for specific genres and audiences

### 📖 Advanced Book Management
- **Multi-Genre Support**: Romance, Fantasy, Sci-Fi, Mystery, Non-Fiction, and more
- **Heat Level Control**: Customizable content intensity for romance novels
- **Perspective Options**: First person, third person limited/omniscient, second person
- **Target Audience**: Tailor content for specific demographics
- **Progress Tracking**: Monitor generation status across chapters

### 🎧 Audiobook Generation
- **Text-to-Speech**: Convert your books into professional audiobooks
- **Voice Selection**: Choose from multiple AI voices with gender and language options
- **Smart Voice Matching**: AI recommends optimal voices based on book content
- **Chapter-by-Chapter**: Generate audio for individual chapters or entire books
- **Export Ready**: Download complete audiobook packages with playlists

### 📄 Professional Export Options
- **PDF Export**: Clean, formatted PDF books ready for printing
- **EPUB Generation**: Industry-standard eBook format for digital publishing
- **Audiobook Packages**: Complete audio files with metadata and playlists
- **Multiple Formats**: Choose the best format for your distribution needs

### 🎨 Cover Generation
- **AI Cover Art**: Generate professional book covers using DALL-E
- **Genre-Specific**: Covers tailored to your book's genre and style
- **Custom Prompts**: Detailed prompts based on book content and metadata
- **High Resolution**: Print-ready cover images

### 🔐 User Management & Security
- **Supabase Authentication**: Secure user accounts with email/password
- **Personal Libraries**: Each user's books and personas are private
- **Cloud Storage**: All content safely stored in the cloud
- **Real-time Sync**: Access your work from any device

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- API Keys for:
  - Google Gemini (for content generation)
  - Perplexity AI (for research, optional)
  - OpenAI (for cover generation, optional)
- Supabase account (for database and authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Unstack.git
   cd Unstack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   Run the SQL migrations in your Supabase dashboard:
   - `supabase/migrations/20250726000001_initial_schema.sql`
   - `supabase/migrations/20250726000002_add_writing_personas.sql`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open in Browser**
   Navigate to `http://localhost:5173`

### First Time Setup

1. **Create Account**: Sign up with email and password
2. **Add API Keys**: Go to Settings and add your AI service API keys
3. **Create Your First Book**: Use the book prompt interface to generate your first outline
4. **Explore Personas**: Create writing personas to maintain consistent styles

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Lucide React** for beautiful icons

### Backend & Services
- **Supabase** for database, authentication, and real-time features
- **Google Gemini API** for AI content generation
- **Perplexity AI** for research and fact-checking
- **OpenAI DALL-E** for cover image generation

### Libraries & Tools
- **jsPDF** for PDF generation
- **JSZip** for EPUB and audiobook packaging
- **Web Speech API** for text-to-speech
- **UUID** for unique identifiers
- **File-saver** for download functionality

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── AudioUnstackerator.tsx
│   ├── BookEditor.tsx
│   ├── BookPrompt.tsx
│   ├── BookSidebar.tsx
│   ├── ChapterView.tsx
│   ├── OutlineView.tsx
│   ├── PersonaManagement.tsx
│   └── UserSettings.tsx
├── services/            # API and business logic
│   ├── bookService.ts
│   ├── contentService.ts
│   ├── coverService.ts
│   ├── exportService.ts
│   ├── geminiService.ts
│   ├── personaService.ts
│   ├── perplexityService.ts
│   ├── ttsService.ts
│   └── userService.ts
├── types/               # TypeScript type definitions
├── lib/                 # Configuration and utilities
└── App.tsx             # Main application component
```

## 🎯 Usage Guide

### Creating Your First Book

1. **Start with a Prompt**
   - Enter a book idea or detailed description
   - Select genre, sub-genre, and target audience
   - Choose writing perspective and tone
   - For romance: Set appropriate heat level

2. **Review the Outline**
   - AI generates a complete chapter structure
   - Edit chapter titles and descriptions as needed
   - Add or remove chapters to fit your vision

3. **Generate Content**
   - Click "Generate All Content" for full automation
   - Or generate chapters individually for more control
   - Monitor progress with real-time updates

4. **Edit and Refine**
   - Use the built-in editor to polish content
   - Adjust tone, style, and pacing
   - Add personal touches and unique elements

5. **Export Your Book**
   - Choose from PDF, EPUB, or audiobook formats
   - Generate professional covers
   - Download ready-to-publish files

### Working with Writing Personas

1. **Create Personas**
   - Manual creation with detailed style attributes
   - AI analysis of existing writing samples
   - Define genre specialties and characteristics

2. **Apply to Books**
   - Select personas during book creation
   - Maintain consistent voice across chapters
   - Switch personas for different projects

3. **Manage Collection**
   - Search and filter personas
   - Mark favorites for quick access
   - Export/import for sharing or backup

### Generating Audiobooks

1. **Select Voice**
   - AI recommends optimal voices based on content
   - Preview voices with sample text
   - Choose from male, female, or neutral options

2. **Generate Audio**
   - Process entire book or individual chapters
   - Monitor progress with real-time updates
   - Preview audio before finalizing

3. **Export Package**
   - Download complete audiobook with metadata
   - Includes playlist files for media players
   - Professional packaging for distribution

## 🔧 Configuration

### API Keys Setup

Add your API keys in the user settings:

- **Google Gemini**: Required for content generation
- **Perplexity AI**: Optional, for enhanced research
- **OpenAI**: Optional, for cover generation

### Supabase Configuration

Ensure your Supabase project has:
- Row Level Security (RLS) enabled
- Proper authentication policies
- Database migrations applied

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Use Prettier for code formatting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our [Wiki](https://github.com/your-username/Unstack/wiki)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/your-username/Unstack/issues)
- **Discussions**: Join our [GitHub Discussions](https://github.com/your-username/Unstack/discussions)

## 🗺️ Roadmap

### Upcoming Features
- [ ] Collaborative editing
- [ ] Advanced style templates
- [ ] Multi-language support
- [ ] Publishing platform integrations
- [ ] Advanced analytics and insights
- [ ] Mobile app development

### Recent Updates
- ✅ Writing personas system
- ✅ Export/import functionality
- ✅ Audiobook generation
- ✅ Professional PDF/EPUB export
- ✅ AI cover generation

## 🙏 Acknowledgments

- Google Gemini for powerful AI content generation
- Supabase for excellent backend infrastructure
- The open-source community for amazing tools and libraries
- All contributors and users who make this project possible

---
