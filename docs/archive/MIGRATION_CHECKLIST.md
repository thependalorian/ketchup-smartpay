# ✅ MIGRATION CHECKLIST

**SmartPay Connect - Modular Architecture Migration**

---

## PRE-MIGRATION

### Planning & Preparation
- [ ] Review complete refactoring plan
- [ ] Approve budget and timeline
- [ ] Assign team members to phases
- [ ] Setup project management board (Jira/Trello)
- [ ] Schedule kickoff meeting
- [ ] Create dedicated Slack channel
- [ ] Backup current production database
- [ ] Document current system state
- [ ] Identify critical dependencies
- [ ] Risk assessment completed

---

## PHASE 1: SETUP MONOREPO (Week 1-2)

### Directory Structure
- [ ] Create `apps/` directory
- [ ] Create `apps/ketchup-portal/` directory
- [ ] Create `apps/government-portal/` directory
- [ ] Create `packages/` directory
- [ ] Create `packages/ui/` directory
- [ ] Create `packages/types/` directory
- [ ] Create `packages/api-client/` directory
- [ ] Create `packages/utils/` directory
- [ ] Create `packages/config/` directory
- [ ] Create `docs/` directory structure
- [ ] Create `scripts/` directory

### Workspace Configuration
- [ ] Install PNPM globally
- [ ] Create `pnpm-workspace.yaml`
- [ ] Create root `package.json`
- [ ] Install Turborepo
- [ ] Create `turbo.json` configuration
- [ ] Configure Turborepo pipeline
- [ ] Test workspace command: `pnpm install`
- [ ] Test build command: `pnpm build`

### TypeScript Configuration
- [ ] Create `tsconfig.base.json`
- [ ] Configure path aliases for packages
- [ ] Create `tsconfig.json` for each package
- [ ] Test TypeScript compilation
- [ ] Verify path resolution working

### Git Configuration
- [ ] Update `.gitignore` for monorepo
- [ ] Create `.gitattributes` if needed
- [ ] Setup branch protection rules
- [ ] Create feature branch for migration

### Documentation
- [ ] Update root README.md
- [ ] Create CONTRIBUTING.md
- [ ] Create CODE_OF_CONDUCT.md
- [ ] Document workspace commands

**Phase 1 Sign-off:** [ ] Completed by: __________ Date: __________

---

## PHASE 2: EXTRACT SHARED PACKAGES (Week 2-3)

### @smartpay/ui Package
- [ ] Create package structure
- [ ] Move components from `src/components/ui/`
- [ ] Move 50+ UI components:
  - [ ] button.tsx
  - [ ] card.tsx
  - [ ] input.tsx
  - [ ] table.tsx
  - [ ] dialog.tsx
  - [ ] MetricCard.tsx
  - [ ] StatusBadge.tsx
  - [ ] (all other components)
- [ ] Create `index.ts` with exports
- [ ] Move `globals.css`
- [ ] Configure Tailwind CSS
- [ ] Create package.json
- [ ] Add dependencies
- [ ] Test build: `pnpm build --filter=@smartpay/ui`
- [ ] Test components render correctly

### @smartpay/types Package
- [ ] Create package structure
- [ ] Move types from `src/types/`
- [ ] Move types from `shared/types/`
- [ ] Create type definitions:
  - [ ] beneficiary.ts
  - [ ] voucher.ts
  - [ ] agent.ts
  - [ ] transaction.ts
  - [ ] compliance.ts
  - [ ] openBanking.ts
- [ ] Create Zod schemas for validation
- [ ] Create `index.ts` with exports
- [ ] Create package.json
- [ ] Test build: `pnpm build --filter=@smartpay/types`
- [ ] Verify types exported correctly

### @smartpay/api-client Package
- [ ] Create package structure
- [ ] Create base HTTP client
- [ ] Move API services from `src/services/`
- [ ] Create Ketchup API methods:
  - [ ] beneficiariesAPI
  - [ ] vouchersAPI
  - [ ] distributionAPI
  - [ ] agentsAPI
  - [ ] reconciliationAPI
  - [ ] webhooksAPI
- [ ] Create Government API methods:
  - [ ] complianceAPI
  - [ ] monitoringAPI
  - [ ] analyticsAPI
  - [ ] auditAPI
- [ ] Create Shared API methods:
  - [ ] dashboardAPI
  - [ ] openBankingAPI
- [ ] Add error handling
- [ ] Add retry logic
- [ ] Create `index.ts` with exports
- [ ] Create package.json
- [ ] Add dependencies (axios, etc.)
- [ ] Test build: `pnpm build --filter=@smartpay/api-client`
- [ ] Test API calls work

