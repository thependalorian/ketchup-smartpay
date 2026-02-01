# Mobile Development Setup

**Purpose**: Quick reference for mobile app development setup  
**Last Updated**: 2026-01-17

---

## iOS Development

**Status**: ✅ Ready

**Setup**:
- 5 simulators available
- CocoaPods installed
- Native modules linked
- App running on iOS (confirmed)

**Documentation**: See `docs/IOS_SETUP.md` for detailed setup guide

---

## Android Development

**Status**: ⏸️ Deferred

**Reason**: Storage constraints (focusing on iOS first)

**Configuration**: Complete (ready when needed)

**Documentation**: See `docs/ANDROID_SETUP.md` for setup guide

---

## Development Commands

```bash
# Start development server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser

# Build for production
eas build --platform ios
eas build --platform android
```

---

## API Integration

**Gateway Client**: `utils/gatewayClient.ts`

```typescript
import gateway from '@/utils/gatewayClient';

// Make API request
const data = await gateway.nextjs.get('/api/users/me', { authToken: token });
```

---

**For detailed setup instructions, see `docs/IOS_SETUP.md` and `docs/ANDROID_SETUP.md`**
