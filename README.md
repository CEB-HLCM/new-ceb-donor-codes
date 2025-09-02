# CEB Donor Codes React Application

A modern React TypeScript application for managing donor entity codes for UN organizations with enhanced search, code generation, and validation functionality.

## 🎯 Project Overview

This is a complete rebuild of the existing CEB Donor Codes application using modern React, TypeScript, and Vite. The application provides an intuitive interface for searching existing donor codes and submitting requests for new, updated, or removed donor codes to the CEB FS team.

**Live Demo**: [Original App](https://ceb-donor-codes.netlify.app/)

## ✅ Current Implementation Status

### Completed Phases (Phases 1-5)

- ✅ **Phase 1**: Styling & Branding Setup - Visual parity with original app
- ✅ **Phase 2**: Dynamic Data Loading Service - Real-time CSV fetching from GitHub
- ✅ **Phase 3**: Enhanced Search Functionality - Multiple search algorithms with professional UX
- ✅ **Phase 4**: Donor Request Form & Code Generation - Intelligent code generation with validation
- ✅ **Phase 4B**: Update/Remove Request Forms - Complete donor lifecycle management
- ✅ **Phase 5**: Request Basket & Management - Drag-and-drop, validation, and submission history

### 🚀 Next Phase: Phase 6 - Enhanced EmailJS Integration & Notifications

## 🛠️ Technology Stack

- **Frontend**: React 19+ with TypeScript
- **Build Tool**: Vite (fast, modern build system)
- **UI Framework**: Material-UI (MUI) v7
- **Form Management**: React Hook Form with Zod validation
- **Search**: Fuse.js for fuzzy search + custom algorithms
- **Routing**: React Router DOM v7
- **Drag & Drop**: @dnd-kit for modern drag-and-drop functionality
- **Email Service**: EmailJS for submission workflow
- **Utilities**: Lodash, UUID, Soundex

## 🔍 Key Features

### Enhanced Search Capabilities
- **Multiple Search Types**: Exact, partial, fuzzy, and Soundex "sounds like" matching
- **Professional UX**: Dual approach with browse (DonorsListPage) and advanced search (SearchPage)
- **Performance**: Sub-50ms search response with debouncing
- **Advanced Filtering**: By contributor types and government/non-government status

### Intelligent Code Generation
- **4 Generation Algorithms**: Initials, abbreviations, hybrid, and fallback methods
- **Real-time Validation**: Against 3,527+ existing donor codes
- **Smart Suggestions**: Multiple code options with confidence scoring
- **Professional Wizard**: 4-step process with validation at each stage

### Complete Request Management
- **New Donor Requests**: Full workflow with intelligent code generation
- **Update Requests**: Modify existing donor information with change tracking
- **Remove Requests**: Proper removal workflow with justification requirements
- **Form Persistence**: Manual save/load functionality for draft requests

### Enhanced Basket Management (Phase 5)
- **Drag-and-Drop Reordering**: Modern @dnd-kit implementation for request prioritization
- **Advanced Validation Engine**: 100-point scoring system with detailed error/warning feedback
- **Multi-step Submission Flow**: Prepare → Validate → Submit workflow preventing invalid submissions
- **Request History Tracking**: 30-day submission history with restore capabilities
- **Bulk Operations**: Select multiple requests for batch actions and submission
- **Smart Persistence**: Local storage with automatic expiry and data management

## 📊 Data Sources

The application directly fetches data from the CEB public repository using simple HTTP requests:

- **Donors**: https://raw.githubusercontent.com/CEB-HLCM/FS-Public-Codes/refs/heads/main/DONORS.csv
- **Contributor Types**: https://raw.githubusercontent.com/CEB-HLCM/FS-Public-Codes/refs/heads/main/CONTRIBUTOR_TYPES.csv

**No CORS proxy required** - GitHub raw URLs work directly in all environments including local development and production deployments. Data is loaded fresh on each session to ensure up-to-date information.

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── basket/          # Request basket functionality
│   ├── form/            # Form-related components
│   ├── layout/          # Header, sidebar, layout components
│   └── search/          # Search and filtering components
├── context/             # React context providers
├── hooks/               # Custom React hooks
├── pages/               # Main page components
├── schemas/             # Zod validation schemas
├── services/            # Business logic and API services
├── types/               # TypeScript type definitions
├── utils/               # Utility functions and helpers
└── theme/               # Material-UI theme configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd new-ceb-donor-codes
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### EmailJS Integration
The application uses EmailJS for submitting requests to the CEB team. Configuration uses secure environment variables in `.env.local`:

```env
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_PRIVATE_KEY=your_private_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
```

**Security Note**: Create a `.env.local` file in the project root with your EmailJS credentials. This file is automatically excluded from git commits for security.

## 📋 Development Roadmap

### Upcoming Phases:
- **Phase 6**: Enhanced EmailJS Integration with bulk notifications
- **Phase 7**: State Management & Performance Optimization
- **Phase 8**: Testing & Quality Assurance
- **Phase 9**: Deployment & Production Setup
- **Phase 10**: Advanced Features & Enhancements

See `DEVELOPMENT_ROADMAP.md` for detailed implementation plans.

## 🎨 Design System

The application maintains visual consistency with the original CEB Donor Codes app:
- **Primary Blue**: #008fd5
- **Table Headers**: #96C8DA
- **Material-UI Theme**: Custom theme matching original branding
- **Responsive Design**: Mobile-first approach with breakpoint optimization

## 🧪 Code Quality

- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code quality and consistency enforcement
- **Zero Console Errors**: Clean development environment
- **Material-UI Best Practices**: Proper theming and component usage
- **React Hook Form**: Controlled component patterns with validation

## 📝 Critical Development Notes

1. **TypeScript verbatimModuleSyntax**: Use `import type` for interfaces and `import` for values
2. **HTML Nesting Prevention**: Follow Material-UI component hierarchy guidelines
3. **Performance**: Debounced search, optimized rendering, efficient data structures
4. **Data Integrity**: Direct GitHub CSV fetching, fresh data loading, no persistent caching
5. **Form Stability**: Manual save/load system, no auto-save infinite loops
6. **Simplified Architecture**: No proxy configurations or complex CORS workarounds needed

## 🤝 Contributing

This project follows strict development standards:
- All components must be TypeScript-typed
- Zero tolerance for console errors/warnings
- Material-UI design system compliance
- Comprehensive error handling
- Professional UX patterns

## 📄 License

This project is developed for the UN CEB (United Nations System Chief Executives Board) for internal use in managing donor codes across UN organizations.

## 🔗 Related Documentation

- `DEVELOPMENT_ROADMAP.md` - Complete development phases and tasks
- `DEVELOPMENT_STATUS.md` - Detailed implementation status and achievements
- `PROJECT_SPECIFICATIONS.md` - Technical requirements and architecture
- `HTML_NESTING_PREVENTION_GUIDE.md` - HTML structure best practices

---

**Status**: ✅ Production-ready for Phases 1-5 | 🚧 Phase 6 in development
**Last Updated**: January 2025