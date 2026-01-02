# Why You Need AI Code Validation

AI coding assistants are powerful, but they don't understand your project's architecture.

## Real Problems Developers Face

### ❌ AI violates layer boundaries  
Your AI assistant imports `database.ts` directly into your UI component, bypassing your service layer.

**Example**:
```typescript
// src/components/UserProfile.tsx
import { db } from '../../infrastructure/database'; // ❌ VIOLATION

// Should use:
import { UserService } from '../../services/user-service'; // ✅ CORRECT
```

### ❌ AI duplicates logic across modules  
The AI recreates authentication logic in 3 different places instead of using your existing `AuthService`.

### ❌ AI modifies protected code  
The AI "helpfully" refactors your critical payment processing logic without understanding the implications.

**Example**:
```typescript
// src/payments/stripe.ts
// #protected-start
export async function processPayment(amount: number) {
  // Critical payment logic - DO NOT MODIFY
  // This has been audited and tested
}
// #protected-end
```

### ❌ AI adds banned dependencies  
The AI suggests `moment.js` when your team has standardized on `date-fns`.

## Why Existing Tools Aren't Enough

- **ESLint**: Catches syntax and style issues, not architectural violations
- **TypeScript**: Enforces types, not module boundaries
- **Tests**: Validate behavior, not structure
- **Code Review**: Happens too late, after AI has already written the code

**Intent Guard validates BEFORE the code reaches your codebase.**

## The Cost of Architectural Violations

### Technical Debt
- Circular dependencies make refactoring impossible
- Tight coupling prevents testing
- Mixed concerns create maintenance nightmares

### Security Risks
- UI code accessing database directly bypasses security layers
- Protected authentication logic gets modified
- Secrets leak into wrong modules

### Team Productivity
- Code reviews become battles about architecture
- New developers don't understand the "rules"
- AI assistants keep making the same mistakes

## How Intent Guard Solves This

### 1. Preventive Validation
Catches violations **before** they enter your codebase, not during code review.

### 2. AI-Native Design
Designed specifically for AI-generated code. The AI can query rules and self-correct.

### 3. Just-In-Time Context
AI assistants can ask "What can this file import?" before generating code.

```bash
npx intent-guard rules-for src/domain/user.ts
# Returns: { "canImportFrom": [], "isProtected": false }
```

### 4. Self-Correcting Loop
```
AI generates code → Intent Guard validates → AI sees errors → AI fixes → Repeat until ✅
```

### 5. Architectural Memory
Tracks your architecture health over time. Detects drift automatically.

```bash
# First run
✅ No violations found!

# Later...
🚨 ARCHITECTURAL DRIFT DETECTED
Errors increased from 0 to 3
```

## Real-World Impact

### Before Intent Guard
- 🔴 AI imports database in React components
- 🔴 Protected payment logic gets refactored
- 🔴 Deprecated packages keep appearing
- 🔴 Architecture rules exist only in documentation

### After Intent Guard
- ✅ Layer boundaries enforced automatically
- ✅ Critical code protected from modification
- ✅ Banned dependencies blocked
- ✅ Architecture rules are executable code

## Who Benefits Most

### Teams Using AI Assistants
If your team uses Cursor, Copilot, or Windsurf, Intent Guard prevents AI from breaking your architecture.

### Projects with Clear Architecture
Clean Architecture, Hexagonal Architecture, Layered Architecture - Intent Guard enforces your chosen pattern.

### Growing Codebases
As your project grows, manual architecture enforcement becomes impossible. Intent Guard scales with you.

### Regulated Industries
FinTech, HealthTech, and other regulated industries need to protect critical code. Intent Guard provides automated enforcement.
