Let me break down this task:

1. Build a settings app called "Harbor" for a team workspace called "Northwind"
2. Single `index.html` file with all HTML, CSS, JS inline
3. No external resources
4. Apply "Ocean Depths" theme (colors: Deep Navy #1a2332, Teal #2d8b8b, Seafoam #a8dadc, Cream #f1faee; Fonts: DejaVu Sans Bold for headers, DejaVu Sans for body)
5. Write UX copy following the ux-copy skill
6. Ensure accessibility per the accessibility-review skill
7. Six panels: Profile, Notifications, Team, Projects, Billing, Danger Zone

Let me plan each panel:

**Grader Contract Requirements:**
- Sidebar buttons: `data-nav="<panel>"`
- Panels: `data-panel="<panel>"`
- Panel ids: `profile`, `notifications`, `team`, `projects`, `billing`, `danger`
- Hidden panels use `display: none` or `hidden`
- Action buttons: `data-action`: `save-profile`, `save-notifications`, `remove-member`, `invite`, `create-project`, `pay`, `delete-workspace`
- Form fields: `data-field`: `name`, `email`, `invite-email`, `card-number`, `card-expiry`, `card-cvc`
- Notification switches: `role="switch"`, `aria-checked`, `data-switch`
- Team members: `data-member`; projects: `data-project`
- Error messages: `data-error` attribute, visible inside panel
- Success confirmations: `role="status"` element
- Empty state: `data-empty`
- Dialogs: `role="dialog"`, `aria-modal="true"`, close on Escape, removed or hidden when closed

**Ocean Depths Theme:**
- Background: #1a2332 (Deep Navy)
- Accent: #2d8b8b (Teal)
- Secondary accent: #a8dadc (Seafoam)
- Text/light backgrounds: #f1faee (Cream)
- Headers: DejaVu Sans Bold
- Body: DejaVu Sans

**UX Copy Principles:**
- Clear, concise, consistent, useful, human
- CTAs start with verbs
- Error messages: What happened + Why + How to fix
- Empty states: What this is + Why it's empty + How to start
- Confirmation dialogs: Make action clear, describe consequences, label buttons with action

**Accessibility:**
- Contrast ratio >= 4.5:1 for normal text
- All functionality keyboard accessible
- Logical focus order
- Visible focus indicator
- Touch targets >= 44x44px
- Form labels
- ARIA landmarks
- Proper ARIA roles

Let me check contrast ratios:
- Cream (#f1faee) on Deep Navy (#1a2332): Let me calculate. Cream is very light, Navy is very dark. This should be high contrast.
- Teal (#2d8b8b) on Deep Navy (#1a2332): Teal is medium-dark. Let me think... #2d8b8b has luminance around 0.18-0.2, #1a2332 has luminance around 0.02-0.03. Ratio would be about (0.2+0.05)/(0.03+0.05) ≈ 3.1:1. This might not pass 4.5:1 for normal text. I'll use teal for larger elements, buttons with cream text, or use it as background with dark text.
- Seafoam (#a8dadc) on Deep Navy (#1a2332): Seafoam is light, should pass.

For buttons, I'll use teal as background with cream/white text. Let me check: #f1faee on #2d8b8b. Cream is very light (luminance ~0.9), teal is medium (luminance ~0.2). Ratio ≈ (0.9+0.05)/(0.2+0.05) ≈ 3.8:1. That's close but might not pass 4.5:1. Let me use white (#ffffff) on teal instead: (1+0.05)/(0.2+0.05) ≈ 4.2:1. Still not quite. 

Actually let me recalculate more carefully.
- #2d8b8b: R=45, G=139, B=139
  - Linear R: (45/255)^2.2 ≈ 0.027
  - Linear G: (139/255)^2.2 ≈ 0.257
  - Linear B: (139/255)^2.2 ≈ 0.257
  - Luminance: 0.2126*0.027 + 0.7152*0.257 + 0.0722*0.257 ≈ 0.0057 + 0.1838 + 0.0186 ≈ 0.208

- #f1faee: R=241, G=250, B=238
  - Linear R: (241/255)^2.2 ≈ 0.888
  - Linear G: (250/255)^2.2 ≈ 0.957
  - Linear B: (238/255)^2.2 ≈ 0.863
  - Luminance: 0.2126*0.888 + 0.7152*0.957 + 0.0722*0.863 ≈ 0.189 + 0.684 + 0.062 ≈ 0.935

Contrast ratio: (0.935+0.05)/(0.208+0.05) = 0.985/0.258 ≈ 3.82:1

That's not enough for normal text. I'll make button text bold and larger (at least 18px or 14px bold counts as large text which needs 3:1). Or I can use a darker teal for button backgrounds. Let me use a slightly darker shade like #1f6b6b for button backgrounds.

Actually, for the theme I should stick with the specified colors but be smart about usage:
- Use teal for larger UI elements (buttons with large/bold text, icons, borders)
- Use cream for all body text on navy background
- Use seafoam for secondary text and accents

Let me recalculate cream on navy:
- #1a2332: R=26, G=35, B=50
  - Linear R: (26/255)^2.2 ≈ 0.010
  - Linear G: (35/255)^2.2 ≈ 0.017
  - Linear B: (50/255)^2.2 ≈ 0.033
  - Luminance: 0.2126*0.010 + 0.7152*0.017 + 0.0722*0.033 ≈ 0.002 + 0.012 + 0.002 ≈ 0.016

Cream on Navy: (0.935+0.05)/(0.016+0.05) = 0.985/0.066 ≈ 14.9:1 ✅ Excellent

Seafoam on Navy:
- #a8dadc: R=168, G=218, B=220
  - Linear R: (168/255)^2.2 ≈ 0.382
  - Linear G: (218/255)^2.2 ≈ 0.695
  - Linear B: (220/255)^2.2 ≈ 0.706
  - Luminance: 0.2126*0.382 + 0.7152*0.695 + 0.0722*0.706 ≈ 0.081 + 0.497 + 0.051 ≈ 0.629

Seafoam on Navy: (0.629+0.05)/(0.016+0.05) = 0.679/0.066 ≈ 10.3:1 ✅ Excellent

For buttons, I'll use teal background with cream text and make the text bold at 16px (which at 14px+ bold counts as large text needing 3:1). 3.82:1 passes for large text. Or I can make buttons slightly larger.

Actually, let me just use a darker teal for button backgrounds to be safe. I'll use #1a6b6b or similar. But the theme says #2d8b8b... Let me just make button text 18px bold or 16px bold. WCAG says large text is 18pt (24px) or 14pt bold (approximately 18.67px bold). So 16px bold might not qualify as "large text."

Let me just use white text on teal buttons and make them 18px font size. That's 13.5pt which is close but not quite 14pt bold. 

You know what, let me just use a slightly darker teal for the button background. I'll use #256b6b which is close to the theme's teal but darker enough for contrast.

#256b6b: R=37, G=107, B=107
- Linear R: (37/255)^2.2 ≈ 0.019
- Linear G: (107/255)^2.2 ≈ 0.145
- Linear B: (107/255)^2.2 ≈ 0.145
- Luminance: 0.2126*0.019 + 0.7152*0.145 + 0.0722*0.145 ≈ 0.004 + 0.104 + 0.010 ≈ 0.118

Cream on #256b6b: (0.935+0.05)/(0.118+0.05) = 0.985/0.168 ≈ 5.86:1 ✅

Great, I'll use #256b6b for button backgrounds. Actually, to stay closer to the theme, let me just make the buttons have a slightly different approach. I'll use the theme's teal as the primary accent for borders, active states, and larger elements, and for buttons I'll use a slightly darker shade that's still in the teal family.

Let me now plan the structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harbor — Settings</title>
  <style>...</style>
</head>
<body>
  <div class="app">
    <nav class="sidebar" aria-label="Settings navigation">
      <div class="sidebar-header">
        <h1>Harbor</h1>
        <p>Northwind</p>
      </div>
      <ul>
        <li><button data-nav="profile" class="active">Profile</button></li>
        <li><button data-nav="notifications">Notifications</button></li>
        <li><button data-nav="team">Team</button></li>
        <li><button data-nav="projects">Projects</button></li>
        <li><button data-nav="billing">Billing</button></li>
        <li><button data-nav="danger">Danger Zone</button></li>
      </ul>
    </nav>
    <main>
      <section id="profile" data-panel="profile">...</section>
      <section id="notifications" data-panel="notifications" hidden>...</section>
      <section id="team" data-panel="team" hidden>...</section>
      <section id="projects" data-panel="projects" hidden>...</section>
      <section id="billing" data-panel="billing" hidden>...</section>
      <section id="danger" data-panel="danger" hidden>...</section>
    </main>
  </div>
  
  <!-- Dialogs -->
  <div role="dialog" aria-modal="true" ...>...</div>
</body>
</html>
```

Now let me write the full implementation:

For the notifications switches, I need elements with `role="switch"`, `aria-checked`, and `data-switch`. I'll use button elements styled as toggles.

For the team panel, I need three members with `data-member`, each with a remove button with `data-action="remove-member"`.

For the confirmation dialog (removing a member), I need `role="dialog"`, `aria-modal="true"`, close on Escape.

For the danger zone, a button with `data-action="delete-workspace"` that opens a confirmation dialog.

Let me write this out now. I'll be thorough with:
- ARIA labels
- Focus management
- Keyboard navigation
- Proper semantic HTML
- Good UX copy
- Ocean Depths theme throughout

Let me think about the dialog management. I'll create a single dialog element that I show/hide as needed, or I can have separate dialogs for remove-member and delete-workspace. Let me use a generic approach with a single dialog container that I populate dynamically.

Actually, let me have two separate dialogs to keep it simpler:
1. Remove member confirmation
2. Delete workspace confirmation

Both need `role="dialog"`, `aria-modal="true"`, close on Escape.

When closed, they should be `display: none` or `hidden` or `visibility: hidden`.

Let me write the complete file now.

For the switch components, I'll use `<button role="switch" aria-checked="true/false" data-switch="product-updates">` etc.

Let me think about focus management in dialogs:
- When dialog opens, focus moves to the dialog (or first focusable element)
- Tab cycles within the dialog
- Escape closes the dialog
- When dialog closes, focus returns to the triggering element

Let me also make sure touch targets are at least 44x44px. I'll make buttons and switches at least that size.

For the empty state in Projects:
- `data-empty` attribute
- Copy: "No projects yet. Create your first project to start organizing your team's work."
- Button: "Create project" with `data-action="create-project"`

Let me now write the complete HTML file.

One more thing - the fonts. The theme says DejaVu Sans. Since we can't use web fonts, I'll use a font stack that prioritizes DejaVu Sans but falls back to system fonts that are similar:
`font-family: "DejaVu Sans", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;`

For headers (bold):
`font-family: "DejaVu Sans", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-weight: 700;`

This way if DejaVu Sans is available (common on Linux), it'll be used, otherwise it falls back gracefully.

Let me finalize my design:

- Background: #1a2332
- Cards/panels: slightly lighter navy, like #222f42 or #1e2d3d
- Text: #f1faee (cream)
- Secondary text: #a8dadc (seafoam)
- Accent/primary buttons: #256b6b background, #f1faee text
- Borders: #2d8b8b (teal)
- Focus ring: #a8dadc (seafoam)
- Error: a warm color... let me use something that fits. Maybe #e8a87c or #f4a261 (warm orange) for errors. Actually, for a maritime theme, maybe a coral/salmon: #e76f51 or similar.
- Success: #a8dadc (seafoam) or a green that fits... Let me use a soft green: #7bc47f or keep it in the theme with seafoam for success.

Actually, for semantic colors I need:
- Error: needs to be distinguishable. Let me use #ff6b6b or #e76f51 (coral)
- Success: #7bc47f or #a8dadc

Let me check contrast:
- #e76f51 on #1a2332: 
  - #e76f51: R=231, G=111, B=81
  - Linear: R=(231/255)^2.2≈0.793, G=(111/255)^2.2≈0.159, B=(81/255)^2.2≈0.085
  - Luminance: 0.2126*0.793 + 0.7152*0.159 + 0.0722*0.085 ≈ 0.169 + 0.114 + 0.006 ≈ 0.289
  - Contrast with navy: (0.289+0.05)/(0.016+0.05) = 0.339/0.066 ≈ 5.14:1 ✅

Good, coral works for errors.

Now let me write the complete file. I'll be very careful about all the requirements.

Let me also think about the localStorage requirement. The task says "The page starts with an empty localStorage (fresh browser profile)." This means I don't need to worry about persisting state, but I could use it. However, since the grader starts fresh, I'll just use in-memory state. Actually, let me not use localStorage at all to keep it simple and avoid any issues.

Wait, re-reading: "The page starts with an empty localStorage (fresh browser profile)." This is just telling me the initial state - I don't need to use localStorage. I'll keep state in JavaScript variables.

Let me write the full implementation now.
