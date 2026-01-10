# Development Rules & Guidelines

## CRITICAL: React Hook Rules
⚠️ **NEVER use useState inside:**
- Conditional renders
- IIFEs (Immediately Invoked Function Expressions)  
- Callbacks
- Loops

All useState MUST be at component top level. Violating this FREEZES the app.

```javascript
// ❌ WRONG - Will freeze app
if (condition) {
    const [state, setState] = useState();
}

// ❌ WRONG - Will freeze app
(() => {
    const [state, setState] = useState();
})();

// ✅ CORRECT
const [state, setState] = useState();
if (condition) {
    setState(value);
}
```

## UI Guidelines
- Never display 'Beds24' in user-facing UI text
- Use 'Miami Beach Resort' branding
- Bengali Taka (৳) for currency display

## API Patterns
- Use `deposit` field (not `paid`) for payment tracking
- Revenue calculations use checkout dates, not check-in
- Always check for `data.success` before using response
- Handle pagination: check `pages.nextPageExists`

## Git Workflow
- Use feature branches with descriptive names
- Descriptive commit messages
- Preserve existing functionality when adding features
- Test thoroughly before push

## Payment Channels
Track payments via these channels:
1. Cash
2. Bank Transfer  
3. bKash
4. Card
5. Online (Booking.com, etc.)

## Housekeeping Priority Order
1. Turnover (checkout + same-day check-in)
2. Checkout Only
3. Stayover (occupied, no change)
4. Check-in Ready (vacant, has incoming)

## Environment
- Development: Local
- Production: GitHub Pages / Cloud Run
- Never mix credentials between projects

