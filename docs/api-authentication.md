# User Authentication API Routes

This document outlines the API endpoints related to user authentication, session management, and onboarding within the application.

## Authentication System

The application uses NextAuth.js for authentication, providing support for both OAuth (Google) and email/password credentials.

### Environment Variables

The following environment variables must be configured for authentication to work properly:

```
# NextAuth Configuration
AUTH_SECRET="your-secret-key-here" # Required: A secure random string
NEXTAUTH_URL="http://localhost:3000" # Required: The base URL of your application
GOOGLE_CLIENT_ID="your-google-client-id" # Optional: For Google OAuth
GOOGLE_CLIENT_SECRET="your-google-client-secret" # Optional: For Google OAuth

# Supabase Configuration (if using Supabase for database)
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### Authentication Flow

1. Users can authenticate using:
   - Google OAuth (Sign in with Google)
   - Email/password credentials

2. After successful authentication:
   - A session cookie is stored
   - The user is redirected to the dashboard or the page they were trying to access

## Authentication Endpoints

### `/api/auth/[...nextauth]`

**Method:** GET/POST  
**Purpose:** NextAuth.js endpoint handling all authentication flows  
**Features:**
- Sign in/sign up with credentials
- OAuth authentication with Google
- Session management
- Callback handling

## User Profile Endpoints

### `/api/user/profile`

**Method:** GET  
**Purpose:** Retrieves the current user's profile information  
**Authentication:** NextAuth session  
**Returns:** User profile data

### `/api/user/ensure-profile`

**Method:** POST  
**Purpose:** Creates or verifies that a profile exists for the authenticated user  
**Authentication:** NextAuth session  
**Returns:** Profile data and creation status

### `/api/user/mark-onboarded`

**Method:** POST  
**Purpose:** Marks a user as having completed the onboarding process  
**Authentication:** NextAuth session  
**Implementation Notes:**
- Validates session using NextAuth's getServerSession
- Implements rate limiting to prevent abuse
- Includes detailed error handling and logging
- Performs verification after update to ensure changes were applied

**Common Errors:**
- 401: Unauthenticated user
- 429: Rate limit exceeded
- 500: Database error

## Implementation Details

### Error Handling

All API routes follow a consistent error handling pattern:

1. Structured error responses with `success`, `error`, and `message` fields
2. Appropriate HTTP status codes
3. Detailed server-side logging for debugging

### Authentication Methods

The application supports two authentication methods:

1. **OAuth (Google)** - Sign in with Google account
2. **Credentials** - Email/password authentication

### Security Considerations

- Rate limiting is implemented on sensitive endpoints
- All operations validate user sessions before execution
- Secure, HTTP-only cookies for session storage
- CSRF protection built into NextAuth.js

## Debugging Authentication Issues

When debugging authentication-related issues:

1. Check browser console for detailed error messages
2. Verify that environment variables are correctly set:
   - `AUTH_SECRET` - A secure random string
   - `NEXTAUTH_URL` - The base URL of your application
3. For Google OAuth issues:
   - Ensure redirect URIs are correctly configured in Google Cloud Console
   - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
4. Examine server logs for detailed error information
5. Check that cookies are being properly set (no SameSite issues, correct domain) 