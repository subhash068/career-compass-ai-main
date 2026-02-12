# Career Compass AI Documentation

## Objectives
- Provide AI-powered career guidance and skill analysis platform
- Enable users to assess their skills and receive personalized recommendations
- Generate customized learning paths to bridge skill gaps
- Offer interactive chatbot for career advice and queries
- Provide career matching based on user profiles and skills
- Include admin dashboard for platform management and user oversight

## Technology Stack
- **Backend**: FastAPI, SQLAlchemy, Pydantic, JWT authentication, bcrypt password hashing
- **Frontend**: React, TypeScript, Vite, shadcn-ui components, Tailwind CSS, React Query, React Router
- **Database**: SQLite with SQLAlchemy ORM
- **Deployment**: Docker, nginx, prometheus monitoring
- **Development**: ESLint, Vitest, TypeScript

## System Architecture
- **Frontend Layer**: React application handling user interface, state management, and API communication
- **Backend Layer**: FastAPI application providing REST API endpoints, business logic via services
- **Data Layer**: SQLAlchemy models interacting with SQLite database
- **Authentication**: JWT-based token authentication with refresh tokens
- **Services Layer**: Modular services for skills analysis, career recommendations, learning paths, and chatbot functionality
- **Middleware**: CORS support for cross-origin requests, dependency injection for database sessions

## Term Explanations
- **Skills**: User's competencies and proficiencies in various areas
- **Learning Paths**: Structured, step-by-step guides to acquire new skills or improve existing ones
- **Career Matches**: Recommended job roles and positions based on user's skill profile
- **Skill Assessment**: Evaluation process to determine user's current skill levels
- **Gap Analysis**: Identification of differences between required and current skill levels
- **Chatbot**: AI-powered conversational interface for career guidance and queries

## REST Methods

### Authentication Endpoints
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate user and return tokens
- `GET /auth/profile` - Get current user profile
- `POST /auth/refresh` - Refresh access token

### Skills Endpoints
- `POST /skills/submit` - Submit skill assessment data
- `GET /skills/analyze` - Analyze user's skills

### Career Endpoints
- `GET /career/recommend` - Get career recommendations based on skills

### Learning Endpoints
- `POST /learning/path` - Generate learning path for target role
- `GET /learning/path` - Retrieve learning path
- `PUT /learning/path/step/{step_id}` - Update step progress in learning path

### Chatbot Endpoints
- `POST /chatbot/query` - Process chatbot query

### Admin Endpoints
- Admin-specific endpoints for platform management

### Status Endpoints
- `GET /status` - Check service status and database connection
