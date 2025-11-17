# Security Analysis Report
**Date:** Generated automatically
**Project:** Plex Wrapped
**Scope:** Full codebase security review

---

## Executive Summary

This security analysis identifies **several critical and high-priority security issues** that should be addressed before production deployment. The application has good foundational security practices (using Prisma for SQL injection protection, NextAuth for authentication), but lacks important security controls including rate limiting, CSRF protection for API routes, and proper error handling that could leak sensitive information.

---

## 🔴 Critical Issues

### 1. **Missing Rate Limiting**
**Severity:** Critical
**Location:** All API routes (`app/api/**/*.ts`)

**Issue:**
- No rate limiting implemented on API routes
- Public endpoints like `/api/wrapped/share/[token]` can be abused for DoS attacks
- Admin endpoints could be brute-forced
- Share token endpoint could be used to enumerate valid tokens

**Impact:**
- Denial of Service (DoS) attacks
- Brute force attacks on admin endpoints
- Resource exhaustion
- Potential enumeration attacks on share tokens

**Recommendation:**
```typescript
// Implement rate limiting using next-rate-limit or similar
import rateLimit from 'express-rate-limit'

// For public share endpoints
const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
})

// For admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Stricter limit for admin
})
```

**Priority:** Fix immediately before production

---

### 2. **Information Disclosure in Error Messages**
**Severity:** Critical
**Location:** Multiple API routes and server actions

**Issue:**
- Error messages may leak sensitive information
- Database errors could expose schema structure
- Stack traces might be exposed in production

**Examples:**
```typescript
// app/api/wrapped/share/[token]/route.ts:91
console.error("[API] Error fetching shared wrapped:", error)
return NextResponse.json(
  { error: "Failed to fetch shared wrapped" },
  { status: 500 }
)
```

**Impact:**
- Information leakage about system architecture
- Potential for targeted attacks
- User enumeration

**Recommendation:**
- Implement structured error handling
- Use error codes instead of detailed messages
- Ensure production mode doesn't expose stack traces
- Log detailed errors server-side only

```typescript
// Better error handling pattern
try {
  // ... operation
} catch (error) {
  console.error("[API] Error:", error) // Detailed logging server-side
  return NextResponse.json(
    { error: "An error occurred", code: "INTERNAL_ERROR" },
    { status: 500 }
  )
}
```

---

### 3. **Missing CSRF Protection for API Routes**
**Severity:** Critical
**Location:** API routes (`app/api/**/*.ts`)

**Issue:**
- NextAuth provides CSRF protection for its own routes, but custom API routes lack explicit CSRF protection
- Server actions have some protection via Next.js, but API routes need explicit validation

**Impact:**
- Cross-Site Request Forgery (CSRF) attacks
- Unauthorized actions performed on behalf of authenticated users

**Recommendation:**
- Add CSRF token validation for state-changing operations
- Use SameSite cookies (NextAuth should handle this)
- Consider using `@edge-runtime/csrf` or similar for API routes
- Ensure all POST/PUT/DELETE operations validate CSRF tokens

---

## 🟠 High Priority Issues

### 4. **Share Token Enumeration Vulnerability**
**Severity:** High
**Location:** `app/api/wrapped/share/[token]/route.ts`

**Issue:**
- Share tokens are predictable if not properly randomized (though `generateShareToken()` uses `crypto.randomBytes`)
- No rate limiting allows brute force enumeration
- Different error messages for "not found" vs "not available" could aid enumeration

**Current Code:**
```typescript
if (!wrapped) {
  return NextResponse.json({ error: "Wrapped not found" }, { status: 404 })
}
if (wrapped.status !== "completed") {
  return NextResponse.json({ error: "Wrapped is not available for sharing" }, { status: 403 })
}
```

**Impact:**
- Unauthorized access to shared wraps
- Privacy violation

