# Secure Admin Panel

This is a highly restricted administration panel that can only be accessed with a valid passkey. It includes all the functionality of the previous admin panel with enhanced security.

## Access Information

- **URL**: `/secure-admin`
- **Login**: `/secure-admin/login`
- **Default Passkey**: `cenopiee_secure_passkey_2025`

## Features

### Company Management
- Approve pending company registrations
- Reject inappropriate company submissions
- Grant verification badges to trusted companies
- Monitor approved companies

### User Verification
- Grant verification badges to users
- Remove verification from users
- Manage user accounts
- Monitor user activity

## Security Features

1. **Passkey Authentication**: Only users with the correct passkey can access the panel
2. **Session Management**: Sessions expire after 1 hour of inactivity
3. **Route Protection**: Critical routes are protected and require authentication
4. **Component Protection**: Individual components can be protected with passkey checks

## How to Use

1. Navigate to `/secure-admin/login`
2. Enter the passkey to authenticate
3. Upon successful authentication, you can access the dashboard at `/secure-admin/dashboard`
4. Manage companies and users through the intuitive interface
5. Session will automatically expire after 1 hour

## How to Enhance Security

For production use, you should:

1. Change the default passkey in `lib/passkeyAuth.ts`
2. Implement proper hashing for passkeys instead of plain text comparison
3. Add rate limiting to prevent brute force attacks
4. Implement IP-based restrictions
5. Add two-factor authentication
6. Use environment variables for sensitive values

## Component Protection

To protect individual components or functions, use the `isPasskeyAuthenticated()` function:

```typescript
import { isPasskeyAuthenticated } from '@/lib/passkeyAuth';

function SecureComponent() {
  if (!isPasskeyAuthenticated()) {
    return <div>Access denied. Please authenticate.</div>;
  }
  
  return <div>Secure content here</div>;
}
```

## Architecture

- The login page (`/secure-admin/login`) is publicly accessible
- Protected pages like dashboard (`/secure-admin/dashboard`) check for authentication
- Session management is handled through localStorage
- All sensitive operations should be protected with passkey checks