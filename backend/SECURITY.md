# Security Hardening Guide

This document outlines the security measures implemented in the Dukaan Clone backend.

## Security Headers

### Helmet.js Configuration
- **Content Security Policy (CSP)**: Restricts resource loading
- **HTTP Strict Transport Security (HSTS)**: Forces HTTPS
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables XSS filter
- **Referrer-Policy**: Controls referrer information

## Input Validation

### Express Validator
All user inputs are validated using `express-validator`:

- **Email**: Valid email format, normalized
- **Password**: Minimum 6 characters, complexity requirements
- **UUID**: Valid UUID format for IDs
- **URLs**: Valid URL format
- **Numbers**: Type and range validation
- **Strings**: Length and character validation

### Validation Middleware
- `validateRegister`: Registration input validation
- `validateLogin`: Login input validation
- `validateStoreCreate`: Store creation validation
- `validateProductCreate`: Product creation validation
- `validateUUIDParam`: UUID parameter validation
- `validatePagination`: Pagination parameter validation

## Input Sanitization

### XSS Prevention
All user inputs are sanitized to prevent XSS attacks:

- HTML entities encoding
- Script tag removal
- Special character escaping
- Nested object sanitization

### NoSQL Injection Prevention
- MongoDB operator removal
- Query parameter sanitization
- Object key validation

## Authentication & Authorization

### Token-Based Authentication
- JWT tokens via Supabase Auth
- Bearer token validation
- Token expiration handling
- Refresh token support

### Authorization Checks
- Store ownership verification
- Resource access control
- Role-based permissions
- Protected route middleware

## Rate Limiting

### Endpoint-Specific Limits
- **Authentication**: 5 requests per 15 minutes
- **AI Endpoints**: 10 requests per minute
- **Upload**: 20 requests per 15 minutes
- **General API**: 100 requests per 15 minutes

### Benefits
- Prevents brute force attacks
- Reduces API abuse
- Protects expensive operations
- DDoS mitigation

## Data Protection

### Environment Variables
- Sensitive data in `.env` file
- Never commit secrets to git
- Separate dev/prod configurations
- Secure key management

### Database Security
- Row Level Security (RLS) enabled
- Parameterized queries
- SQL injection prevention
- Access control policies

## File Upload Security

### File Validation
- File type validation (images only)
- File size limits (5MB)
- Filename sanitization
- Virus scanning (recommended)

### Storage Security
- Secure bucket configuration
- Public/private access control
- File access restrictions
- Secure URL generation

## API Security

### CORS Configuration
- Whitelist specific origins
- Credentials handling
- Preflight request handling
- Secure cross-origin requests

### Request Validation
- Content-Type validation
- Request size limits
- Parameter validation
- Body parsing limits

## Error Handling

### Secure Error Messages
- No sensitive data in errors
- Generic error messages in production
- Detailed errors in development
- Stack trace hiding

### Logging
- Request logging
- Error logging
- Security event logging
- No sensitive data in logs

## Best Practices

### 1. Always Validate Input
```javascript
const { validateRegister } = require('./middleware/inputValidation');
router.post('/register', validateRegister, controller.register);
```

### 2. Sanitize User Data
```javascript
const { sanitizeBody } = require('./middleware/security');
app.use(sanitizeBody);
```

### 3. Use UUID Validation
```javascript
const { validateUUID } = require('./middleware/security');
router.get('/:id', validateUUID('id'), controller.get);
```

### 4. Implement Rate Limiting
```javascript
const { authLimiter } = require('./middleware/rateLimiter');
router.post('/login', authLimiter, controller.login);
```

### 5. Verify Ownership
```javascript
// Always verify user owns the resource
if (store.owner_id !== req.userId) {
  return res.status(403).json({ error: 'Access denied' });
}
```

## Security Checklist

- [x] Security headers configured
- [x] Input validation implemented
- [x] Input sanitization enabled
- [x] Rate limiting configured
- [x] Authentication middleware
- [x] Authorization checks
- [x] UUID validation
- [x] CORS configured
- [x] Error handling secure
- [x] File upload validation
- [x] Environment variables secure
- [x] Database RLS enabled

## Common Vulnerabilities Prevented

1. **XSS (Cross-Site Scripting)**: Input sanitization
2. **SQL Injection**: Parameterized queries
3. **NoSQL Injection**: Operator removal
4. **CSRF**: CORS and token validation
5. **Brute Force**: Rate limiting
6. **DDoS**: Rate limiting and caching
7. **Path Traversal**: Input validation
8. **Command Injection**: Input sanitization
9. **File Upload Attacks**: File validation
10. **Information Disclosure**: Secure error handling

## Security Headers Reference

```
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## Monitoring

### Security Events to Monitor
- Failed authentication attempts
- Rate limit violations
- Invalid input patterns
- Unauthorized access attempts
- File upload failures
- Database query errors

### Logging Best Practices
- Log security events
- Monitor suspicious activity
- Track rate limit hits
- Alert on anomalies
- Regular security audits

## Future Enhancements

1. **2FA**: Two-factor authentication
2. **OAuth**: Social login integration
3. **WAF**: Web Application Firewall
4. **IP Whitelisting**: For admin endpoints
5. **Audit Logging**: Comprehensive audit trail
6. **Penetration Testing**: Regular security audits
7. **Dependency Scanning**: Automated vulnerability scanning
8. **Secrets Management**: Use secret management service

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Validator](https://express-validator.github.io/docs/)