### @smartpay/utils Package
- [ ] Create package structure
- [ ] Extract utility functions
- [ ] Create formatters.ts:
  - [ ] formatCurrency
  - [ ] formatDate
  - [ ] formatPhone
  - [ ] formatPercentage
- [ ] Create validators.ts:
  - [ ] validateEmail
  - [ ] validatePhone
  - [ ] validateNationalID
- [ ] Create helpers.ts:
  - [ ] cn (className utility)
  - [ ] debounce
  - [ ] throttle
- [ ] Create `index.ts` with exports
- [ ] Create package.json
- [ ] Test build: `pnpm build --filter=@smartpay/utils`
- [ ] Test utilities work correctly

### @smartpay/config Package
- [ ] Create package structure
- [ ] Create env.ts for environment variables
- [ ] Create constants.ts for app constants
- [ ] Create feature flags configuration
- [ ] Create `index.ts` with exports
- [ ] Create package.json
- [ ] Test build: `pnpm build --filter=@smartpay/config`

### Verification
- [ ] All packages build successfully
- [ ] All packages have correct dependencies
- [ ] All packages export correctly
- [ ] Test importing packages in test app
- [ ] No circular dependencies

**Phase 2 Sign-off:** [ ] Completed by: __________ Date: __________

---

## PHASE 3: CREATE KETCHUP PORTAL (Week 3-4)

### Setup
- [ ] Initialize Vite project in `apps/ketchup-portal/`
- [ ] Install dependencies
- [ ] Configure Vite
- [ ] Configure TypeScript
- [ ] Configure Tailwind CSS
- [ ] Setup path aliases

### Copy Pages
- [ ] Copy and refactor Dashboard (Index.tsx)
- [ ] Copy and refactor Beneficiaries.tsx
- [ ] Copy and refactor Vouchers.tsx
- [ ] Copy and refactor BatchDistribution.tsx
- [ ] Copy and refactor StatusMonitor.tsx
- [ ] Copy and refactor WebhookMonitoring.tsx
- [ ] Copy and refactor Reconciliation.tsx
- [ ] Copy and refactor Agents.tsx
- [ ] Copy and refactor Regions.tsx
- [ ] Copy and refactor Analytics.tsx
- [ ] Copy and refactor GovernmentReports.tsx
- [ ] Copy and refactor Settings.tsx
- [ ] Copy and refactor Help.tsx

### Copy Components
- [ ] Copy dashboard components
- [ ] Copy layout components (Header, Sidebar)
- [ ] Copy open banking components
- [ ] Remove ProfileContext usage
- [ ] Remove ProfileRoute wrapper

### Update Imports
- [ ] Replace `@/components/ui/*` with `@smartpay/ui`
- [ ] Replace `@/types` with `@smartpay/types`
- [ ] Replace API imports with `@smartpay/api-client`
- [ ] Replace utils with `@smartpay/utils`
- [ ] Replace config with `@smartpay/config`

### Branding
- [ ] Update logo to Ketchup branding
- [ ] Update color scheme
- [ ] Update Header component
- [ ] Update Sidebar navigation
- [ ] Update favicon
- [ ] Update page titles

### Routing
- [ ] Setup React Router
- [ ] Create App.tsx with routes
- [ ] Remove profile switching logic
- [ ] Test all routes work

### Testing
- [ ] Test dev server: `pnpm dev --filter=ketchup-portal`
- [ ] Test all pages load
- [ ] Test navigation works
- [ ] Test API calls work
- [ ] Test forms work
- [ ] Test charts render
- [ ] Build production: `pnpm build --filter=ketchup-portal`
- [ ] Test production build works

**Phase 3 Sign-off:** [ ] Completed by: __________ Date: __________

---

## PHASE 4: CREATE GOVERNMENT PORTAL (Week 4-5)

### Setup
- [ ] Initialize Vite project in `apps/government-portal/`
- [ ] Install dependencies
- [ ] Configure Vite
- [ ] Configure TypeScript
- [ ] Configure Tailwind CSS (Government theme)
- [ ] Setup path aliases

