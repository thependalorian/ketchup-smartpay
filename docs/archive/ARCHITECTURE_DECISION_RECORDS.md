# 📋 ARCHITECTURE DECISION RECORDS (ADRs)

**Ketchup SmartPay - Modular Architecture**

---

## ADR-001: Adopt Monorepo Architecture

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Frontend Lead, Backend Lead

### Context
Ketchup SmartPay currently has a monolithic frontend with mixed Ketchup and Government pages. This creates maintenance challenges, deployment coupling, and larger bundle sizes.

### Decision
Adopt a monorepo architecture using PNPM workspaces and Turborepo to manage multiple applications (Ketchup Portal, Government Portal) and shared packages.

### Consequences

**Positive:**
- Independent deployment of portals
- Shared packages reduce code duplication
- Better code organization
- Team can work independently
- Smaller bundle sizes per portal

**Negative:**
- Initial migration effort required
- Learning curve for monorepo tooling
- More complex build configuration

**Neutral:**
- Need to maintain workspace configuration
- Build caching strategy required

---

## ADR-002: Separate Ketchup and Government Frontends

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Product Manager, Stakeholders

### Context
Current system uses ProfileContext to switch between Ketchup and Government views. This creates complexity and bundles both applications together.

### Decision
Create two separate frontend applications:
1. **Ketchup Portal:** For operational staff (create, update, distribute)
2. **Government Portal:** For oversight staff (monitor, audit, report)

### Consequences

**Positive:**
- Clear separation of concerns
- Smaller, focused bundles
- Independent deployment schedules
- Different branding per portal
- Simplified authentication per portal

**Negative:**
- Need to extract shared components into packages
- Duplicate some configuration
- More deployment targets to manage

**Neutral:**
- Two separate Vercel projects
- Two separate domains

---

## ADR-003: Use Shared Packages for Common Code

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Frontend Lead

### Context
Both portals will need common UI components, types, API clients, and utilities. Need to avoid code duplication.

### Decision
Create shared packages in the monorepo:
- `@smartpay/ui` - Reusable UI components
- `@smartpay/types` - TypeScript types and Zod schemas
- `@smartpay/api-client` - Unified API client
- `@smartpay/utils` - Utility functions
- `@smartpay/config` - Shared configuration

### Consequences

**Positive:**
- Single source of truth for shared code
- Easier to maintain consistency
- Changes propagate to both portals
- Proper versioning of shared code

**Negative:**
- Need to extract and organize existing code
- Package versioning complexity
- Potential for breaking changes across apps

**Neutral:**
- Need build pipeline for packages
- Package publishing to NPM (optional, future)

---

## ADR-004: Keep Backend Unified with Route Segregation

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Backend Lead

### Context
Backend serves both Ketchup and Government portals. Need to decide between separate backends or unified backend with route segregation.

### Decision
Keep a single unified backend but segregate routes by prefix:
- `/api/v1/ketchup/*` - Ketchup-specific routes
- `/api/v1/government/*` - Government-specific routes
- `/api/v1/shared/*` - Shared routes

### Rationale
- Single database (216 tables) already exists
- Business logic is largely shared
- Route segregation provides logical separation
- Easier to manage authentication and permissions
- Reduces infrastructure complexity

### Consequences

**Positive:**
- Single database to maintain
- Shared business logic
- Simpler deployment
- Lower infrastructure costs
- Easier to ensure data consistency

**Negative:**
- Routes in same codebase
- Need careful authentication per route group
- Potential for cross-contamination if not careful

**Neutral:**
- Single backend deployment
- Route-level middleware for auth

---

## ADR-005: Government Portal Read-Only by Default

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Security Lead, Compliance Officer

### Context
Government portal is for oversight, not operations. Need to enforce read-only access to prevent accidental or unauthorized modifications.

### Decision
Implement read-only access for Government portal:
- Use read-only database user for Government queries
- Implement audit logging for all Government access
- Allow exceptions for specific admin actions (with extra auth)

### Consequences

