# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> landing page renders key navigation
- Location: tests/e2e/smoke.spec.ts:3:1

# Error details

```
Error: page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at http://127.0.0.1:5173/
Call log:
  - navigating to "http://127.0.0.1:5173/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e6]:
  - heading "127.0.0.1 is blocked" [level=1] [ref=e7]:
    - generic [ref=e8]: 127.0.0.1 is blocked
  - paragraph [ref=e9]: Your organization doesn’t allow you to view this site
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test'
  2 | 
  3 | test('landing page renders key navigation', async ({ page }) => {
> 4 |   await page.goto('/')
    |              ^ Error: page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at http://127.0.0.1:5173/
  5 |   await expect(page.getByText('D&D Hub')).toBeVisible()
  6 |   await expect(page.getByRole('link', { name: 'Dice' })).toBeVisible()
  7 |   await expect(page.getByRole('link', { name: 'References' })).toBeVisible()
  8 | })
  9 | 
```