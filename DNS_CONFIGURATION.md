# DNS Configuration Guide for ketchup.cc

## Domain Overview
**Main Domain:** ketchup.cc

## Recommended Subdomain Structure

### 1. Main Websites
| Subdomain | Type | Target | Purpose |
|-----------|------|--------|---------|
| @ (root) | A | Vercel deployment IP | Main domain redirect |
| www | CNAME | cname.vercel-dns.com | Ketchup Portal (ketchup-portal) |

### 2. Application Subdomains
| Subdomain | Type | Target | Purpose |
|-----------|------|--------|---------|
| app | CNAME | cname.vercel-dns.com | Main application portal |
| portal | CNAME | cname.vercel-dns.com | Alternative portal access |
| www | CNAME | cname.vercel-dns.com | Main website |

### 3. API Subdomains
| Subdomain | Type | Target | Purpose |
|-----------|------|--------|---------|
| api | CNAME | cname.vercel-dns.com | Backend API |
| api-dev | CNAME | cname.vercel-dns.com | Development API |

### 4. Government Portal
| Subdomain | Type | Target | Purpose |
|-----------|------|--------|---------|
| gov | CNAME | cname.vercel-dns.com | Government Portal |
| government | CNAME | cname.vercel-dns.com | Government Portal (alternative) |
| admin | CNAME | cname.vercel-dns.com | Admin Dashboard |

### 5. Development & Staging
| Subdomain | Type | Target | Purpose |
|-----------|------|--------|---------|
| dev | CNAME | cname.vercel-dns.com | Development environment |
| staging | CNAME | cname.vercel-dns.com | Staging environment |
| test | CNAME | cname.vercel-dns.com | Testing environment |

### 6. Utility Subdomains
| Subdomain | Type | Target | Purpose |
|-----------|------|--------|---------|
| mail | MX | mail server | Email routing |
| smtp | CNAME | mail server | SMTP services |
| docs | CNAME | cname.vercel-dns.com | Documentation |
| status | CNAME | cname.vercel-dns.com | Status page |

## Namecheap DNS Configuration

### Current Records (to be updated)
```
Type          Host          Value                              TTL
CNAME Record  www           parkingpage.namecheap.com.         30 min
URL Redirect  @             http://www.ketchup.cc/             -
```

### Recommended Records
```
Type          Host          Value                              TTL
A Record      @             76.76.21.21                        Automatic
CNAME Record  www           cname.vercel-dns.com.              Automatic
CNAME Record  api           cname.vercel-dns.com.              Automatic
CNAME Record  app           cname.vercel-dns.com.              Automatic
CNAME Record  portal        cname.vercel-dns.com.              Automatic
CNAME Record  gov           cname.vercel-dns.com.              Automatic
CNAME Record  government    cname.vercel-dns.com.              Automatic
CNAME Record  admin         cname.vercel-dns.com.              Automatic
CNAME Record  dev           cname.vercel-dns.com.              Automatic
CNAME Record  staging       cname.vercel-dns.com.              Automatic
TXT Record    @             v=spf1 include:spf.efwd.registrar-servers.com ~all    Automatic
```

## Environment Variables Update Required

Update your `.env` files to use the new domain:

### Backend (.env)
```env
# Update API URL
VITE_API_URL=https://api.ketchup.cc

# Keep existing configurations
KETCHUP_SMARTPAY_API_URL=https://api.ketchup.cc
```

### Frontend - Ketchup Portal (.env)
```env
VITE_API_URL=https://api.ketchup.cc
VITE_APP_URL=https://ketchup.cc
```

### Frontend - Government Portal (.env)
```env
VITE_API_URL=https://api.ketchup.cc
VITE_APP_URL=https://gov.ketchup.cc
```

## Vercel Project Configuration

### ketchup-portal Project Settings
```
Production: ketchup.cc or www.ketchup.cc
Framework: Vite
Build Command: pnpm build --filter=ketchup-portal
Output Directory: apps/ketchup-portal/dist
```

### government-portal Project Settings
```
Production: gov.ketchup.cc or government.ketchup.cc
Framework: Vite
Build Command: pnpm build --filter=government-portal
Output Directory: apps/government-portal/dist
```

## Deployment Commands

### Deploy Ketchup Portal
```bash
cd apps/ketchup-portal
pnpm build
vercel --prod
```

### Deploy Government Portal
```bash
cd apps/government-portal
pnpm build
vercel --prod --yes
```

## SSL/TLS Configuration

All subdomains will automatically get SSL certificates from Vercel's Edge Network when configured with CNAME records pointing to `cname.vercel-dns.com`.

## Email Configuration (Optional)

If using email services:
```
Type    Host     Value                              TTL
MX      @        mail.ketchup.cc                    Automatic
MX      @        alt.mail.ketchup.cc                Automatic
TXT     @        v=spf1 include:_spf.mail.ketchup.cc ~all    Automatic
TXT     mail._domainkey  v=DKIM1; k=rsa; p=...     Automatic
```

## Verification Steps

1. **Check DNS Propagation**
   ```bash
   dig ketchup.cc
   dig api.ketchup.cc
   dig www.ketchup.cc
   ```

2. **Verify SSL Certificates**
   ```bash
   openssl s_client -connect ketchup.cc:443 -servername ketchup.cc
   ```

3. **Test Application Access**
   - https://ketchup.cc (main portal)
   - https://api.ketchup.cc (API endpoint)
   - https://gov.ketchup.cc (government portal)

## Rollback Plan

If issues arise, you can revert to the original DNS settings at Namecheap:
```
Type          Host          Value                              TTL
CNAME Record  www           parkingpage.namecheap.com.         30 min
URL Redirect  @             http://www.ketchup.cc/             -
```

## Support

For DNS issues, contact Namecheap support or refer to:
- Vercel DNS Documentation: https://vercel.com/docs/concepts/projects/custom-domains
- Namecheap Knowledge Base: https://www.namecheap.com/support/knowledgebase/
