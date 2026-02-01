# Buffr Testing Guide

**Project**: Buffr Payment Application  
**Last Updated**: January 28, 2026

---

## Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## Test Structure

```
__tests__/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/            # End-to-end tests
```

---

## Writing Tests

### Unit Test Example

```typescript
import { calculateFee } from '@/utils/fees';

describe('Fee Calculation', () => {
  it('should calculate correct fee', () => {
    expect(calculateFee(100)).toBe(1.5);
  });
});
```

### Integration Test Example

```typescript
import { query } from '@/utils/db';

describe('Voucher Redemption', () => {
  it('should redeem voucher successfully', async () => {
    // Test database integration
  });
});
```

---

## Coverage Goals

- **Unit Tests**: 80%+
- **Integration Tests**: 70%+
- **E2E Tests**: Critical flows

---

**Status**: ✅ Test Suite Active  
**Coverage**: 65% (in progress)  
**Last Updated**: January 28, 2026
