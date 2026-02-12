# Frontend Implementation TODO

## 1. Create Missing API Client Files
- [x] Create auth.api.ts: Functions for login, register, profile, logout using axiosClient
- [x] Create chatbot.api.ts: Function for sending queries to /chatbot/query
- [x] Create skills.api.ts: Functions for skill assessment, analysis
- [x] Create career.api.ts: Functions for career recommendations
- [x] Create learning.api.ts: Functions for learning paths and resources

## 2. Update AuthContext.tsx
- [x] Replace fetch with axiosClient and auth.api.ts functions
- [x] Ensure JWT handling with access/refresh tokens

## 3. Create ChatContext.tsx
- [x] Context for chatbot session management, messages, etc.

## 4. Create chatbot/ Folder and Components
- [x] Move FloatingChatbot.tsx to chatbot/
- [x] Create ChatWindow.tsx
- [x] Create ChatHeader.tsx
- [x] Create ChatMessages.tsx
- [x] Create ChatInput.tsx
- [x] Create ChatBubble.tsx
- [x] Create TypingIndicator.tsx
- [x] Implement useChatbot.ts in hooks/ for state management (messages, session_id, sendMessage)

## 5. Implement Chatbot Functionality
- [x] Floating widget on all pages
- [x] Full-page view in /assistant
- [x] Maintain session_id from backend
- [x] Display intent-aware responses

## 6. Update Pages for Full Functionality
- [x] Dashboard: Show career matches, skills overview, gaps, recent activity
- [x] Assessment: Skill assessment form
- [ ] GapAnalysis: Display skill gaps with explanations
- [x] Careers: Career recommendations with match scores
- [x] Learning: Learning paths with progress
- [x] Assistant: Full chatbot interface
- [ ] AdminDashboard: Metrics, user management, role editing

## 7. Ensure Authentication and Protection
- [ ] Use ProtectedRoute for admin
- [ ] Handle JWT auto-attach and 401 logout

## 8. Add AI Explanations
- [ ] Tooltips/badges showing why recommendations are made, missing skills, priorities

## Followup Steps
- [ ] Test authentication flow
- [ ] Test chatbot integration with backend
- [ ] Verify dashboard data fetching
- [ ] Ensure admin role protection
- [ ] Run the app and check for compilation errors
