---
name: "source-command-quick-check"
description: "Migrated source command `quick-check`"
---

# source-command-quick-check

Use this skill when the user asks to run the migrated source command `quick-check`.

## Command Template

# Quick TypeScript Check

Fast TypeScript validation without full build. Use this instead of `npm run build` during development.

## Steps

1. Run TypeScript check with incremental compilation:

```bash
npx tsc --noEmit --incremental
```

2. If there are errors, report them to the user with file paths and line numbers.

3. If no errors, confirm: "TypeScript check passed. No type errors found."

## When to use

- After making changes to types/interfaces
- After adding new imports/exports
- Quick validation before committing
- When you want faster feedback than full build

## When to use full build instead

- Before creating PR (final verification)
- When you need to test production bundle
- When checking for build-time optimizations
