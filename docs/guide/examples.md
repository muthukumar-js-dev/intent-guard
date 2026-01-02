# Examples & Use Cases

Real-world examples of how to use Intent Guard in different project types and architectural patterns.

## Example 1: Next.js Application

### Project Structure
```
src/
  ├── pages/         (Next.js pages)
  ├── components/    (React components)
  ├── hooks/         (Custom React hooks)
  ├── lib/           (Utilities and helpers)
  └── types/         (TypeScript types)
```

### Configuration

```yaml
# .intentguard/intent.config.yaml
version: "1.0.0"

architecture:
  layers:
    - name: pages
      path: src/pages/**
      canImportFrom: [components, hooks, lib, types]
    
    - name: components
      path: src/components/**
      canImportFrom: [hooks, lib, types]
    
    - name: hooks
      path: src/hooks/**
      canImportFrom: [lib, types]
    
    - name: lib
      path: src/lib/**
      canImportFrom: [types]
    
    - name: types
      path: src/types/**
      canImportFrom: []

protectedRegions:
  - path: src/lib/auth/**
    reason: "Authentication logic"
    aiMutable: false

bannedDependencies:
  - package: moment
    reason: "Use date-fns for smaller bundle"
    alternatives: [date-fns]
```

## Example 2: Express.js API

### Project Structure
```
src/
  ├── routes/        (Express routes)
  ├── controllers/   (Request handlers)
  ├── services/      (Business logic)
  ├── repositories/  (Data access)
  ├── database/      (DB connection)
  ├── middleware/    (Express middleware)
  └── types/         (TypeScript types)
```

### Configuration

```yaml
version: "1.0.0"

architecture:
  layers:
    - name: routes
      path: src/routes/**
      canImportFrom: [controllers, middleware, types]
    
    - name: controllers
      path: src/controllers/**
      canImportFrom: [services, types]
    
    - name: services
      path: src/services/**
      canImportFrom: [repositories, types]
    
    - name: repositories
      path: src/repositories/**
      canImportFrom: [database, types]
    
    - name: database
      path: src/database/**
      canImportFrom: [types]
    
    - name: middleware
      path: src/middleware/**
      canImportFrom: [types]
    
    - name: types
      path: src/types/**
      canImportFrom: []

protectedRegions:
  - path: src/database/migrations/**
    reason: "Database migrations - require review"
    aiMutable: false
```

## Example 3: Clean Architecture

### Project Structure
```
src/
  ├── domain/          (Business entities and rules)
  ├── application/     (Use cases)
  ├── infrastructure/  (External services, DB)
  └── presentation/    (UI/API layer)
```

### Configuration

```yaml
version: "1.0.0"

# Clean Architecture Pattern
# Dependency Flow: Presentation → Application → Domain ← Infrastructure

architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []
      # Core layer, no dependencies - pure business logic
    
    - name: application
      path: src/application/**
      canImportFrom: [domain]
      cannotImportFrom: [infrastructure]
      # Application orchestrates domain logic
    
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [domain, application]
      # Infrastructure implements interfaces defined in domain
    
    - name: presentation
      path: src/presentation/**
      canImportFrom: [application, domain]
      # Presentation layer uses application services

protectedRegions:
  - path: src/domain/**
    reason: "Core business logic - requires careful review"
    aiMutable: false
```

## Example 4: React + TypeScript Monorepo

### Project Structure
```
packages/
  ├── app/           (Main application)
  ├── ui-kit/        (Design system)
  └── shared/
      ├── utils/     (Utilities)
      └── types/     (Shared types)
```

### Configuration

```yaml
version: "1.0.0"

architecture:
  layers:
    # App layer
    - name: app
      path: packages/app/src/**
      canImportFrom: [ui-kit, shared-utils, shared-types]
    
    # UI Kit (design system)
    - name: ui-kit
      path: packages/ui-kit/src/**
      canImportFrom: [shared-types]
    
    # Shared utilities
    - name: shared-utils
      path: packages/shared/utils/**
      canImportFrom: [shared-types]
    
    # Shared types
    - name: shared-types
      path: packages/shared/types/**
      canImportFrom: []

bannedDependencies:
  - pattern: "^lodash$"
    reason: "Use lodash-es for tree-shaking"
    alternatives: [lodash-es]
```

## Common Use Cases

### 1. Preventing Layer Violations

**Problem**: AI imports database code directly into React components

**Solution**:
```yaml
architecture:
  layers:
    - name: ui
      path: src/components/**
      canImportFrom: [hooks, utils]  # No database access
```

**Before**:
```typescript
// src/components/UserProfile.tsx
import { db } from '../../infrastructure/database'; // ❌ VIOLATION
```

