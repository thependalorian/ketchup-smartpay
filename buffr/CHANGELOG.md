# Changelog

All notable changes to the Buffr Payment Companion project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with 336 passing tests
- Test coverage across 10 major modules
- Build status badges in README
- Migration files for database schema management
- TypeScript types for database entities (types/database.ts)
- Schema verification script (scripts/verify-schema.ts)
- Migration runner script (scripts/run-schema-fixes.ts)

### Fixed
- **LARGE_Layout Build Error** - Fixed undefined `LARGE_Layout` reference in 3 files:
  - `app/request-money/confirm.tsx` (lines 198, 201)
  - `app/request-money/enter-amount.tsx` (lines 223, 226, 229, 282)
  - `app/requests/[id].tsx` (line 287)
  - Changed to correct constant: `Layout.LARGE_SECTION_SPACING`
- **Missing Dependencies** - Installed and verified:
  - expo-notifications v0.32.16
  - expo-secure-store v15.0.8
  - expo-device
  - expo-constants v18.0.12
  - expo-image-picker v17.0.10
- **Metro Bundler** - Cleared cache and resolved module resolution issues

### Changed
- Updated README.md with current test status and badges
- Updated PRODUCTION_REMEDIATION_PLAN.md with January 2026 progress

## [1.0.0] - 2025-12-18

### Added
- Initial release of Buffr Payment Companion
- React Native mobile application (iOS, Android, Web)
- Neon PostgreSQL serverless database
- JWT authentication system
- Payment processing with Adumo integration
- Multi-wallet system
- Group savings features
- AI-powered financial assistance
- Comprehensive compliance implementation (PSD-1, PSD-3, PSD-12, FIMA, ETA 2019)
- Security features (2FA, encryption, rate limiting)
- CI/CD pipeline configuration
- Deployment configurations (Vercel, Railway, Render)
- Complete documentation suite

### Security
- Implemented JWT authentication throughout application
- Added admin role-based access control
- Removed development fallback authentication
- Added security headers and rate limiting
- Created security audit scripts

---

## Versioning Guide

- **Major version** (X.0.0): Breaking changes, major feature releases
- **Minor version** (0.X.0): New features, backwards compatible
- **Patch version** (0.0.X): Bug fixes, security patches

## Links

- [Production Remediation Plan](./PRODUCTION_REMEDIATION_PLAN.md)
- [Setup Documentation](./SETUP_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Implementation Status](./SECURITY_IMPLEMENTATION_STATUS.md)