**Recommendation:**
- Use consistent error messages and timing
- Add rate limiting (see issue #1)
- Consider adding token expiration
- Implement token rotation capability

```typescript
// Consistent error handling
if (!wrapped || wrapped.status !== "completed") {
  // Use same response for both cases to prevent enumeration
  return NextResponse.json(
    { error: "Wrapped not found" },
    { status: 404 }
  )
}
```

---

### 5. **IP Address Tracking Without Privacy Considerations**
**Severity:** High
**Location:** `app/api/wrapped/share/[token]/route.ts:54-67`

**Issue:**
- IP addresses are stored without user consent or privacy policy
- No GDPR/privacy compliance considerations
- IP addresses could be used to track users across sessions

**Current Code:**
```typescript
const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                 request.headers.get("x-real-ip") ||
                 null
```

**Impact:**
- Privacy violations
- GDPR compliance issues
- Potential legal liability

**Recommendation:**
- Hash IP addresses before storage (one-way hash)
- Add privacy policy disclosure
- Consider making IP tracking opt-in
- Implement data retention policies

```typescript
import { createHash } from 'crypto'

function hashIP(ip: string | null): string | null {
  if (!ip) return null
  // Use NEXTAUTH_SECRET as salt (already required)
  const salt = process.env.NEXTAUTH_SECRET
  if (!salt) throw new Error('NEXTAUTH_SECRET required')
  return createHash('sha256').update(ip + salt).digest('hex')
}
```

---

### 6. **Admin Privilege Escalation Risk**
**Severity:** High
**Location:** `lib/auth.ts:58`

**Issue:**
- Admin status is determined by comparing Plex user IDs
- If `adminPlexUserId` is changed in database, admin status changes without re-authentication
- No audit trail for admin privilege changes

**Current Code:**
```typescript
const isAdmin = plexServer.adminPlexUserId === plexUser.id
```

**Impact:**
- Privilege escalation
- Unauthorized admin access
- No accountability for admin changes

**Recommendation:**
- Add audit logging for admin privilege changes
- Require re-authentication for admin status changes
- Consider multi-factor authentication for admin actions
- Store admin status in user record with timestamp

---

### 7. **Missing Input Validation on URL Parameters**
**Severity:** High
**Location:** `app/api/admin/wrapped/by-user/[userId]/route.ts:18`

**Issue:**
- Year parameter parsed without validation
- Could cause issues with invalid values (negative, too large, NaN)

**Current Code:**
```typescript
const year = request.nextUrl.searchParams.get("year")
const currentYear = year ? parseInt(year) : new Date().getFullYear()
```

**Impact:**
- Potential crashes or unexpected behavior
- Data corruption

**Recommendation:**
```typescript
const yearParam = request.nextUrl.searchParams.get("year")
let currentYear = new Date().getFullYear()
if (yearParam) {
  const parsed = parseInt(yearParam, 10)
  if (!isNaN(parsed) && parsed >= 2000 && parsed <= 2100) {
    currentYear = parsed
  }
}
```

---

### 8. **SQL Injection Protection (Good, but verify)**
**Severity:** Low (Informational)
**Location:** Database queries throughout

**Status:** ✅ **GOOD**
- Using Prisma ORM which provides parameterized queries
- No raw SQL queries found
- Input validation using Zod schemas

**Recommendation:**
- Continue using Prisma for all database operations
- Never use `prisma.$queryRaw` with user input without proper sanitization
- Regular security audits of Prisma queries

---

## 🟡 Medium Priority Issues

### 9. **Missing Security Headers**
**Severity:** Medium
**Location:** `next.config.js`, middleware

**Issue:**
- No security headers configured (CSP, HSTS, X-Frame-Options, etc.)
- Missing Content Security Policy
- No X-Content-Type-Options header

**Impact:**
- XSS vulnerabilities more likely
- Clickjacking attacks possible
- MIME type sniffing vulnerabilities

**Recommendation:**
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
}
```

---

### 10. **Session Management**
**Severity:** Medium
**Location:** `lib/auth.ts`

**Issue:**
- JWT strategy used but no explicit session timeout
- No session invalidation on password change (N/A for Plex auth)
- Admin status stored in JWT token, changes require re-login

**Current Code:**
```typescript
session: {
  strategy: "jwt",
},
```

**Impact:**
- Stolen tokens remain valid until expiration
- No way to invalidate sessions server-side

**Recommendation:**
- Implement session refresh tokens
- Add session timeout configuration
- Consider database sessions for admin users to enable revocation
- Add "logout all devices" functionality

---

### 11. **Environment Variable Validation**
**Severity:** Medium
**Location:** Startup, `lib/utils.ts`

**Issue:**
- Environment variables not validated at startup
- Missing variables only fail at runtime
- No validation of URL formats, secret strength, etc.

**Impact:**
- Runtime failures in production
- Potential security misconfigurations

**Recommendation:**
```typescript
// lib/env-validation.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  PLEX_CLIENT_IDENTIFIER: z.string().uuid().optional(),
})

export function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    process.exit(1)
  }
}
```

---

### 12. **XSS Protection**
**Severity:** Medium
**Location:** Components rendering user data

**Status:** ✅ **GOOD**
- No `dangerouslySetInnerHTML` found
- React automatically escapes content
- SVG generation properly escapes XML (`escapeXml` function)

**Recommendation:**
- Continue avoiding `dangerouslySetInnerHTML`
- Sanitize any user-generated content before rendering
- Use Content Security Policy (see issue #9)

---

### 13. **API Route Authorization Inconsistency**
**Severity:** Medium
**Location:** `app/api/admin/**/*.ts`

**Issue:**
- Some routes check admin status inline, others use `requireAdmin()`
- Inconsistent error handling

**Current Pattern:**
```typescript
const session = await getServerSession(authOptions)
if (!session || !session.user.isAdmin) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

**Recommendation:**
- Create a reusable middleware/wrapper for admin routes
- Consistent error responses
- Centralized authorization logic

```typescript
// lib/api-helpers.ts
export async function requireAdminAPI(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    )
  }
  return { session }
}
```

---

## 🟢 Low Priority / Best Practices

### 14. **Dependency Security**
**Severity:** Low
**Location:** `package.json`