**After**:
```typescript
// src/components/UserProfile.tsx
import { useUser } from '../../hooks/useUser'; // ✅ CORRECT
```

### 2. Enforcing Clean Architecture

**Problem**: Domain logic depends on infrastructure

**Solution**:
```yaml
architecture:
  layers:
    - name: domain
      path: src/domain/**
      canImportFrom: []  # Pure business logic
    
    - name: infrastructure
      path: src/infrastructure/**
      canImportFrom: [domain]  # Depends on domain, not vice versa
```

### 3. Protecting Critical Code

**Problem**: AI refactors payment processing logic

**Solution**:
```yaml
protectedRegions:
  - path: src/payments/**
    reason: "Payment logic requires security review"
    aiMutable: false
```

**Result**: Any modification to files in `src/payments/**` will be flagged.

### 4. Blocking Deprecated Packages

**Problem**: AI suggests old dependencies

**Solution**:
```yaml
bannedDependencies:
  - package: request
    reason: "Deprecated - use axios or fetch"
    alternatives: [axios, node-fetch]
  
  - package: moment
    reason: "Large bundle size - use date-fns"
    alternatives: [date-fns, dayjs]
```

## Advanced Patterns

### Feature-Based Architecture

```yaml
architecture:
  layers:
    - name: auth-feature
      path: src/features/auth/**
      canImportFrom: [shared-utils, shared-types]
    
    - name: user-feature
      path: src/features/user/**
      canImportFrom: [shared-utils, shared-types]
    
    - name: shared-utils
      path: src/shared/utils/**
      canImportFrom: [shared-types]
    
    - name: shared-types
      path: src/shared/types/**
      canImportFrom: []
```

### Hexagonal Architecture

```yaml
architecture:
  layers:
    - name: core
      path: src/core/**
      canImportFrom: []
      # Core domain - no external dependencies
    
    - name: ports
      path: src/ports/**
      canImportFrom: [core]
      # Interfaces for external systems
    
    - name: adapters
      path: src/adapters/**
      canImportFrom: [ports, core]
      # Implementations of ports
```

### Microservices Monorepo

```yaml
architecture:
  layers:
    - name: auth-service
      path: services/auth/**
      canImportFrom: [shared-libs]
    
    - name: user-service
      path: services/user/**
      canImportFrom: [shared-libs]
    
    - name: payment-service
      path: services/payment/**
      canImportFrom: [shared-libs]
    
    - name: shared-libs
      path: libs/**
      canImportFrom: []

protectedRegions:
  - path: services/payment/**
    reason: "Payment service - financial impact"
    aiMutable: false
```

## Configuration Tips

### Organizing Large Architectures

For complex projects, use descriptive layer names:

```yaml
architecture:
  layers:
    # Frontend layers
    - name: ui-components
      path: src/components/**
      canImportFrom: [ui-hooks, shared-types]
    
    - name: ui-hooks
      path: src/hooks/**
      canImportFrom: [api-client, shared-types]
    
    # Backend layers
    - name: api-routes
      path: src/routes/**
      canImportFrom: [business-logic, database]
    
    - name: business-logic
      path: src/services/**
      canImportFrom: [database, shared-types]
    
    - name: database
      path: src/db/**
      canImportFrom: [shared-types]
    
    # Shared
    - name: shared-types
      path: src/types/**
      canImportFrom: []
```

### Multiple Protected Regions

```yaml
protectedRegions:
  - path: src/config/**
    reason: "Environment configuration - requires security review"
    aiMutable: false
  
  - path: src/payments/**
    reason: "Payment processing - critical business logic"
    aiMutable: false
  
  - path: src/auth/**
    reason: "Authentication - security sensitive"
    aiMutable: false
```

### Banned Dependencies with Alternatives

```yaml
bannedDependencies:
  - package: moment
    reason: "Deprecated and large bundle size"
    alternatives: [date-fns, dayjs]
  
  - package: request
    reason: "Deprecated - no longer maintained"
    alternatives: [axios, node-fetch, got]
  
  - package: lodash
    reason: "Use lodash-es for tree-shaking"
    alternatives: [lodash-es]
  
  - pattern: "^@types/.*"
    reason: "Types should be in devDependencies"
    alternatives: []
```

## Testing Your Configuration

After creating your config, test it:

```bash
# 1. Run validation
npx intent-guard validate

# 2. Check for existing violations
# If violations exist, decide:
# - Fix the code to match architecture
# - Adjust rules to match reality

# 3. Test with --diff mode
git add .
npx intent-guard validate --diff

# 4. Iterate until you have the right balance
```
