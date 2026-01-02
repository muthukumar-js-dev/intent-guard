# Best Practices

Here are some tips to get the most out of Intent Guard without over-complicating your workflow.

## 1. Start Simple

Don't try to map every single folder to a layer immediately. Start with broad strokes.

**✅ Good Starting Config:**
- `app` (Everything in UI)
- `core` (Business logic)
- `lib` (Utilities)

**❌ Over-engineered:**
- `components-buttons`
- `components-forms`
- `services-users`
- `services-auth`

Refine your layers only when you actually encounter meaningful architectural violations.

## 2. Use Meaningful Names

Layer names appear in error messages. Make them descriptive.

- `common` is vague. Is it helpful utilities or shared business logic?
- `shared-utils` or `domain-models` is clearer.

**Error Message:**
> "Layer 'user-profile' cannot import from 'admin-dashboard'"
> *(Instantly understandable)*

## 3. Integrate with CI Early

The best place to catch violations is in your CI pipeline.

Add a step to your GitHub Actions / GitLab CI:
```yaml
- name: Validate Architecture
  run: npx intent-guard validate
```

If you only run it locally, teammates (or their AI tools) might push violations that rot the architecture over time.

## 4. "Just-In-Time" Context for AI

When working with an AI IDE (Cursor, Windsurf), don't dump the whole config file into the chat.

Instead, instruct the AI to check rules **for the specific file it's editing**:

```bash
npx intent-guard rules-for src/my-file.ts
```

This returns a small, focused JSON object. It saves tokens and reduces AI hallucination.

## 5. Treat Config as Documentation

Add comments to your `intent.config.yaml`. It serves as a living document of your architectural decisions.

```yaml
- name: legacy-api
  path: src/legacy/**
  canImportFrom: []
  # TODO: We are migrating away from this.
  # Do not allow new code to depend on this layer.
```