### Copy Pages
- [ ] Copy and refactor GovernmentDashboard.tsx
- [ ] Copy and refactor GovernmentCompliance.tsx
- [ ] Copy and refactor GovernmentVouchers.tsx
- [ ] Copy and refactor GovernmentBeneficiaries.tsx
- [ ] Copy and refactor GovernmentAudit.tsx
- [ ] Copy and refactor GovernmentAnalytics.tsx
- [ ] Copy and refactor GovernmentAgents.tsx
- [ ] Copy and refactor GovernmentRegions.tsx
- [ ] Copy and refactor GovernmentReports.tsx
- [ ] Copy and refactor Settings.tsx
- [ ] Copy and refactor Help.tsx

### Create Components
- [ ] Create compliance widgets
- [ ] Create audit components
- [ ] Create analytics components
- [ ] Create monitoring components
- [ ] Create layout components (Header, Sidebar)

### Update Imports
- [ ] Replace `@/components/ui/*` with `@smartpay/ui`
- [ ] Replace `@/types` with `@smartpay/types`
- [ ] Replace API imports with `@smartpay/api-client`
- [ ] Replace utils with `@smartpay/utils`
- [ ] Replace config with `@smartpay/config`

### Branding
- [ ] Add Namibia government logo
- [ ] Apply government color scheme
- [ ] Update Header with "Ministry of Finance"
- [ ] Update Sidebar navigation
- [ ] Update favicon
- [ ] Update page titles

### Routing
- [ ] Setup React Router
- [ ] Create App.tsx with routes
- [ ] Remove profile switching logic
- [ ] Test all routes work

### Testing
- [ ] Test dev server: `pnpm dev --filter=government-portal`
- [ ] Test all pages load
- [ ] Test navigation works
- [ ] Test API calls work
- [ ] Test read-only access enforced
- [ ] Test charts render
- [ ] Build production: `pnpm build --filter=government-portal`
- [ ] Test production build works

**Phase 4 Sign-off:** [ ] Completed by: __________ Date: __________

---

## PHASE 5: REFACTOR BACKEND (Week 5-6)

### Route Segregation
- [ ] Create `backend/src/api/routes/ketchup/` directory
- [ ] Create `backend/src/api/routes/government/` directory
- [ ] Create `backend/src/api/routes/shared/` directory
- [ ] Move Ketchup routes:
  - [ ] beneficiaries.ts
  - [ ] vouchers.ts
  - [ ] distribution.ts
  - [ ] agents.ts
  - [ ] reconciliation.ts
  - [ ] webhooks.ts
- [ ] Move Government routes:
  - [ ] compliance.ts
  - [ ] monitoring.ts
  - [ ] audit.ts
  - [ ] analytics.ts
  - [ ] reports.ts
- [ ] Move Shared routes:
  - [ ] dashboard.ts
  - [ ] statusEvents.ts
  - [ ] openbanking/
- [ ] Update main router (index.ts)

### Authentication
- [ ] Create `ketchupAuth.ts` middleware
- [ ] Create `governmentAuth.ts` middleware
- [ ] Apply Ketchup auth to Ketchup routes
- [ ] Apply Government auth to Government routes
- [ ] Test authentication working

### Database Access
- [ ] Create read-only database user for Government
- [ ] Update Government services to use read-only connection
- [ ] Create audit logging for Government access
- [ ] Test database permissions

### API Documentation
- [ ] Document Ketchup API endpoints
- [ ] Document Government API endpoints
- [ ] Create OpenAPI spec
- [ ] Generate Postman collection

### Testing
- [ ] Test Ketchup routes work
- [ ] Test Government routes work
- [ ] Test authentication works
- [ ] Test read-only enforcement
- [ ] Test audit logging
- [ ] Run all backend tests

**Phase 5 Sign-off:** [ ] Completed by: __________ Date: __________

---

## PHASE 6: SETUP DEPLOYMENTS (Week 6-7)

### Vercel Projects
- [ ] Create Vercel project: smartpay-ketchup-portal
- [ ] Create Vercel project: smartpay-government-portal
- [ ] Create Vercel project: smartpay-backend-api
- [ ] Link projects to GitHub repository

### Domain Configuration
- [ ] Purchase/configure domain: smartpay-connect.com
- [ ] Add DNS records for subdomains
- [ ] Configure Vercel custom domain: ketchup.smartpay-connect.com
- [ ] Configure Vercel custom domain: gov.smartpay-connect.com
- [ ] Configure Vercel custom domain: api.smartpay-connect.com
- [ ] Setup SSL certificates (automatic via Vercel)
- [ ] Test domains resolve correctly

### Environment Variables
- [ ] Set Ketchup Portal env vars in Vercel:
  - [ ] VITE_API_URL
  - [ ] VITE_APP_NAME
  - [ ] VITE_ENVIRONMENT
