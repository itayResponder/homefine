---
name: project-form-validation
description: Form validation pattern used across the app — no browser popups, red borders, field-error messages
metadata:
  type: project
---

All forms use custom validation — never rely on browser-native `required` popups.

**Pattern:**
1. `noValidate` on `<form>`
2. `errors` state: `{ fieldName?: string }`
3. On change → clear that field's error immediately
4. On submit → validate all, `setErrors(newErrors)`, return early if any error present
5. `<input className={`inp${errors.x ? ' inp--error' : ''}`} />`
6. `<CustomSelect error={!!errors.x} />` (prop wired to `.cs-trig--error`)
7. `{errors.x && <span className="field-error">{errors.x}</span>}` below the input

**No-layout-shift rule:** `.field-error` is `position: absolute; top: 100%` — floats below the input without affecting grid layout. Container (`.fl` / `.rec-field`) must have `position: relative`. Grid gap must absorb the error height (~16px): `.fg` gap = 20px, `.rec-form-grid` gap = 1.2rem.

**Tab isolation:** Forms with type-toggle tabs (e.g. RecurringSection) must reset entire form state + errors on tab switch — not just the `type` field. Use `setForm({ ...emptyForm(), type }); setErrors({})`.

**Shared CSS classes** (AppPage.css): `.inp--error`, `.cs-trig--error`, `.field-error`
RecurringSection uses `.ap-input--error` (AddTransactionModal.css) instead of `.inp--error`.

**Forms that use this pattern:**
- `AddMemberModal` — Hebrew name (required + Hebrew chars), English name (required + Latin chars), duplicate name check against existing members
- `TransactionView` — desc (required), amount (>0), category (required)
- `RecurringSection` — desc (required), amount (>0), category (required), monthCount (1–60, starts empty)

**Why:** User wants no browser default validation UI; errors should be inline with red borders, fully i18n'd, without causing layout shifts.

**How to apply:** Any new form must follow this pattern. Add i18n keys for each error message. Never use `required` attribute or browser validation.
