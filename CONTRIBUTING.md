# Contributing to Dukaan Clone

Thank you for your interest in contributing to Dukaan Clone! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Supabase account (for database)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/dukaan-clone.git
   cd dukaan-clone
   ```

2. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Set Up Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in your credentials
   - See [Environment Setup](./backend/database/README.md)

4. **Run Development Servers**
   ```bash
   # Frontend (terminal 1)
   cd frontend
   npm run dev
   
   # Backend (terminal 2)
   cd backend
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation
- `refactor/refactoring-description` - Code refactoring
- `test/test-description` - Tests

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(auth): add two-factor authentication
fix(cart): resolve cart persistence issue
docs(api): update API documentation
refactor(products): optimize product queries
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments where necessary
   - Update documentation

3. **Test Your Changes**
   - Run existing tests
   - Test manually
   - Check for errors
   - Verify functionality

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Create PR on GitHub
   - Fill out PR template
   - Request review

6. **Address Feedback**
   - Respond to comments
   - Make requested changes
   - Update PR as needed

## Code Style

### JavaScript/React

- Use ES6+ features
- Use functional components
- Use hooks for state management
- Follow React best practices
- Use meaningful variable names
- Add JSDoc comments for functions

### Naming Conventions

- **Components**: PascalCase (`ProductCard.jsx`)
- **Files**: camelCase for utilities, PascalCase for components
- **Variables**: camelCase (`userName`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Functions**: camelCase (`getUserData`)

### Code Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Maximum line length: 100 characters
- Remove trailing whitespace

### File Structure

```
component/
├── ComponentName.jsx
├── ComponentName.css
└── index.js (if needed)
```

## Testing

### Writing Tests

- Write tests for new features
- Test edge cases
- Test error handling
- Maintain test coverage

### Running Tests

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

## Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex logic
- Update README for new features
- Update API documentation

### API Documentation

- Document new endpoints
- Include request/response examples
- Document error responses
- Update API version if needed

## Bug Reports

### Before Reporting

1. Check existing issues
2. Verify it's a bug
3. Try to reproduce
4. Check documentation

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 90]
- Version: [e.g., 1.0.0]

**Additional Context**
Any other relevant information
```

## Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other solutions you've thought about

**Additional Context**
Any other relevant information
```

## Questions?

- Check existing documentation
- Search existing issues
- Ask in discussions
- Create a question issue

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Appreciated! 🙏

Thank you for contributing! 🎉