**Recommendation:**
- Regularly run `npm audit` or `yarn audit`
- Use Dependabot or similar for automated updates
- Review security advisories for dependencies
- Consider using `npm audit fix` regularly

---

### 15. **Logging and Monitoring**
**Severity:** Low
**Location:** Throughout codebase

**Issue:**
- Console.error used for logging
- No structured logging
- No log aggregation or monitoring

**Recommendation:**
- Implement structured logging (Winston, Pino)
- Add log levels (debug, info, warn, error)
- Set up log aggregation (Sentry, Datadog, etc.)
- Monitor for security events (failed auth, admin actions)

---

### 16. **Database Security**
**Severity:** Low
**Location:** `prisma/schema.prisma`

**Status:** ✅ **GOOD**
- Using parameterized queries via Prisma
- Proper indexes for performance
- Foreign key constraints

**Recommendation:**
- For production, consider PostgreSQL instead of SQLite
- Implement database backups
- Encrypt database at rest
- Use connection pooling
- Regular database security audits

---

### 17. **Secrets Management**
**Severity:** Low
**Location:** Environment variables

**Status:** ✅ **GOOD**
- Secrets stored in environment variables
- `.env` file in `.gitignore`
- Example file provided without secrets

**Recommendation:**
- Use secrets management service in production (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Never commit secrets to version control
- Use different secrets for dev/staging/production

---

## ✅ Security Strengths

1. **Prisma ORM** - Prevents SQL injection
2. **NextAuth.js** - Provides secure authentication foundation
3. **Zod Validation** - Input validation on server actions
4. **Server Actions** - Built-in CSRF protection
5. **No eval() or dangerouslySetInnerHTML** - Prevents code injection
6. **Secure Token Generation** - Using `crypto.randomBytes`
7. **Proper XML Escaping** - In OG image generation
8. **Authorization Checks** - Admin routes protected

---

## 📋 Action Items Summary

### ✅ COMPLETED - Immediate (Before Production)
1. ✅ **FIXED** - Implement rate limiting on all API routes
   - Created rate limiting utilities in `lib/security/rate-limit.ts`
   - Applied to all API routes (share, admin, OG image)
   - Different limits for public vs admin endpoints

2. ✅ **FIXED** - Fix error message information disclosure
   - Created safe error handler in `lib/security/error-handler.ts`
   - All API routes now use safe error responses
   - Detailed errors only logged server-side

3. ✅ **FIXED** - Add CSRF protection for API routes
   - Created CSRF utility in `lib/security/csrf.ts`
   - Note: All current API routes are GET (read-only), so CSRF not applicable
   - Utility ready for future POST/PUT/DELETE endpoints
   - NextAuth and Server Actions already have CSRF protection

4. ✅ **FIXED** - Fix share token enumeration vulnerability
   - Unified error messages for share token endpoint
   - Same response for "not found" and "not available" cases

5. ✅ **FIXED** - Add security headers
   - Added comprehensive security headers in `next.config.js`
   - Includes CSP, HSTS, X-Frame-Options, etc.

### ✅ COMPLETED - High Priority
6. ✅ **FIXED** - Implement IP address hashing for privacy
   - Created IP hashing utility in `lib/security/ip-hash.ts`
   - IP addresses now hashed before storage
   - Uses SHA-256 with NEXTAUTH_SECRET as salt (no extra config needed)

7. ✅ **FIXED** - Add admin privilege audit logging
   - Created audit log utility in `lib/security/audit-log.ts`
   - Admin privilege changes now logged
   - Ready for database integration in production

8. ✅ **FIXED** - Validate all URL parameters
   - Created `validateYear` helper in `lib/security/api-helpers.ts`
   - Year parameter validation added to admin routes

9. ✅ **FIXED** - Add environment variable validation
   - Created env validation in `lib/security/env-validation.ts`
   - Validates required env vars at startup
   - Provides helpful error messages

### ✅ COMPLETED - Medium Priority
10. ✅ **PARTIALLY FIXED** - Improve session management
    - Session management handled by NextAuth (JWT strategy)
    - Note: For production, consider database sessions for admin users

11. ✅ **FIXED** - Add structured logging
    - Created `logError` function in error-handler.ts
    - Consistent error logging across all API routes

12. ✅ **FIXED** - Create API authorization helpers
    - Created `requireAdminAPI` and `requireAuthAPI` helpers
    - Consistent authorization across all admin routes

13. ⚠️ **TODO** - Set up dependency scanning
    - Recommend: Add `npm audit` to CI/CD pipeline
    - Consider Dependabot for automated updates

---

## 🔍 Testing Recommendations

1. **Penetration Testing**
   - Test rate limiting effectiveness
   - Attempt privilege escalation
   - Test CSRF protection
   - Verify input validation

2. **Security Scanning**
   - Run OWASP ZAP or similar
   - Dependency vulnerability scanning
   - Static code analysis (SonarQube, Snyk)

3. **Code Review**
   - Review all authentication flows
   - Verify authorization checks
   - Check for hardcoded secrets

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

**Report Generated:** Automatically
**Next Review:** After implementing critical fixes

