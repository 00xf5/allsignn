# Supabase Backend - Login Handler

This directory contains the Supabase Edge Function (Deno) for handling user authentication and login responses.

## File Structure

```
supabase/
└── functions/
    └── login/
        └── index.ts
```

## Login Endpoint

**Function:** `login`
**Method:** `POST`
**Path:** `/functions/v1/login`

### Request Body

```json
{
  "email": "user@example.com",
  "provider": "outlook"
}
```

**Notes:**
- `email` (required): The user's email address
- `provider` (optional): The OAuth provider name (e.g., "outlook", "yahoo", "office365")
- The name is automatically extracted from the email (e.g., "john.doe@example.com" → "John Doe")

### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Hi John Doe, welcome! You have successfully authenticated via outlook. Your account is now active and ready to use.",
  "data": {
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "outlook",
    "timestamp": "2024-06-08T15:30:00.000Z"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Missing required fields: email and provider are required."
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "An unexpected error occurred during login processing."
}
```

## Deployment Instructions

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

### Deploy the Function

```bash
supabase functions deploy login
```

### Test Locally

```bash
supabase functions serve login
```

## Integration with Frontend

To integrate this with your React frontend, update the `OAuthSimulator.tsx` component to call this endpoint after successful OAuth:

```typescript
const response = await fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    email: userEmail,
    name: userName,
    provider: provider.id
  })
})

const data = await response.json()
console.log(data.message) // "Hi John Doe, welcome! You have successfully authenticated..."
```

## Features

- ✅ Professional welcome message generation
- ✅ Email validation
- ✅ Name formatting (converts `john.doe` to `John Doe`)
- ✅ Provider tracking
- ✅ Timestamp logging
- ✅ CORS support
- ✅ Error handling
- ✅ TypeScript support

## Security Notes

- Always use HTTPS in production
- Store your Supabase keys in environment variables
- Implement rate limiting for production use
- Add JWT validation if using Supabase Auth
