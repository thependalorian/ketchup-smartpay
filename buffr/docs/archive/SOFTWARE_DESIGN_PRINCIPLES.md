# Software Design Principles

**Last Updated**: January 2025  
**Purpose**: Core principles for writing clean, maintainable, and robust code  
**Audience**: All developers working on Buffr

---

## 📋 Core Principles at a Glance

The table below summarizes the core ideas, common pitfalls, and how the principles interconnect.

| Principle | Core Idea | Common Pitfalls / Warning Signs | Related To |
| :--- | :--- | :--- | :--- |
| **KISS (Keep It Simple, Stupid)** | Designs and systems should be as simple as possible. Avoid unnecessary complexity. | Over-engineering, premature optimization, clever but unreadable code. | **Over-engineering**, **YAGNI**. |
| **DRY (Don't Repeat Yourself)** | "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system.". | Abstracting **coincidental duplication**, creating overly coupled and fragile "monster" modules. | **Duplication**, **Wrong Abstraction**. |
| **Boy Scout Rule** | "Leave the code cleaner than you found it.". | Letting **mess accumulation** create overwhelming technical debt; thinking cleanup requires a dedicated "refactoring sprint". | **Mess accumulation**, **Technical Debt**. |
| **Avoid Over-engineering** | Solve the problem you have today, not every possible future problem. | Automating non-repeated tasks, creating unnecessary abstractions, wrapping libraries without clear need. | **KISS**, **Unnecessary Refactor**. |
| **Prefer Duplication Over Wrong Abstraction** | A little duplication is cheaper than a bad abstraction that couples unrelated concepts. | Forcing different business concepts into one shared module because they look similar now. | **DRY**, **Over-engineering**. |
| **Ship Stable Code** | Focus on consistency, reliability, and incremental improvement to deliver user value predictably. | Large, risky changes that cause **regressions**; ignoring **bugs** and **debt** until they force a rewrite. | **Boy Scout Rule**, **KISS**. |

---

## 🔍 Key Principles Explained

### KISS (Keep It Simple, Stupid)

This principle, originally from U.S. Navy engineer Kelly Johnson, emphasizes that simple systems are more usable, maintainable, and less prone to errors. In practice, it means writing clear, straightforward code and avoiding "clever" solutions that are hard to understand. Overly complex code is difficult to debug, modify, and scale. The principle directly opposes over-engineering.

**Buffr Application:**
- Use straightforward API endpoints instead of complex middleware chains
- Prefer explicit error handling over abstract error frameworks
- Choose simple data structures that clearly represent business logic
- Avoid premature optimization that adds complexity

### DRY (Don't Repeat Yourself) & The Perils of the Wrong Abstraction

DRY is often misunderstood as "don't type the same thing twice." Its true goal is to centralize a single piece of **business knowledge or rule**. Applying DRY to **coincidental duplication**—where code looks the same but represents different concepts—leads to the "Wrong Abstraction." This creates a tightly coupled module full of conditional logic, making changes risky and expensive.

As software expert Sandi Metz advises, **"prefer duplication over the wrong abstraction."** Before consolidating code, ask: "Do these things change for the same reason?"

**Buffr Application:**
- ✅ **Good DRY**: Centralize payment validation logic (single business rule)
- ✅ **Good DRY**: Shared authentication middleware (single security concern)
- ❌ **Wrong Abstraction**: Forcing wallet operations and payment operations into one service because they both use the database
- ❌ **Wrong Abstraction**: Creating a generic "transaction handler" that handles payments, refunds, and disputes with complex conditionals

**Example:**
```typescript
// ❌ Wrong Abstraction - Forces unrelated concepts together
class TransactionHandler {
  process(type: 'payment' | 'refund' | 'dispute', data: any) {
    if (type === 'payment') { /* payment logic */ }
    else if (type === 'refund') { /* refund logic */ }
    else if (type === 'dispute') { /* dispute logic */ }
  }
}

// ✅ Better - Separate concerns, even if code looks similar
class PaymentService { processPayment(data: PaymentData) { } }
class RefundService { processRefund(data: RefundData) { } }
class DisputeService { processDispute(data: DisputeData) { } }
```

### The Boy Scout Rule & Fighting Mess Accumulation

The Boy Scout Rule advises developers to make small, positive improvements to any code they touch, just as scouts leave a campground cleaner. This is a defense against **mess accumulation**, where quick fixes and neglect degrade code quality into overwhelming technical debt. By continuously paying down debt in small increments, teams avoid costly, disruptive "refactoring sprints" and keep the codebase maintainable.

**Buffr Application:**
- When fixing a bug, also fix nearby code smells (unused imports, typos, unclear variable names)
- When adding a feature, refactor the function you're modifying if it's overly complex
- When reviewing code, suggest small improvements alongside approval
- Never leave code worse than you found it

**Example:**
```typescript
// You're fixing a bug in this function
async function processPayment(userId: string, amount: number) {
  // Fix the bug
  const user = await getUser(userId); // Was: getUsers(userId) - bug fix
  
  // Boy Scout Rule: Clean up while you're here
  if (!user) throw new Error('User not found'); // Add missing validation
  if (amount <= 0) throw new Error('Invalid amount'); // Add missing validation
  
  // Original logic continues...
}
```

### Over-engineering vs. Shipping Stable Code

**Over-engineering** involves building for hypothetical future needs, adding complexity without current benefit. Examples include automating one-off tasks or creating deep class hierarchies for simple needs. This violates **KISS** and hinders the goal of **shipping stable code**. Stability comes from simple, understandable foundations, consistent small improvements (Boy Scout Rule), and a focus on delivering reliable value.

**Buffr Application:**
- ❌ **Over-engineering**: Creating a generic "notification system" when you only need email notifications
- ❌ **Over-engineering**: Building a plugin architecture for payment providers when you only support one bank
- ✅ **Right-sized**: Simple email service that can be extended later
- ✅ **Right-sized**: Direct integration with Bank Windhoek API, abstract only when you add a second bank

**Example:**
```typescript
// ❌ Over-engineering - Generic framework for one use case
class NotificationFramework {
  registerProvider(provider: NotificationProvider) { }
  send(type: string, recipient: string, message: string) { }
  // Complex routing, retry logic, etc.
}

// ✅ Simple solution for current needs
class EmailService {
  async sendEmail(to: string, subject: string, body: string) {
    // Direct implementation
  }
}
// Can refactor to framework later if needed
```

---

## ⚖️ How to Balance These Principles in Practice

These principles form a complementary system:

1. **Start with KISS**: Build the simplest solution to your current, known problem.
   - Example: Direct API call instead of abstract service layer (until you need it)

2. **Apply the Boy Scout Rule daily**: As you add features, clean up nearby messes to prevent decay.
   - Example: Fix linting errors in files you modify
   - Example: Rename unclear variables while adding new code

3. **Be strategic with DRY**: Only abstract code when you are consolidating a single business rule or concept, not just similar-looking code. Use the "Rule of Three" (abstract on the third repetition) as a guideline.
   - Example: If you copy-paste payment validation 3 times, extract it
   - Example: Don't force wallet and payment services together just because they're similar

4. **Avoid over-engineering by asking**: 
   - "What is the simplest thing that could possibly work?"
   - "What problem am I actually solving today?"
   - "Will this abstraction make the code easier or harder to understand?"

5. **Aim for stable shipments**: This is the outcome of following the above principles—resulting in a codebase that is easier to test, debug, and extend with confidence.
   - Example: Small, focused PRs that are easy to review
   - Example: Incremental improvements that don't break existing functionality

---

## 🎯 Buffr-Specific Guidelines

### API Design
- **KISS**: Use RESTful conventions, avoid complex routing
- **DRY**: Share authentication/authorization middleware, not business logic
- **Boy Scout Rule**: Add input validation and error handling as you build endpoints

### Database Models
- **KISS**: Model the current requirements, not hypothetical future features
- **DRY**: Share common fields (timestamps, soft deletes) via base classes
- **Avoid Wrong Abstraction**: Don't force all models into a generic "entity" pattern

### Service Layer
- **KISS**: One service per domain (PaymentService, WalletService, UserService)
- **DRY**: Extract shared utilities (validation, formatting) into helper functions
- **Prefer Duplication**: Keep services independent even if they have similar patterns

### Error Handling
- **KISS**: Use standard HTTP status codes and clear error messages
- **Boy Scout Rule**: Add error handling as you encounter edge cases
- **Ship Stable Code**: Handle errors gracefully, don't crash the application

### Testing
- **KISS**: Write tests that are easy to read and understand
- **DRY**: Share test fixtures and utilities, not test logic
- **Ship Stable Code**: Test the happy path and critical error cases

---

## 📚 Additional Resources

For a deeper dive into specific examples:
- **Over-engineering examples in Code**: Real-world examples of unnecessary complexity
- **DRY vs. Wrong Abstraction**: Detailed guide on when to abstract and when to duplicate
- **Boy Scout Rule in Practice**: How to make incremental improvements part of your workflow

---

## ✅ Checklist for Code Reviews

When reviewing code, ask:

- [ ] Is this the simplest solution that works?
- [ ] Does this abstraction represent a single business concept?
- [ ] Are we solving today's problem or tomorrow's hypothetical problem?
- [ ] Is the code cleaner than when we started?
- [ ] Will this change make the codebase more or less stable?

---

**Document Maintained by**: Technical Team  
**Review Frequency**: Quarterly or when principles need clarification  
**Next Review**: April 2025
