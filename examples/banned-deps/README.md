# Banned Dependencies Example

This project demonstrates how to ban specific dependencies.
- **Rules**: `lodash` is banned.
- **Violation**: `src/api/handler.ts` imports `lodash`.

Run `intent-guard validate` (or rules-for) to see the warning.