**Positive:**
- Enhanced security
- Compliance with separation of duties
- Audit trail for all Government access
- Prevents accidental modifications

**Negative:**
- Need to maintain separate database users
- More complex permission logic
- Some legitimate write operations need special handling

**Neutral:**
- Audit logs require storage and monitoring

---

## ADR-006: Use Turborepo for Build Orchestration

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, DevOps Lead

### Context
Monorepo with multiple apps and packages needs efficient build orchestration. Options: Nx, Turborepo, Lerna.

### Decision
Use Turborepo for build orchestration.

### Rationale
- Fast incremental builds with caching
- Simple configuration
- Good Vercel integration
- Active development and support
- Lower learning curve than Nx

### Consequences

**Positive:**
- Fast builds with caching
- Clear dependency graph
- Parallel builds
- Simple configuration

**Negative:**
- Less feature-rich than Nx
- Newer tool (less battle-tested)

**Neutral:**
- Need to configure turbo.json
- Cache storage strategy

---

## ADR-007: Independent Vercel Deployments per Portal

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, DevOps Lead

### Context
Need to deploy Ketchup and Government portals independently. Options: single deployment with routing, separate deployments.

### Decision
Create separate Vercel projects for each portal:
- `smartpay-ketchup-portal` → ketchup.ketchup-smartpay.com
- `smartpay-government-portal` → gov.ketchup-smartpay.com
- `smartpay-backend-api` → api.ketchup-smartpay.com

### Consequences

**Positive:**
- Independent deployment schedules
- No risk of breaking both portals
- Different environment variables per portal
- Separate analytics per portal
- Can scale independently

**Negative:**
- More Vercel projects to manage
- More domains to configure
- Slightly higher infrastructure costs

**Neutral:**
- Three CI/CD pipelines
- Three sets of environment variables

---

## ADR-008: Use PNPM for Package Management

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Frontend Lead

### Context
Monorepo requires efficient package management. Options: NPM workspaces, Yarn workspaces, PNPM workspaces.

### Decision
Use PNPM for package management.

### Rationale
- Fast and efficient (symlinks)
- Built-in workspace support
- Strict dependency resolution
- Saves disk space
- Better than NPM for monorepos

### Consequences

**Positive:**
- Fast installs
- Disk space savings
- Strict dependency graph
- Good workspace support

**Negative:**
- Team needs to install PNPM
- Different from NPM/Yarn (learning curve)
- Some tools may not support PNPM

**Neutral:**
- Need to update CI/CD to use PNPM

---

## ADR-009: Maintain Existing Tech Stack (React + Vite + Tailwind)

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Frontend Lead

### Context
Current stack is React + Vite + Tailwind + DaisyUI. Need to decide whether to change for new architecture.

### Decision
Maintain existing tech stack for both portals:
- React 18 + TypeScript
- Vite for builds
- Tailwind CSS + DaisyUI
- React Query
- React Router

### Rationale
- Team is familiar with current stack
- Stack is working well
- Migration already complex enough
- No compelling reason to change
- Reduces migration risk

### Consequences

**Positive:**
- No additional learning curve
- Faster migration
- Proven stack
- Existing components work as-is

**Negative:**
- Miss opportunity to adopt newer tech

**Neutral:**
- Can upgrade versions as needed

---

## ADR-010: Implement Progressive Rollout Strategy

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Product Manager, Stakeholders

### Context
Need a safe rollout strategy for new architecture. Options: big bang, phased rollout, canary deployment.

### Decision
Implement progressive rollout over 7 days:
- Day 1: Internal testing (10 users)
- Day 2-3: Pilot (10% users)
- Day 4-5: Expanded (50% users)
- Day 6-7: Full rollout (100% users)

### Consequences

**Positive:**
- Lower risk
- Can identify issues early
- Time to fix issues before full rollout
- Users can provide feedback
- Can rollback if needed

**Negative:**
- Takes longer to complete
- Need traffic routing mechanism
- Need to support both systems during rollout

**Neutral:**
- Old system kept available for 2 weeks