- [ ] Set Government Portal env vars in Vercel:
  - [ ] VITE_API_URL
  - [ ] VITE_APP_NAME
  - [ ] VITE_ENVIRONMENT
- [ ] Set Backend env vars in Vercel:
  - [ ] DATABASE_URL
  - [ ] KETCHUP_API_KEY
  - [ ] GOVERNMENT_API_KEY
  - [ ] BUFFR_API_URL
  - [ ] BUFFR_API_KEY
  - [ ] (all other env vars)

### CI/CD Setup
- [ ] Create `.github/workflows/ketchup-portal.yml`
- [ ] Create `.github/workflows/government-portal.yml`
- [ ] Create `.github/workflows/backend.yml`
- [ ] Configure GitHub secrets
- [ ] Test CI/CD pipeline with test deployment
- [ ] Setup deployment notifications (Slack)

### Monitoring Setup
- [ ] Setup Sentry for error tracking
- [ ] Configure Sentry for Ketchup Portal
- [ ] Configure Sentry for Government Portal
- [ ] Configure Sentry for Backend
- [ ] Setup Vercel Analytics
- [ ] Setup Uptime Robot for monitoring
- [ ] Configure alert notifications

**Phase 6 Sign-off:** [ ] Completed by: __________ Date: __________

---

## PHASE 7: TESTING & VALIDATION (Week 7-8)

### Functional Testing - Ketchup Portal
- [ ] Test user login
- [ ] Test dashboard loads
- [ ] Test beneficiary management
- [ ] Test voucher creation
- [ ] Test batch distribution
- [ ] Test status monitoring
- [ ] Test webhook monitoring
- [ ] Test reconciliation
- [ ] Test agent management
- [ ] Test analytics
- [ ] Test reports generation
- [ ] Test open banking integration

### Functional Testing - Government Portal
- [ ] Test user login
- [ ] Test dashboard loads
- [ ] Test compliance overview
- [ ] Test voucher monitoring
- [ ] Test beneficiary registry
- [ ] Test audit reports
- [ ] Test financial analytics
- [ ] Test agent network status
- [ ] Test regional performance
- [ ] Test reports generation

### Integration Testing
- [ ] Test Ketchup → Backend API
- [ ] Test Government → Backend API
- [ ] Test Backend → Database
- [ ] Test Backend → Buffr API
- [ ] Test Backend → Bank APIs
- [ ] Test webhooks from Buffr
- [ ] Test open banking flow

### Performance Testing
- [ ] Measure Ketchup bundle size
- [ ] Measure Government bundle size
- [ ] Test page load times
- [ ] Test API response times
- [ ] Load test with 100 concurrent users
- [ ] Load test with 1000 concurrent users
- [ ] Test database query performance

### Security Testing
- [ ] Test authentication on all routes
- [ ] Test Ketchup access control
- [ ] Test Government read-only access
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Test CSRF protection
- [ ] Penetration testing
- [ ] Security audit completed

### Browser Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test on mobile Safari
- [ ] Test on mobile Chrome

### Accessibility Testing
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Test color contrast
- [ ] Test ARIA labels
- [ ] WCAG 2.1 AA compliance

### User Acceptance Testing
- [ ] Ketchup team UAT (5 users)
- [ ] Government team UAT (5 users)
- [ ] Collect feedback
- [ ] Address critical issues
- [ ] Retest after fixes

**Phase 7 Sign-off:** [ ] Completed by: __________ Date: __________

---

## PHASE 8: DOCUMENTATION & TRAINING (Week 8)

### Documentation
- [ ] Update root README.md
- [ ] Create KETCHUP_PORTAL.md
- [ ] Create GOVERNMENT_PORTAL.md
- [ ] Create API_DOCUMENTATION.md
- [ ] Create DEPLOYMENT_GUIDE.md
- [ ] Create TROUBLESHOOTING_GUIDE.md
- [ ] Update architecture diagrams
- [ ] Document environment setup
- [ ] Document build process
- [ ] Document deployment process

### User Guides
- [ ] Create Ketchup Portal User Guide
- [ ] Create Government Portal User Guide
- [ ] Create video tutorials
- [ ] Create FAQ document
- [ ] Create quick start guide

### Developer Guides
- [ ] Create developer onboarding guide
- [ ] Document codebase structure
- [ ] Document coding standards
- [ ] Create contribution guidelines
- [ ] Document testing procedures
- [ ] Document CI/CD pipeline

### Training Materials
- [ ] Create training presentation
- [ ] Create hands-on exercises
- [ ] Create certification test
- [ ] Prepare demo data

