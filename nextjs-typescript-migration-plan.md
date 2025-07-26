# Next.js TypeScript Migration Plan

## Overview

This document outlines a comprehensive plan to migrate the current Speech-to-Code application from a separated React (JavaScript) frontend and FastAPI (Python) backend architecture to a unified Next.js application with TypeScript and API routes.

## Current Architecture Analysis

### Frontend (React + JavaScript)
- **Framework**: Create React App with React 18.3.1
- **Language**: JavaScript (no TypeScript)
- **Styling**: Material-UI + Tailwind CSS (redundant styling solutions)
- **State Management**: React hooks and context
- **Testing**: Minimal (only one test file)
- **Build Tool**: react-scripts

### Backend (FastAPI + Python)
- **Framework**: FastAPI 0.115.12
- **Language**: Python
- **AI Integration**: OpenAI, Anthropic, Google Generative AI
- **Testing**: None
- **Server**: Uvicorn ASGI

## Migration Strategy

The migration will be executed in 6 major phases to minimize risk and ensure continuity:

### Phase 1: TypeScript Setup & JavaScript Migration
### Phase 2: Next.js Application Setup
### Phase 3: API Routes Migration
### Phase 4: Component Migration & Optimization
### Phase 5: Testing Infrastructure
### Phase 6: Deployment & Cleanup

---

## Phase 1: TypeScript Setup & JavaScript Migration

### Goals
- Set up TypeScript configuration
- Convert all JavaScript files to TypeScript
- Establish type definitions for the project

### Tasks
- [ ] Install TypeScript and type definitions in frontend
  ```bash
  npm install --save-dev typescript @types/react @types/react-dom @types/node
  ```
- [ ] Create `tsconfig.json` with strict configuration
- [ ] Convert JavaScript files to TypeScript systematically:
  - [ ] Start with utility files and constants
  - [ ] Convert services layer (API calls)
  - [ ] Convert custom hooks
  - [ ] Convert React components (leaf components first)
  - [ ] Convert App.js and index.js last
- [ ] Create type definitions for:
  - [ ] API response types
  - [ ] Component props
  - [ ] State management types
  - [ ] Event handlers
- [ ] Fix all TypeScript compilation errors
- [ ] Update import statements to use proper extensions

### Estimated Time: 2-3 days

---

## Phase 2: Next.js Application Setup

### Goals
- Create a new Next.js application with TypeScript
- Set up proper project structure
- Configure Next.js for the migration

### Tasks
- [ ] Create new Next.js app with TypeScript template
  ```bash
  npx create-next-app@latest speech-to-code-next --typescript --tailwind --app
  ```
- [ ] Set up project structure:
  ```
  speech-to-code-next/
  ├── app/
  │   ├── api/          # API routes (Python backend migration)
  │   ├── components/   # React components
  │   ├── hooks/        # Custom hooks
  │   ├── lib/          # Utilities and helpers
  │   ├── types/        # TypeScript type definitions
  │   └── layout.tsx    # Root layout
  ├── public/           # Static assets
  └── tests/            # Test files
  ```
- [ ] Configure Next.js:
  - [ ] Set up environment variables
  - [ ] Configure path aliases in `tsconfig.json`
  - [ ] Set up Tailwind CSS (already included)
  - [ ] Configure ESLint and Prettier
- [ ] Install necessary dependencies:
  - [ ] Radix UI components
  - [ ] React Beautiful DnD
  - [ ] React Markdown
  - [ ] Syntax highlighter
  - [ ] Remove Material-UI (use Tailwind exclusively)

### Estimated Time: 1 day

---

## Phase 3: API Routes Migration

### Goals
- Convert Python FastAPI endpoints to Next.js API routes
- Maintain AI service integrations
- Ensure API compatibility

### Tasks
- [ ] Analyze all FastAPI endpoints and their functionality
- [ ] Create TypeScript implementations of Python utilities:
  - [ ] LLM interaction logic
  - [ ] Model configuration
  - [ ] System prompts handling
- [ ] Implement API routes in Next.js:
  - [ ] `/api/speech-to-text` - Audio processing
  - [ ] `/api/llm-interaction` - AI model communication
  - [ ] `/api/model-config` - Model configuration
  - [ ] `/api/health` - Health check endpoint
- [ ] Set up AI service integrations:
  - [ ] OpenAI SDK for Node.js
  - [ ] Anthropic SDK
  - [ ] Google Generative AI
- [ ] Implement error handling and validation
- [ ] Create API route middleware for:
  - [ ] Authentication (if needed)
  - [ ] Rate limiting
  - [ ] Error handling
  - [ ] CORS configuration
- [ ] Test all API routes thoroughly

### Challenges
- Python-specific libraries may need Node.js alternatives
- File handling and audio processing differences
- Maintaining API response compatibility

### Estimated Time: 3-4 days

