# DNS Configuration for ketchup.cc

## SmartPay Connect Namibia G2P Voucher Platform

**Version:** 1.0  
**Date:** February 1, 2026  
**Status:** Ready for Implementation  
**Domain Registrar:** Namecheap  
**Hosting Platform:** Vercel (Frontend), Railway/Render (Backend)

---

## Table of Contents

1. [Overview](#overview)
2. [Current DNS Records](#current-dns-records)
3. [Proposed DNS Records](#proposed-dns-records)
4. [Subdomain Mapping](#subdomain-mapping)
5. [Namecheap Configuration](#namecheap-configuration)
6. [Vercel Configuration](#vercel-configuration)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [DNSSEC](#dnssec)
9. [Email Configuration](#email-configuration)
10. [Testing & Verification](#testing--verification)

---

## Overview

### Domain Information

| Attribute | Value |
|-----------|-------|
| **Domain** | ketchup.cc |
| **Registrar** | Namecheap |
| **Registration Date** | [User to fill] |
| **Expiration Date** | [User to fill] |
| **Auto-Renew** | Enabled |

### Application URLs

| Application | URL | Platform |
|-------------|-----|----------|
| **Main Website** | https://ketchup.cc | Vercel |
| **Ketchup Portal** | https://app.ketchup.cc | Vercel |
| **Government Portal** | https://gov.ketchup.cc | Vercel |
| **Agent Portal** | https://agents.ketchup.cc | Vercel |
| **API** | https://api.ketchup.cc | Railway |
| **Documentation** | https://docs.ketchup.cc | Vercel |
| **Status Page** | https://status.ketchup.cc | Vercel |

---

## Current DNS Records

### As of February 1, 2026

Based on Namecheap DNS management, the current records are:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | www | parkingpage.namecheap.com. | 30 min |
| URL Redirect | @ | http://www.ketchup.cc/ | Default |

### Issues with Current Configuration

| Issue | Impact | Resolution |
|-------|--------|------------|
| CNAME to parking page | Website not accessible | Update to Vercel |
| HTTP only (no HTTPS) | Security risk | Enable SSL |
| No subdomain records | Apps not accessible | Add A/CNAME records |
| No MX records | Email not configured | Add email records |

---

## Proposed DNS Records

### Required Records

#### 1. Apex Domain Records (A Records)

| Type | Host | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| A | @ | 76.76.21.21 | 1 hour | Vercel edge (apex) |
| A | @ | 76.76.21.241 | 1 hour | Vercel edge (backup) |

*Note: Vercel uses Anycast with multiple IPs. Use CNAME for subdomains, A records for apex.*

#### 2. Subdomain Records (CNAME)

| Type | Host | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| CNAME | www | cname.vercel-dns.com | 1 hour | Main website |
| CNAME | api | your-api.railway.app | 1 hour | Backend API |
| CNAME | app | cname.vercel-dns.com | 1 hour | Ketchup Portal |
| CNAME | gov | cname.vercel-dns.com | 1 hour | Government Portal |
| CNAME | agents | cname.vercel-dns.com | 1 hour | Agent Portal |
| CNAME | docs | cname.vercel-dns.com | 1 hour | Documentation |
| CNAME | status | cname.vercel-dns.com | 1 hour | Status Page |
| CNAME | * | cname.vercel-dns.com | 1 hour | Wildcard (future) |
| CNAME | buffr | cname.vercel-dns.com | 1 hour | Buffr Mobile Landing |

#### 3. TXT Records

| Type | Host | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| TXT | @ | v=spf1 include:spf.efwd.registrar-servers.com ~all | 1 hour | Email validation |
| TXT | @ | google-site-verification=XXXXX | 1 hour | Google Search Console |
| TXT | @ | vercel-domain-verification=XXXXX | 1 hour | Vercel ownership |

#### 4. MX Records (Email)

| Type | Host | Value | Priority | TTL | Purpose |
|------|------|-------|----------|-----|---------|
| MX | @ | mx1.privateemail.com | 10 | 1 hour | Primary mail |
| MX | @ | mx2.privateemail.com | 20 | 1 hour | Backup mail |

#### 5. CAA Records (SSL Certification)

| Type | Host | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| CAA | @ | 0 issue letsencrypt.org | 1 hour | Allow Let's Encrypt |
| CAA | @ | 0 issue comodoca.com | 1 hour | Allow Comodo |
| CAA | @ | 0 issue digicert.com | 1 hour | Allow DigiCert |

### Complete DNS Record Set

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        KETCHUP.CC DNS RECORDS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  APEX RECORDS                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  A     @     →  76.76.21.21         (Vercel edge)        TTL: 1 hour       │
│  A     @     →  76.76.21.241        (Vercel backup)      TTL: 1 hour       │
│                                                                             │
│  SUBDOMAINS                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  CNAME www     →  cname.vercel-dns.com              TTL: 1 hour            │
│  CNAME api     →  your-api.railway.app              TTL: 1 hour            │
│  CNAME app     →  cname.vercel-dns.com              TTL: 1 hour            │
│  CNAME gov     →  cname.vercel-dns.com              TTL: 1 hour            │
│  CNAME agents  →  cname.vercel-dns.com              TTL: 1 hour            │
│  CNAME docs    →  cname.vercel-dns.com              TTL: 1 hour            │
│  CNAME status  →  cname.vercel-dns.com              TTL: 1 hour            │
│  CNAME *       →  cname.vercel-dns.com              TTL: 1 hour (wildcard) │
│                                                                             │
│  TXT RECORDS                                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  TXT   @     →  v=spf1 include:spf.efwd.registrar-servers.com ~all         │
│  TXT   @     →  google-site-verification=XXXXX                             │
│  TXT   @     →  vercel-domain-verification=XXXXX                           │
│                                                                             │
│  MX RECORDS                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  MX    @     →  mx1.privateemail.com     (Priority: 10)                    │
│  MX    @     →  mx2.privateemail.com     (Priority: 20)                    │
│                                                                             │
│  CAA RECORDS                                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  CAA   @     →  0 issue letsencrypt.org                                    │
│  CAA   @     →  0 issue comodoca.com                                       │
│  CAA   @     →  0 issue digicert.com                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Subdomain Mapping

### Application Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KETCHUP.CC SUBDOMAIN MAP                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ketchup.cc                                     │
│                                   │                                          │
│         ┌─────────────────────────┼─────────────────────────┐               │
│         │                         │                         │               │
│         ▼                         ▼                         ▼               │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐         │
│  │   www       │          │   api       │          │   *         │         │
│  │ ketchup.cc  │          │ ketchup.cc  │          │ ketchup.cc  │         │
│  └─────────────┘          └─────────────┘          └─────────────┘         │
│         │                         │                         │               │
│         ▼                         ▼                         ▼               │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐         │
│  │   Vercel    │          │   Railway   │          │   Vercel    │         │
│  │  (Frontend) │          │  (Backend)  │          │  (Future)   │         │
│  └─────────────┘          └─────────────┘          └─────────────┘         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                      SPECIFIC SUBDOMAINS                          │     │
│  ├───────────────────────────────────────────────────────────────────┤     │
│  │                                                                       │     │
│  │   app.ketchup.cc     →  Ketchup Portal (Beneficiaries, Agents)       │     │
│  │   gov.ketchup.cc     →  Government Portal (Admins, Analysts)         │     │
│  │   agents.ketchup.cc  →  Agent Portal (Cash-out, Mobile Agents)       │     │
│  │   docs.ketchup.cc    →  Documentation (API docs, Guides)             │     │
│  │   status.ketchup.cc  →  System Status (Uptime monitoring)            │     │
│  │   api.ketchup.cc     →  REST API (Third-party integrations)          │     │
│  │   www.ketchup.cc     →  Main Website (Marketing, Landing)            │     │
│  │   ketchup.cc         →  Redirects to www (SEO)                       │     │
│  │                                                                       │     │
│  └───────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Subdomain Details

| Subdomain | Application | Framework | Hosting | Purpose |
|-----------|-------------|-----------|---------|---------|
| **www** | Marketing Site | Next.js | Vercel | Landing page, features |
| **app** | Ketchup Portal | React/Vite | Vercel | Main beneficiary app |
| **gov** | Government Portal | React/Vite | Vercel | Admin dashboard |
| **agents** | Agent Portal | React/Vite | Vercel | Agent operations |
| **api** | REST API | Node.js | Railway | Backend services |
| **docs** | Documentation | Docusaurus | Vercel | API docs, guides |
| **buffr** | Buffr Landing | Next.js | Vercel | Mobile app landing page |
| **status** | Status Page | Statusfy | Vercel | Uptime monitoring |

---

## Namecheap Configuration

### Step 1: Access DNS Management

1. Log in to [Namecheap](https://www.namecheap.com)
2. Go to **Domain List**
3. Click **Manage** next to `ketchup.cc`
4. Navigate to **Advanced DNS** tab

### Step 2: Delete Existing Records

Delete the following existing records:

| Type | Host | Action |
|------|------|--------|
| CNAME | www | Delete |
| URL Redirect | @ | Delete |

### Step 3: Add New Records

#### A Records (Apex Domain)

| Field | Value |
|-------|-------|
| Type | **A Record** |
| Host | **@** |
| Value | **76.76.21.21** |
| TTL | **Auto** |

Click **Add New Record** and add:

| Field | Value |
|-------|-------|
| Type | **A Record** |
| Host | **@** |
| Value | **76.76.21.241** |
| TTL | **Auto** |

#### CNAME Records (Subdomains)

**www:**

| Field | Value |
|-------|-------|
| Type | **CNAME Record** |
| Host | **www** |
| Value | **cname.vercel-dns.com** |
| TTL | **Auto** |

**api:**

| Field | Value |
|-------|-------|
| Type | **CNAME Record** |
| Host | **api** |
| Value | **[your-railway-app].railway.app** |
| TTL | **Auto** |

**app:**

| Field | Value |
|-------|-------|
| Type | **CNAME Record** |
| Host | **app** |
| Value | **cname.vercel-dns.com** |
| TTL | **Auto** |

**gov:**

| Field | Value |
|-------|-------|
| Type | **CNAME Record** |
| Host | **gov** |
| Value | **cname.vercel-dns.com** |
| TTL | **Auto** |

**agents:**

| Field | Value |
|-------|-------|
| Type | **CNAME Record** |
| Host | **agents** |
| Value | **cname.vercel-dns.com** |
| TTL | **Auto** |

**docs:**

| Field | Value |
|-------|-------|
| Type | **CNAME Record** |
| Host | **docs** |
| Value | **cname.vercel-dns.com** |
| TTL | **Auto** |

**status:**

| Field | Value |
|-------|-------|
| Type | **CNAME Record** |
| Host | **status** |
| Value | **cname.vercel-dns.com** |
| TTL | **Auto** |

**Wildcard:**

| Field | Value |
|-------|-------|
| Type | **CNAME Record** |
| Host | ***** |
| Value | **cname.vercel-dns.com** |
| TTL | **Auto** |

#### TXT Records

**SPF:**

| Field | Value |
|-------|-------|
| Type | **TXT Record** |
| Host | **@** |
| Value | **v=spf1 include:spf.efwd.registrar-servers.com ~all** |
| TTL | **Auto** |

**Google Verification:**

| Field | Value |
|-------|-------|
| Type | **TXT Record** |
| Host | **@** |
| Value | **google-site-verification=XXXXX** |
| TTL | **Auto** |

**Vercel Verification:**

| Field | Value |
|-------|-------|
| Type | **TXT Record** |
| Host | **@** |
| Value | **vercel-domain-verification=XXXXX** |
| TTL | **Auto** |

#### MX Records (Email)

**Primary:**

| Field | Value |
|-------|-------|
| Type | **MX Record** |
| Host | **@** |
| Value | **mx1.privateemail.com** |
| Priority | **10** |
| TTL | **Auto** |

**Backup:**

| Field | Value |
|-------|-------|
| Type | **MX Record** |
| Host | **@** |
| Value | **mx2.privateemail.com** |
| Priority | **20** |
| TTL | **Auto** |

#### CAA Records (SSL)

**Let's Encrypt:**

| Field | Value |
|-------|-------|
| Type | **CAA Record** |
| Host | **@** |
| Value | **0 issue letsencrypt.org** |
| TTL | **Auto** |

**Comodo:**

| Field | Value |
|-------|-------|
| Type | **CAA Record** |
| Host | **@** |
| Value | **0 issue comodoca.com** |
| TTL | **Auto** |

**DigiCert:**

| Field | Value |
|-------|-------|
| Type | **CAA Record** |
| Host | **@** |
| Value | **0 issue digicert.com** |
| TTL | **Auto** |

### Step 4: Save Changes

1. Click **Save All Changes**
2. Wait for DNS propagation (up to 48 hours, typically 5-30 minutes)

---

## Vercel Configuration

### Step 1: Add Domain to Vercel

1. Log in to [Vercel](https://vercel.com)
2. Navigate to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter `ketchup.cc`
5. Select project to attach

### Step 2: Configure for Each Project

#### ketchup-portal (Main App)

| Setting | Value |
|---------|-------|
| **Project** | ketchup-portal |
| **Production Domain** | app.ketchup.cc |
| **Framework** | Vite/Next.js |

#### government-portal

| Setting | Value |
|---------|-------|
| **Project** | government-portal |
| **Production Domain** | gov.ketchup.cc |
| **Framework** | Vite/Next.js |

#### Documentation

| Setting | Value |
|---------|-------|
| **Project** | docs |
| **Production Domain** | docs.ketchup.cc |
| **Framework** | Docusaurus |

### Step 3: Vercel Configuration File

Create `vercel.json` in each project:

**ketchup-portal/vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**government-portal/vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## SSL/TLS Configuration

### Automatic SSL (Vercel)

Vercel automatically provisions SSL certificates via Let's Encrypt:

| Feature | Status |
|---------|--------|
| **Certificate Type** | Let's Encrypt (free) |
| **Auto-Renewal** | Yes (60 days before expiry) |
| **HSTS** | Enabled |
| **HTTP/2** | Enabled |
| **HTTP/3** | Enabled |

### SSL Certificate Details

| Attribute | Value |
|-----------|-------|
| **Certificate Authority** | Let's Encrypt |
| **Algorithm** | RSA 2048 / ECDSA P-256 |
| **Valid From** | Auto-provisioned |
| **Valid Until** | 90 days (auto-renewed) |
| **Domains Covered** | ketchup.cc + all subdomains |

### Manual SSL Check

```bash
# Check SSL certificate
openssl s_client -connect ketchup.cc:443 -servername ketchup.cc

# Check all subdomains
for sub in www api app gov agents docs status; do
  echo "Checking $sub.ketchup.cc..."
  openssl s_client -connect "$sub.ketchup.cc:443" -servername "$sub.ketchup.cc" 2>/dev/null | openssl x509 -noout -dates
done
```

### Mixed Content Prevention

All Vercel projects automatically force HTTPS:

```javascript
// vite.config.ts (ketchup-portal)
export default defineConfig({
  server: {
    https: false
  },
  plugins: [
    react()
  ],
  build: {
    // Ensure assets use relative paths
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
```

---

## DNSSEC

### Current Status

| Attribute | Value |
|-----------|-------|
| **DNSSEC Status** | Not Enabled |
| **Recommended** | Enable |

### Enable DNSSEC in Namecheap

1. Go to **Domain List** → **Manage** → **Security**
2. Find **DNSSEC** section
3. Click **Enable DNSSEC**
4. Copy DS records provided

### DS Records (After Enabling)

| Algorithm | Digest Type | Digest | Status |
|-----------|-------------|--------|--------|
| 13 | 2 | [Generated by Namecheap] | Pending |

### DNSSEC Verification

```bash
# Check DNSSEC status
dig +short DNSKEY ketchup.cc

# Verify DNSSEC chain
dig +short DS ketchup.cc
```

---

## Email Configuration

### Email Service

We recommend **Namecheap Private Email** or **Google Workspace**:

| Service | Cost | Features |
|---------|------|----------|
| Private Email (Starter) | $9/year | 1 mailbox, 5GB |
| Private Email (Pro) | $24/year | 3 mailboxes, 50GB |
| Google Workspace | $6/user/month | Full G-Suite |

### Email Setup

**Incoming Mail (IMAP/POP3):**

| Setting | IMAP | POP3 |
|---------|------|------|
| Server | imap.privateemail.com | pop.privateemail.com |
| Port | 993 (SSL) | 995 (SSL) |
| Username | full email address | full email address |
| Password | email password | email password |

**Outgoing Mail (SMTP):**

| Setting | Value |
|---------|-------|
| Server | smtp.privateemail.com |
| Port | 587 (TLS) or 465 (SSL) |
| Username | full email address |
| Password | email password |

### Email Addresses to Create

| Email | Purpose | Forward To |
|-------|---------|------------|
| info@ketchup.cc | General inquiries | [Team email] |
| support@ketchup.cc | Customer support | support team |
| admin@ketchup.cc | Admin notifications | [Admin email] |
| noreply@ketchup.cc | System emails | - (auto) |
| agents@ketchup.cc | Agent support | support team |

### Email Forwarding Configuration

1. Go to Namecheap **Advanced DNS**
2. Find **Email Forwarding** section
3. Add forwarding rules:

| Type | Source | Destination |
|------|--------|-------------|
| Catch-All | @ketchup.cc | support@ketchup.cc |
| Specific | info@ketchup.cc | [Team email] |
| Specific | admin@ketchup.cc | [Admin email] |

---

## Testing & Verification

### DNS Propagation Check

```bash
# Check all DNS records
dig ketchup.cc ANY

# Check specific record types
dig ketchup.cc A
dig ketchup.cc CNAME
dig ketchup.cc TXT
dig ketchup.cc MX

# Check from different DNS resolvers
dig @8.8.8.8 ketchup.cc A    # Google
dig @1.1.1.1 ketchup.cc A    # Cloudflare
dig @9.9.9.9 ketchup.cc A    # Quad9
```

### Expected Results

| Record Type | Expected Value |
|-------------|----------------|
| A (@) | 76.76.21.21 or 76.76.21.241 |
| CNAME (www) | cname.vercel-dns.com |
| CNAME (api) | [your-app].railway.app |
| CNAME (app) | cname.vercel-dns.com |
| TXT (SPF) | v=spf1 include:spf.efwd.registrar-servers.com ~all |
| MX | mx1.privateemail.com |

### URL Accessibility Test

| URL | Expected Status | Method |
|-----|-----------------|--------|
| https://ketchup.cc | 200 | HTTP |
| https://www.ketchup.cc | 200 | HTTP |
| https://app.ketchup.cc | 200 | HTTP |
| https://gov.ketchup.cc | 200 | HTTP |
| https://api.ketchup.cc/health | 200 | API |
| https://docs.ketchup.cc | 200 | HTTP |
| https://status.ketchup.cc | 200 | HTTP |

### SSL Certificate Check

```bash
# Check SSL certificate details
echo | openssl s_client -servername ketchup.cc -connect ketchup.cc:443 2>/dev/null | openssl x509 -noout -subject -issuer -dates

# Expected output
subject=CN = ketchup.cc
issuer=C = US, O = Let's Encrypt, CN = R3
notBefore=[Date]
notAfter=[Date+90days]
```

### Performance Check

```bash
# Check response time
curl -s -o /dev/null -w "%{time_total}" https://ketchup.cc

# Check from multiple locations
curl -s -o /dev/null -w "%{time_total}" https://app.ketchup.cc --connect-timeout 5
```

---

## Troubleshooting

### Common Issues

#### Issue 1: DNS Not Propagating

| Symptom | Cannot access ketchup.cc |
|---------|-------------------------|
| **Cause** | DNS changes not propagated |
| **Solution** | Wait up to 48 hours, clear local DNS cache |

**Clear DNS Cache:**

```bash
# macOS
sudo dscacheutil -flushcache

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
```

#### Issue 2: SSL Certificate Not Issued

| Symptom | "Your connection is not private" |
|---------|----------------------------------|
| **Cause** | DNS not pointing to Vercel |
| **Solution** | Verify CNAME records point to cname.vercel-dns.com |

#### Issue 3: Subdomain Not Working

| Symptom | 404 error on subdomain |
|---------|------------------------|
| **Cause** | Subdomain not configured in Vercel |
| **Solution** | Add subdomain in Vercel project settings |

#### Issue 4: Email Not Working

| Symptom | Bounces or not receiving emails |
|---------|--------------------------------|
| **Cause** | MX records missing or incorrect |
| **Solution** | Verify MX records point to privateemail.com |

### DNS Troubleshooting Commands

```bash
# Full DNS lookup
dig ketchup.cc +trace

# Check nameserver delegation
dig NS ketchup.cc

# Verify CNAME chain
dig www.ketchup.cc +short

# Check TXT records
dig TXT ketchup.cc +short

# Email verification
dig MX ketchup.cc +short
```

---

## Maintenance Schedule

### Regular Checks

| Task | Frequency | Owner |
|------|-----------|-------|
| SSL certificate renewal | Monthly | Auto (Vercel) |
| DNS propagation check | Weekly | DevOps |
| Uptime monitoring | Daily | Monitoring |
| SSL security scan | Monthly | Security |

### Record Updates

| Change | Impact | Procedure |
|--------|--------|-----------|
| Add subdomain | Low | Add CNAME in Namecheap |
| Change hosting | Medium | Update records, wait propagation |
| Domain transfer | High | Update registrar, reconfigure DNS |
| SSL renewal | None | Automatic |

---

## References

### External Links

| Resource | URL |
|----------|-----|
| Namecheap DNS Docs | https://www.namecheap.com/support/knowledgebase/article.aspx/434/2208/dns-zone-management/ |
| Vercel Domains | https://vercel.com/docs/concepts/projects/custom-domains |
| DNS Propagation | https://www.verizon.com/support/knowledge-base-landing/ |

### Related Files

| File | Location |
|------|----------|
| Environment Variables | `apps/ketchup-portal/.env.local` |
| Environment Variables | `apps/government-portal/.env.local` |
| Backend Config | `backend/.env.local` |
| API Documentation | `docs/API.md` |

---

**Document Version:** 1.0  
**Last Updated:** February 1, 2026  
**Next Review:** March 1, 2026  
**Owner:** DevOps Team

**Contact:** devops@ketchup.cc

---

## Quick Reference Card

### DNS Record Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    KETCHUP.CC DNS QUICK REFERENCE               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  APEX:           A        @     →  76.76.21.21                 │
│  BACKUP:         A        @     →  76.76.21.241                │
│                                                                 │
│  WWW:            CNAME    www   →  cname.vercel-dns.com        │
│  API:            CNAME    api   →  [railway-app].railway.app   │
│  APP:            CNAME    app   →  cname.vercel-dns.com        │
│  GOV:            CNAME    gov   →  cname.vercel-dns.com        │
│  AGENTS:         CNAME    agents→  cname.vercel-dns.com        │
│  DOCS:           CNAME    docs  →  cname.vercel-dns.com        │
│  STATUS:         CNAME    status→  cname.vercel-dns.com        │
│  WILDCARD:       CNAME    *     →  cname.vercel-dns.com        │
│                                                                 │
│  EMAIL:          MX       @     →  mx1.privateemail.com (10)   │
│                  MX       @     →  mx2.privateemail.com (20)   │
│                                                                 │
│  VERIFICATION:   TXT      @     →  [vercel-verification]       │
│                  TXT      @     →  [google-verification]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Important URLs

| Service | URL |
|---------|-----|
| **Domain Registrar** | https://www.namecheap.com |
| **Vercel Dashboard** | https://vercel.com |
| **Railway Dashboard** | https://railway.app |
| **SSL Check** | https://ssl-checker.io |
| **DNS Check** | https://dnschecker.org |
