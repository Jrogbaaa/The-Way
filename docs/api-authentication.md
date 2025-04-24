# User Authentication API Routes

This document outlines the API endpoints related to user authentication, session management, and onboarding within the application.

## Authentication Endpoints

### `/api/auth/validate-session`

**Method:** GET  
**Purpose:** Validates if the current user session is valid  
**Authentication:** Cookie-based session  
**Returns:** Success status and user information if authenticated

## User Profile Endpoints

### `/api/user/profile`

**Method:** GET  
**Purpose:** Retrieves the current user's profile information  
**Authentication:** Cookie-based session  
**Returns:** User profile data

### `/api/user/ensure-profile`

**Method:** POST  
**Purpose:** Creates or verifies that a profile exists for the authenticated user  
**Authentication:** Cookie-based session  
**Returns:** Profile data and creation status

### `/api/user/mark-onboarded`

**Method:** POST  
**Purpose:** Marks a user as having completed the onboarding process  
**Authentication:** Bearer token in Authorization header  
**Implementation Notes:**
- Uses the service role key (`SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS
- Implements rate limiting to prevent abuse
- Includes detailed error handling and logging
- Performs verification after update to ensure changes were applied

**Required Environment Variables:**
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access key for bypassing RLS

**Common Errors:**
- 401: Missing or invalid authorization token
- 429: Rate limit exceeded
- 500: Database error or service role key missing

## Implementation Details

### Error Handling

All API routes follow a consistent error handling pattern:

1. Structured error responses with `success`, `error`, and `message` fields
2. Appropriate HTTP status codes
3. Detailed server-side logging for debugging

### Authentication Methods

The application supports two authentication methods for API routes:

1. **Cookie-based authentication** - Primary method using Supabase Auth
2. **Token-based authentication** - Used for stateless operations

### Security Considerations

- Rate limiting is implemented on sensitive endpoints
- Service role operations are carefully controlled
- All operations validate user permissions before execution

## Debugging Authentication Issues

When debugging authentication-related issues:

1. Check browser console for detailed error messages
2. Verify that environment variables are correctly set
3. Examine server logs for detailed error information
4. Ensure the Supabase service role key is properly configured
5. Verify database RLS policies allow the required operations 