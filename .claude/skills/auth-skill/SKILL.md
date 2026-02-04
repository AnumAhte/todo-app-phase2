---
name: auth-skill
description: Handle secure authentication flows including signup, signin, password hashing, JWT tokens, and Better Auth integration.
---

# Authentication Skill

## Instructions

1. **User Registration (Signup)**
   - Validate email, password strength, and required fields
   - Hash passwords using bcrypt or Argon2
   - Prevent duplicate accounts
   - Store users securely in database

2. **User Login (Signin)**
   - Verify credentials against hashed passwords
   - Implement rate limiting and lockout protection
   - Return secure authentication tokens on success

3. **Password Security**
   - Use strong hashing (bcrypt / Argon2)
   - Never store plain-text passwords
   - Implement password reset and rotation flows

4. **JWT Token Handling**
   - Generate access and refresh tokens
   - Sign tokens with secure secrets or private keys
   - Validate, refresh, and revoke tokens properly
   - Set correct expiration and scopes

5. **Better Auth Integration**
   - Configure Better Auth providers and adapters
   - Handle session management and token lifecycle
   - Integrate social login if required
   - Enforce role-based access control

## Best Practices
- Always hash and salt passwords
- Use HTTPS-only secure cookies for tokens
- Apply CSRF and XSS protection
- Rotate secrets regularly
- Follow OWASP authentication guidelines
- Log auth events without exposing sensitive data

## Example Flow (FastAPI)

```python
# Signup
hashed_password = pwd_context.hash(user.password)

# JWT Creation
access_token = create_access_token(
    data={"sub": user.email},
    expires_delta=timedelta(minutes=15)
)

# Token Verification
payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
user_id = payload.get("sub")
 