### Training Sessions
- [ ] Schedule Ketchup team training
- [ ] Conduct Ketchup team training (2 hours)
- [ ] Schedule Government team training
- [ ] Conduct Government team training (2 hours)
- [ ] Schedule dev team training
- [ ] Conduct dev team training (2 hours)
- [ ] Schedule support team training
- [ ] Conduct support team training (2 hours)
- [ ] Record training sessions

**Phase 8 Sign-off:** [ ] Completed by: __________ Date: __________

---

## PHASE 9: GO-LIVE & MONITORING (Week 9)

### Pre-Launch Checklist
- [ ] All tests passing
- [ ] All documentation complete
- [ ] All training complete
- [ ] Monitoring setup and tested
- [ ] Backup and recovery tested
- [ ] Rollback plan documented
- [ ] Support team ready
- [ ] Stakeholder approval obtained

### Launch Plan
- [ ] Day 1: Internal testing (both portals)
  - [ ] Ketchup team tests (5 users)
  - [ ] Government team tests (5 users)
  - [ ] Monitor errors
  - [ ] Fix critical issues
- [ ] Day 2-3: Pilot rollout (10% traffic)
  - [ ] Route 10% users to new portals
  - [ ] Monitor performance
  - [ ] Monitor errors
  - [ ] Collect user feedback
  - [ ] Address issues
- [ ] Day 4-5: Expanded rollout (50% traffic)
  - [ ] Route 50% users to new portals
  - [ ] Monitor performance
  - [ ] Monitor errors
  - [ ] Collect user feedback
  - [ ] Address issues
- [ ] Day 6-7: Full rollout (100% traffic)
  - [ ] Route 100% users to new portals
  - [ ] Monitor performance
  - [ ] Monitor errors
  - [ ] Collect user feedback
  - [ ] Address issues

### Monitoring
- [ ] Monitor error rates
- [ ] Monitor API response times
- [ ] Monitor database performance
- [ ] Monitor uptime (99.9% target)
- [ ] Monitor user activity
- [ ] Monitor security alerts
- [ ] Daily performance reports
- [ ] Weekly summary reports

### Support
- [ ] Support hotline active
- [ ] Slack support channel active
- [ ] Email support active
- [ ] Escalation process documented
- [ ] On-call rotation scheduled

### Post-Launch
- [ ] Collect user feedback (1 week)
- [ ] Address non-critical issues
- [ ] Optimize performance
- [ ] Update documentation
- [ ] Conduct retrospective
- [ ] Plan Phase 2 enhancements

**Phase 9 Sign-off:** [ ] Completed by: __________ Date: __________

---

## POST-MIGRATION

### Cleanup
- [ ] Decommission old system (after 2 weeks)
- [ ] Archive old codebase
- [ ] Update DNS records
- [ ] Remove old deployments
- [ ] Clean up unused resources
- [ ] Update billing

### Verification
- [ ] Verify all users migrated
- [ ] Verify all data migrated
- [ ] Verify all integrations working
- [ ] Verify performance metrics met
- [ ] Verify security requirements met
- [ ] Verify compliance requirements met

### Knowledge Transfer
- [ ] Document lessons learned
- [ ] Update runbooks
- [ ] Transfer knowledge to support team
- [ ] Transfer knowledge to dev team

### Celebration
- [ ] Team celebration event
- [ ] Stakeholder presentation
- [ ] Success announcement
- [ ] Recognize team contributions

---

## SIGN-OFFS

### Project Milestones
- [ ] Phase 1 Complete: __________ (Date)
- [ ] Phase 2 Complete: __________ (Date)
- [ ] Phase 3 Complete: __________ (Date)
- [ ] Phase 4 Complete: __________ (Date)
- [ ] Phase 5 Complete: __________ (Date)
- [ ] Phase 6 Complete: __________ (Date)
- [ ] Phase 7 Complete: __________ (Date)
- [ ] Phase 8 Complete: __________ (Date)
- [ ] Phase 9 Complete: __________ (Date)

### Final Approval
- [ ] Project Manager: __________ (Signature) __________ (Date)
- [ ] Tech Lead: __________ (Signature) __________ (Date)
- [ ] QA Lead: __________ (Signature) __________ (Date)
- [ ] Stakeholder: __________ (Signature) __________ (Date)

---

**🎉 MIGRATION COMPLETE! 🎉**

**Total Items:** 300+  
**Completed:** [ ] / 300+  
**Progress:** ____%

---

**Last Updated:** January 29, 2026  
**Document Version:** 1.0