---

## ADR-011: Use Route-Based Authentication Strategy

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Security Lead

### Context
Need different authentication for Ketchup vs Government routes. Options: JWT with roles, separate API keys, route-based middleware.

### Decision
Implement route-based authentication:
- Ketchup routes: `ketchupAuth` middleware
- Government routes: `governmentAuth` middleware
- Separate API keys per portal

### Consequences

**Positive:**
- Clear separation
- Easy to audit access
- Can apply different rules per portal
- Simple to implement

**Negative:**
- Need to manage two sets of credentials
- More middleware complexity

**Neutral:**
- Authentication still uses JWT
- Can add rate limiting per portal

---

## ADR-012: Maintain 216-Table Database Schema

**Date:** January 29, 2026  
**Status:** ✅ Accepted  
**Deciders:** Tech Lead, Database Lead

### Context
Existing database has 216 tables with complex relationships. Need to decide whether to refactor schema or keep as-is.

### Decision
Keep existing database schema unchanged during migration.

### Rationale
- Schema is well-designed and working
- 100% PSD compliant
- Migration is already complex
- No performance issues
- Risk of breaking compliance

### Consequences

**Positive:**
- No database migration needed
- Zero downtime for database
- No risk of data loss
- Compliance maintained

**Negative:**
- Can't optimize schema during migration

**Neutral:**
- Can optimize schema in future

---

## SUMMARY OF DECISIONS

| ADR | Decision | Status | Impact |
|-----|----------|--------|--------|
| 001 | Monorepo Architecture | ✅ Accepted | High |
| 002 | Separate Frontends | ✅ Accepted | High |
| 003 | Shared Packages | ✅ Accepted | High |
| 004 | Unified Backend | ✅ Accepted | Medium |
| 005 | Read-Only Government | ✅ Accepted | High |
| 006 | Turborepo | ✅ Accepted | Medium |
| 007 | Independent Deployments | ✅ Accepted | High |
| 008 | PNPM | ✅ Accepted | Medium |
| 009 | Keep Tech Stack | ✅ Accepted | Low |
| 010 | Progressive Rollout | ✅ Accepted | High |
| 011 | Route Auth | ✅ Accepted | Medium |
| 012 | Keep DB Schema | ✅ Accepted | Low |

---

## FUTURE ADRs (To Be Decided)

### ADR-013: Micro-Frontend Architecture (Future)
**Status:** 🔍 Under Consideration  
Consider adopting micro-frontend architecture if portals grow significantly in complexity.

### ADR-014: API Gateway (Future)
**Status:** 🔍 Under Consideration  
Consider adding API Gateway (Kong, AWS API Gateway) if need advanced features like rate limiting, caching, transformations.

### ADR-015: GraphQL vs REST (Future)
**Status:** 🔍 Under Consideration  
Consider adopting GraphQL for Government portal if complex data fetching requirements emerge.

### ADR-016: Real-time Updates (Future)
**Status:** 🔍 Under Consideration  
Consider WebSocket or Server-Sent Events for real-time dashboard updates if polling becomes inefficient.

---

## DECISION PROCESS

### How to Propose an ADR
1. Create new ADR with sequential number
2. Use template format
3. Present to tech team
4. Discuss trade-offs
5. Make decision
6. Document decision
7. Implement decision

### ADR Template

```markdown
## ADR-XXX: [Title]

**Date:** [Date]  
**Status:** [Proposed / Accepted / Rejected / Superseded]  
**Deciders:** [Names]

### Context
[What is the issue that we're seeing that is motivating this decision or change?]

### Decision
[What is the change that we're proposing and/or doing?]

### Consequences

**Positive:**
- [Good consequence 1]
- [Good consequence 2]

**Negative:**
- [Bad consequence 1]
- [Bad consequence 2]

**Neutral:**
- [Neutral consequence 1]
```

---

**Last Updated:** January 29, 2026  
**Document Version:** 1.0

---

**📋 Architecture Decisions Drive System Quality**
