Let me analyze the requirements carefully:

1. **Single file `index.html`** with all HTML, CSS, and JavaScript inline
2. **No external resources** - everything self-contained
3. **Theme: Ocean Depths** - Deep Navy (#1a2332), Teal (#2d8b8b), Seafoam (#a8dadc), Cream (#f1faee), DejaVu Sans Bold (headers), DejaVu Sans (body)
4. **UX Copy** - follow the patterns for CTAs, errors, empty states, confirmation dialogs
5. **Accessibility** - WCAG 2.1 AA compliance

Let me plan the structure:

**Panels (in order):**
1. Profile - form with full name, email, save button
2. Notifications - 4 on/off switches, save button
3. Team - 3 members with remove buttons, invite form
4. Projects - empty state initially, create button, list
5. Billing - current plan, payment form
6. Danger Zone - delete workspace button

**Grader Contract:**
- Sidebar buttons: `data-nav="<panel>"`
- Panels: `data-panel="<panel>"`
- Panel ids: `profile`, `notifications`, `team`, `projects`, `billing`, `danger`
- Hidden panels use `display: none` or `hidden` attribute
- Action buttons: `data-action` with specific values
- Form fields: `data-field` with specific values
- Notification switches: `role="switch"`, `aria-checked`, `data-switch`
- Team members: `data-member`
- Projects: `data-project`
- Error messages: `data-error` attribute, visible inside panel
- Success: `role="status"` element
- Empty state: `data-empty`
- Dialogs: `role="dialog"`, `aria-modal="true"`, close on Escape, when closed removed/hidden

**Accessibility requirements:**
- Contrast ratio >= 4.5:1 for normal text
- Keyboard navigation
- Visible focus indicator
- Form labels
- ARIA landmarks
- Touch target >= 44x44px
- Name, role, value for all UI components

**UX Copy principles:**
- Clear, concise, consistent, useful, human
- CTAs: start with verb, be specific
- Errors: what happened + why + how to fix
- Empty states: what this is + why it's empty + how to start
- Confirmation dialogs: make action clear, describe consequences, label buttons with action

Let me now build this:

**Color contrast checks:**
- Cream (#f1faee) on Deep Navy (#1a2332): Let me calculate. 
  - #f1faee: R=241, G=250, B=238
  - #1a2332: R=26, G=35, B=50
  - Luminance of cream: 0.2126*(241/255)^2.2 + 0.7152*(250/255)^2.2 + 0.0722*(238/255)^2.2
  - Actually let me use the proper formula. For sRGB:
    - R=241/255=0.945, linearized ≈ 0.882
    - G=250/255=0.980, linearized ≈ 0.955
    - B=238/255=0.933, linearized ≈ 0.855
    - L1 = 0.2126*0.882 + 0.7152*0.955 + 0.0722*0.855 = 0.187 + 0.683 + 0.062 = 0.932
  - For navy:
    - R=26/255=0.102, linearized ≈ 0.0106
    - G=35/255=0.137, linearized ≈ 0.0166
    - B=50/255=0.196, linearized ≈ 0.032
    - L2 = 0.2126*0.0106 + 0.7152*0.0166 + 0.0722*0.032 = 0.00225 + 0.01187 + 0.00231 = 0.0164
  - Contrast ratio = (0.932+0.05)/(0.0164+0.05) = 0.982/0.0664 = 14.8:1 ✅

- Teal (#2d8b8b) on Deep Navy (#1a2332):
  - R=45/255=0.176, linearized ≈ 0.0265
  - G=139/255=0.545, linearized ≈ 0.258
  - B=139/255=0.545, linearized ≈ 0.258
  - L1 = 0.2126*0.0265 + 0.7152*0.258 + 0.0722*0.258 = 0.00563 + 0.1845 + 0.01863 = 0.2088
  - Contrast = (0.2088+0.05)/(0.0164+0.05) = 0.2588/0.0664 = 3.9:1 - This is below 4.5:1 for normal text!
  
  Hmm, I need to be careful. For the teal accent color, I should use it for larger text or UI elements (which only need 3:1). For body text, I'll use cream on navy. For buttons, I can use teal background with cream text.

  - Cream on Teal: L_cream=0.932, L_teal=0.2088
  - Contrast = (0.932+0.05)/(0.2088+0.05) = 0.982/0.2588 = 3.79:1 - Also below 4.5:1!

  Let me reconsider. I'll use teal for buttons but with darker text or make the teal lighter. Actually, let me use a slightly lighter teal or use it as accent for larger elements. For button text, I can use white/cream on a slightly darker teal, or I can use the teal as a border/accent and keep text in cream on navy.

  Actually, for buttons I'll use teal background with white text. Let me check:
  - White (#ffffff) on Teal (#2d8b8b): L_white=1.0, L_teal=0.2088
  - Contrast = (1.0+0.05)/(0.2088+0.05) = 1.05/0.2588 = 4.06:1 - Still below 4.5:1!

  Hmm. Let me use a darker teal for buttons. What about #1a6b6b?
  - R=26/255=0.102, linearized ≈ 0.0106
  - G=107/255=0.420, linearized ≈ 0.148
  - B=107/255=0.420, linearized ≈ 0.148
  - L = 0.2126*0.0106 + 0.7152*0.148 + 0.0722*0.148 = 0.00225 + 0.1058 + 0.01069 = 0.1187
  - White on this: (1.05)/(0.1187+0.05) = 1.05/0.1687 = 6.22:1 ✅

  Or I could use #2d8b8b for larger text (>= 18pt or 14pt bold) where 3:1 is sufficient, and for buttons I'll use a darker shade.

  Actually, let me reconsider the approach. The theme says:
  - Deep Navy: primary background
  - Teal: accent color for highlights and emphasis
  - Seafoam: secondary accent for lighter elements
  - Cream: text and light backgrounds

  So I should use:
  - Background: Deep Navy (#1a2332)
  - Text: Cream (#f1faee)
  - Accent/Buttons: Teal (#2d8b8b) - for larger elements, borders, highlights
  - For button text: I'll use a darker teal background or use cream text on a sufficiently dark background

  Let me use #1a6b6b (darker teal) for button backgrounds to ensure contrast. Or I can use the teal for borders, icons, and larger text, and use a slightly different approach for buttons.

  Actually, a simpler approach: use teal (#2d8b8b) for buttons but make the text bold and larger (at least 14pt bold = 3:1 threshold). Or I can just use a slightly darker teal.

  Let me go with a darker teal for interactive elements: #1f7a7a or similar. Let me try #237a7a:
  - R=35/255=0.137, linearized ≈ 0.0166
  - G=122/255=0.478, linearized ≈ 0.193
  - B=122/255=0.478, linearized ≈ 0.193
  - L = 0.2126*0.0166 + 0.7152*0.193 + 0.0722*0.193 = 0.00353 + 0.1380 + 0.01393 = 0.1555
  - White on this: 1.05/0.2055 = 5.11:1 ✅
  - Cream on this: 0.982/0.2055 = 4.78:1 ✅

  I'll use #237a7a for buttons (or I can just use the original teal and make text white and ensure it's at least 14pt bold). Actually, to keep it simple and accessible, let me use a slightly darker teal for buttons: I'll go with `#247070` or just use the theme's teal and ensure button text is white at 16px bold (which qualifies as "large text" at 14pt bold, needing only 3:1).

  Wait, WCAG defines "large text" as 18pt (24px) or 14pt (18.66px) bold. So 16px bold doesn't qualify. Let me just use a darker teal for buttons to be safe.

  I'll use:
  - `#1a2332` - main background
  - `#f1faee` - text
  - `#2d8b8b` - accents, borders, highlights (for larger elements)
  - `#a8dadc` - secondary accents, lighter elements
  - `#1f6b6b` or similar darker teal for button backgrounds

  Actually, let me just use the teal as specified but make buttons have white text at a size that works. Or better, I'll use a slightly darker shade for the button background. Let me use `#227777`:
  - R=34/255=0.133, linearized ≈ 0.0156
  - G=119/255=0.467, linearized ≈ 0.184
  - B=119/255=0.467, linearized ≈ 0.184
  - L = 0.2126*0.0156 + 0.7152*0.184 + 0.0722*0.184 = 0.00332 + 0.1316 + 0.01329 = 0.1482
  - White: 1.05/0.1982 = 5.29:1 ✅

  Great, I'll use `#227777` for button backgrounds.

  Actually, you know what, let me just be practical. I'll use the exact colors from the theme and ensure:
  - Body text: Cream on Deep Navy (14.8:1) ✅
  - Button text: White on a slightly darker teal (I'll use #1e6e6e or similar)
  - Teal for borders, icons, and decorative elements
  - Seafoam for secondary text, labels, etc.

  Let me check Seafoam on Deep Navy:
  - R=168/255=0.659, linearized ≈ 0.392
  - G=218/255=0.855, linearized ≈ 0.706
  - B=220/255=0.863, linearized ≈ 0.723
  - L = 0.2126*0.392 + 0.7152*0.706 + 0.0722*0.723 = 0.0833 + 0.505 + 0.0522 = 0.6405
  - Contrast with navy: (0.6405+0.05)/(0.0164+0.05) = 0.6905/0.0664 = 10.4:1 ✅

  Great, seafoam works well for text on navy.

  Now let me plan the full implementation:

**HTML Structure:**
```
<body>
  <div class="app">
    <nav> (sidebar with buttons)
    <main> (panels)
  </div>
  <div role="dialog" aria-modal="true"> (confirmation dialogs)
</body>
```

**JavaScript:**
- Navigation between panels
- Profile save validation
- Notification toggle
- Team member removal with dialog
- Team invite validation
- Project creation
- Payment validation
- Workspace deletion dialog
- Dialog close on Escape

Let me write the full code now.

For the fonts - since I can't use external fonts, I'll use system fonts that are similar to DejaVu Sans. DejaVu Sans is a sans-serif font. I'll use:
- `font-family: 'DejaVu Sans', 'Segoe UI', system-ui, -apple-system, sans-serif;`

This way if DejaVu Sans is available it'll be used, otherwise it falls back to similar system fonts.

Now let me write the complete HTML file:

For the notification switches, I need to create custom toggle switches with `role="switch"`, `aria-checked`, and `data-switch` attributes.

For the dialog, I need:
- `role="dialog"`
- `aria-modal="true"`
- Close on Escape
- When closed: `display: none` or `hidden`

Let me think about the team members. I need 3 members with name, email, role, and a remove button. The remove button has `data-action="remove-member"`.

For the invite form, I need an email field with `data-field="invite-email"` and a button with `data-action="invite"`.

For billing, I need card number (`data-field="card-number"`), expiry (`data-field="card-expiry"`), CVC (`data-field="card-cvc"`), and a pay button (`data-action="pay"`).

Let me also think about the empty state for projects: it needs `data-empty` attribute.

Now let me write the complete code. I'll be thorough with accessibility:
- All buttons have accessible names
- All form fields have labels
- Focus management for dialogs
- Keyboard navigation
- ARIA landmarks
- Sufficient touch targets (44x44px minimum)
- Visible focus indicators

Let me write this out now.
