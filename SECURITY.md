# Security & Dependency Status

## Current Vulnerabilities (2025-12-17)

### Dev Dependencies (5 moderate - **NO PRODUCTION IMPACT**)
All vulnerabilities are in development tooling (esbuild, vite, vitest) and only affect the local dev server:

- **esbuild <=0.24.2**: Dev server CORS issue ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99))
  - **Impact**: Local dev server only; production builds unaffected
  - **Mitigation**: Don't expose dev server publicly; use `npm run build` for production
  - **Fix**: Upgrade to Vite 7+ (breaking change)

### Recommended Actions

1. **Short-term** (current setup):
   - ✅ Use `npm run build` + static hosting for production
   - ✅ Don't expose `npm run dev` server to internet
   - ⚠️ Accept dev-only risk for local development

2. **Medium-term** (when bandwidth allows):
   - Upgrade to Vite 7, Vitest 4, ESLint 9
   - Test compatibility with React 19
   - Update TailwindCSS 4 (if needed)

## Production Build Security

Production builds are **not affected** by these vulnerabilities:
- Static assets (`npm run build`) don't include dev server code
- esbuild is only used during build, not at runtime
- Vite dev server code is tree-shaken out of production bundle

## Dependency Update Strategy

**Current versions** (locked in package.json):
- React 18.3.1 (React 19 available)
- Vite 5.4.21 (Vite 7 available)
- Vitest 2.1.9 (Vitest 4 available)

**Update path**:
```bash
# When ready for breaking changes:
npm install vite@latest vitest@latest
npm install react@latest react-dom@latest @types/react@latest @types/react-dom@latest
npm run test && npm run test:e2e
npm run build
```

## Notes
- All 5 vulnerabilities trace back to esbuild in Vite's dependency tree
- Dev server is only used locally; production uses static build
- `npm audit fix --force` would upgrade to Vite 7 (breaking changes)
