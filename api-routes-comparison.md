# API Routes Comparison: FastAPI vs Next.js

## ✅ Implemented Routes (12/17)

| FastAPI Route | Next.js Route | Status | Notes |
|--------------|---------------|---------|-------|
| `POST /count_tokens` | `/api/count_tokens` | ✅ | Fixed to handle empty strings |
| `GET /tree` | `/api/tree` | ✅ | Enhanced with token counting |
| `GET /directories` | `/api/directories` | ✅ | Working |
| `GET /file_content` | `/api/file_content` | ✅ | Working with binary detection |
| `GET /git-info/{repository}` | `/api/git-info/[repository]` | ✅ | Fixed REPO_PATH issues |
| `GET /system_prompts` | `/api/system_prompts` | ✅ | Full CRUD operations |
| `POST /system_prompts` | `/api/system_prompts` | ✅ | Create new prompts |
| `PUT /system_prompts/{id}` | `/api/system_prompts/[promptId]` | ✅ | Update prompts |
| `DELETE /system_prompts/{id}` | `/api/system_prompts/[promptId]` | ✅ | Delete prompts |
| `POST /llm_interaction` | `/api/llm_interaction` | ✅ | AI model interactions |
| `GET /available_models` | `/api/available_models` | ✅ | Model configurations |
| `POST /analyze-prompt` | `/api/analyze-prompt` | ✅ | File suggestions |
| `GET /chat-sessions` | `/api/chat-sessions` | ✅ | List sessions |
| `POST /chat-sessions` | `/api/chat-sessions` | ✅ | Create session |
| `GET /chat-sessions/{id}` | `/api/chat-sessions/[sessionId]` | ✅ | Get session |
| `PUT /chat-sessions/{id}` | `/api/chat-sessions/[sessionId]` | ✅ | Update session |
| `DELETE /chat-sessions/{id}` | `/api/chat-sessions/[sessionId]` | ✅ | Soft delete |
| N/A | `/api/file-stats` | ✅ | NEW - File statistics |
| `GET /` | `/api/` | ✅ | Health check/Welcome message |

## ❌ Missing Routes (5/17)

| FastAPI Route | Purpose | Priority | Implementation Notes |
|--------------|----------|----------|---------------------|
| `GET /file_lines` | Get line count for file | Low | Simple file utility |
| `GET /env_vars` | Get environment variables | Medium | Settings management |
| `POST /env_vars` | Update environment variables | Medium | Settings management |
| `POST /repository-context/{repo}/initialize` | Initialize context map | **HIGH** | Critical for analyze-prompt |
| `POST /repository-context/{repo}/refresh` | Refresh context map | **HIGH** | Critical for analyze-prompt |
| `GET /repository-context/{repo}` | Get context map | **HIGH** | Critical for analyze-prompt |

## 🔧 Implementation Differences

### Token Counting
- **FastAPI**: Uses same 4-char approximation
- **Next.js**: Implemented identically, with empty string handling

### File Handling
- **FastAPI**: Python's `os` and file operations
- **Next.js**: Node.js `fs` module with similar logic

### Git Operations
- **FastAPI**: Python subprocess with git commands
- **Next.js**: Node.js `child_process.exec` with same git commands

### AI Integrations
- **FastAPI**: Direct API calls with httpx
- **Next.js**: Official SDKs (OpenAI, Anthropic)

### Context Mapping
- **FastAPI**: Complex Python implementation in `utils/context_map.py`
- **Next.js**: **NOT IMPLEMENTED** - Most critical missing feature

## 🎯 Priority Implementation Order

### Critical (Blocks Core Features)
1. **Context Map Endpoints** - Required for analyze-prompt to work properly
   - `/api/repository-context/[repository]/initialize`
   - `/api/repository-context/[repository]/refresh`
   - `/api/repository-context/[repository]`

### Medium Priority
2. **Environment Variables API** - For settings management
   - `/api/env_vars` (GET/POST)

### Low Priority
3. **Utility Endpoints**
   - `/api/file_lines` - Line counting
   - `/` - Root welcome message

## 📝 Notes

- The context mapping system is the most significant missing piece
- All file-based operations have been successfully migrated
- AI integrations are working with official SDKs
- Authentication/authorization not implemented in either version
- Error handling is consistent between implementations