---

## Phase 4: Component Migration & Optimization

### Goals
- Migrate all React components to Next.js
- Optimize for Next.js features
- Improve component architecture

### Tasks
- [ ] Migrate components in order of dependency:
  1. [ ] UI components (button, card, tooltip, etc.)
  2. [ ] Utility components (LoadingSpinner, ErrorBoundary)
  3. [ ] Feature components (AudioRecorder, CodeDisplay, etc.)
  4. [ ] Page components (LLMInteraction, Settings)
  5. [ ] Root App component to Next.js app structure
- [ ] Implement Next.js optimizations:
  - [ ] Use Next.js Image component
  - [ ] Implement proper loading states
  - [ ] Add error boundaries
  - [ ] Optimize client/server components
- [ ] Refactor state management:
  - [ ] Use React Server Components where possible
  - [ ] Implement proper data fetching patterns
  - [ ] Consider Zustand or Redux Toolkit if needed
- [ ] Update routing to use Next.js App Router
- [ ] Implement proper SEO with metadata
- [ ] Remove Material-UI components and replace with Tailwind

### Estimated Time: 2-3 days

---

## Phase 5: Testing Infrastructure

### Goals
- Set up Vitest for unit and integration testing
- Achieve good test coverage
- Implement E2E testing

### Tasks
- [ ] Install and configure Vitest:
  ```bash
  npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom
  ```
- [ ] Create Vitest configuration
- [ ] Set up testing utilities and helpers
- [ ] Write unit tests for:
  - [ ] Utility functions
  - [ ] Custom hooks
  - [ ] API routes
  - [ ] React components
- [ ] Write integration tests for:
  - [ ] API route workflows
  - [ ] Component interactions
  - [ ] State management flows
- [ ] Set up E2E testing with Playwright:
  - [ ] Install Playwright
  - [ ] Write critical user journey tests
  - [ ] Test audio recording functionality
  - [ ] Test AI interactions
- [ ] Configure CI/CD pipeline for automated testing
- [ ] Aim for >80% code coverage

### Estimated Time: 2-3 days

---

## Phase 6: Deployment & Cleanup

### Goals
- Deploy the new Next.js application
- Migrate data and configurations
- Clean up old code

### Tasks
- [ ] Set up deployment configuration:
  - [ ] Vercel deployment (recommended for Next.js)
  - [ ] Environment variables
  - [ ] Build optimization
- [ ] Migration checklist:
  - [ ] Ensure all features work correctly
  - [ ] Verify API compatibility
  - [ ] Test audio processing
  - [ ] Validate AI integrations
- [ ] Performance optimization:
  - [ ] Bundle size analysis
  - [ ] Lighthouse audits
  - [ ] Load time optimization
- [ ] Update documentation:
  - [ ] README.md
  - [ ] API documentation
  - [ ] Deployment guide
  - [ ] Development setup guide
- [ ] Clean up:
  - [ ] Remove old frontend directory
  - [ ] Remove old backend directory
  - [ ] Update root configuration files
  - [ ] Archive Python code for reference

### Estimated Time: 1-2 days

---

## Benefits of Migration

1. **Unified Codebase**: Single repository and language (TypeScript)
2. **Improved DX**: Better tooling, type safety, and IDE support
3. **Performance**: Next.js optimizations (SSR, ISR, image optimization)
4. **Simplified Deployment**: Single application to deploy
5. **Better Testing**: Vitest provides fast, modern testing
6. **Type Safety**: Catch errors at compile time
7. **Modern Architecture**: Latest React features and patterns

## Potential Challenges

1. **Python to TypeScript Migration**: Some Python libraries may not have direct Node.js equivalents
2. **Audio Processing**: Handling audio in Node.js vs Python
3. **API Compatibility**: Ensuring backward compatibility if needed
4. **Learning Curve**: Team needs to be comfortable with TypeScript and Next.js
5. **Testing Migration**: Rewriting all tests in Vitest

## Success Metrics

- All features working correctly in Next.js
- >80% test coverage
- Improved performance metrics
- Simplified deployment process
- Reduced bundle size
- Better developer experience

## Timeline Summary

- **Phase 1**: 2-3 days (TypeScript migration)
- **Phase 2**: 1 day (Next.js setup)
- **Phase 3**: 3-4 days (API routes)
- **Phase 4**: 2-3 days (Component migration)
- **Phase 5**: 2-3 days (Testing)
- **Phase 6**: 1-2 days (Deployment)

**Total Estimated Time**: 11-17 days (2-3 weeks)

## Next Steps

1. Review and approve this migration plan
2. Set up a new branch for the migration
3. Begin with Phase 1: TypeScript setup
4. Regular check-ins and progress updates
5. Incremental testing and validation

---

*This plan is designed to be iterative and flexible. Adjust timelines and approaches based on discoveries during implementation.*