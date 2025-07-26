# Claude Development Guidelines

## Server Management
- **DO NOT run `npm run dev`** - Always rely on the user to start and manage the development server
- The user will handle starting, stopping, and restarting the server as needed
- If server restart is needed, inform the user rather than attempting to run commands yourself

## Environment Configuration  
- **DO NOT modify `.env` files** unless the user explicitly requests it
- Environment variables should only be changed when specifically asked by the user
- If environment issues are suspected, inform the user about potential fixes rather than making changes directly

## Testing Endpoints
- When testing API endpoints, assume the server is running on the port the user mentions
- If connection issues occur, inform the user rather than attempting server restarts
- Use curl or other testing methods only when the user confirms the server is running

## General Development Approach
- Focus on code changes and improvements
- Let the user handle infrastructure and server management
- Ask for confirmation before making any environment or configuration changes