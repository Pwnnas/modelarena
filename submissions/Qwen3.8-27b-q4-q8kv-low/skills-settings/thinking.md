Let me carefully plan this out:

1. **Theme**: Ocean Depths - Deep Navy (#1a2332), Teal (#2d8b8b), Seafoam (#a8dadc), Cream (#f1faee). Fonts: DejaVu Sans Bold for headers, DejaVu Sans for body.

2. **UX Copy**: Follow the principles - clear, concise, consistent, useful, human. Use specific CTAs, helpful error messages, good empty states.

3. **Accessibility**: WCAG 2.1 AA - proper labels, contrast, keyboard navigation, focus management, ARIA roles, visible focus indicators, proper form labels.

Let me think about the structure:

- Sidebar with 6 nav buttons using `data-nav`
- 6 panels with `data-panel` and proper ids
- Profile panel: form with name and email, save button
- Notifications panel: 4 switches with role="switch", aria-checked, data-switch
- Team panel: 3 members with remove buttons, invite form
- Projects panel: empty state, create button
- Billing panel: plan info, payment form
- Danger zone: delete workspace button

Key considerations:
- `data-action` on action buttons
- `data-field` on form fields
- `data-member` on team members
- `data-project` on projects
- `data-error` on error messages
- `role="status"` on success confirmations
- `data-empty` on empty state
- Dialogs with `role="dialog"`, `aria-modal="true"`, close on Escape
- Hidden panels use `display: none` or `hidden` attribute

Let me think about the contrast ratios:
- Cream (#f1faee) on Deep Navy (#1a2332): Let me check. #f1faee is very light, #1a2332 is very dark. This should be high contrast - well above 4.5:1.
- Teal (#2d8b8b) on Deep Navy (#1a2332): This might be a concern. Let me think... #2d8b8b is a medium teal. Against dark navy, it should be okay for large text but might be borderline for small text. I'll use it for accents and buttons, not for body text.
- Seafoam (#a8dadc) on Deep Navy (#1a2332): This is light blue-green on dark navy, should have good contrast.

For buttons, I'll use teal background with cream text, or use seafoam for lighter elements.

Let me think about the color contrast more carefully:
- #f1faee (cream) on #1a2332 (deep navy): Very high contrast, passes easily.
- #a8dadc (seafoam) on #1a2332: Also very good contrast.
- #2d8b8b (teal) on #f1faee (cream): Teal is medium, cream is light. This should be around 4:1-5:1. Let me estimate... Teal is roughly (45, 139, 139), cream is roughly (241, 250, 238). The luminance of teal is about 0.15, cream is about 0.93. Contrast ratio = (0.93 + 0.05) / (0.15 + 0.05) = 0.98/0.20 = 4.9:1. That passes for normal text.
- For buttons with teal background, I'll use cream text: same calculation reversed, 4.9:1, passes.

For the danger zone, I'll use a red-ish color but keep it within the theme. Maybe a coral/red that contrasts well with navy.

Now let me think about the dialog behavior:
- Remove member dialog: opens when clicking remove, has cancel and confirm buttons
- Delete workspace dialog: opens when clicking delete, has cancel and confirm buttons
- Both close on Escape
- When closed, they're hidden (display: none or hidden attribute)

Let me think about the notification switches:
- 4 switches: product updates, comments, mentions, weekly digest
- Each with role="switch", aria-checked, data-switch
- They should be toggleable by clicking and by keyboard (Space/Enter)

For the team panel:
- 3 members with name, email, role
- Each has a remove button with data-action="remove-member"
- Invite form with email field (data-field="invite-email")
- Invalid email shows error, valid email adds member

For projects:
- Empty state initially with data-empty
- Create button with data-action="create-project"
- Created projects appear in list with data-project

For billing:
- Current plan display
- Card number, expiry, CVC fields
- Card 4000 0000 0000 0002 always declined
- Any other 16-digit number accepted

Let me now write the code. I'll make it clean and well-organized.

For the sidebar, I'll use a vertical layout with the app name at top and nav buttons below.

Let me think about the layout:
- Fixed sidebar on the left (about 240px wide)
- Main content area on the right
- Responsive: at smaller widths, maybe the sidebar collapses? But the target is 1280x800, so I'll keep it simple.

Let me write the HTML structure:

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
    <aside class="sidebar" role="navigation" aria-label="Settings navigation">
      <div class="sidebar-header">
        <h1>Harbor</h1>
        <p class="workspace-name">Northwind</p>
      </div>
      <nav>
        <button data-nav="profile" class="nav-btn active" aria-current="page">Profile</button>
        <button data-nav="notifications" class="nav-btn">Notifications</button>
        <button data-nav="team" class="nav-btn">Team</button>
        <button data-nav="projects" class="nav-btn">Projects</button>
        <button data-nav="billing" class="nav-btn">Billing</button>
        <button data-nav="danger" class="nav-btn danger-btn">Danger Zone</button>
      </nav>
    </aside>
    <main class="content">
      <!-- Panels here -->
    </main>
  </div>
  
  <!-- Dialogs -->
  <div id="dialog-overlay" class="dialog-overlay" hidden>
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" id="dialog">
      <h2 id="dialog-title"></h2>
      <p id="dialog-message"></p>
      <div class="dialog-actions">
        <button id="dialog-cancel">Cancel</button>
        <button id="dialog-confirm"></button>
      </div>
    </div>
  </div>
  
  <script>...</script>
</body>
</html>
```

Now let me think about the UX copy for each element:

**Profile:**
- Title: "Profile"
- Subtitle: "Update your personal information"
- Name label: "Full name"
- Email label: "Email address"
- Save button: "Save changes"
- Error: "Please enter your full name. We need it to identify you in the workspace."
- Success: "Profile updated."

**Notifications:**
- Title: "Notifications"
- Subtitle: "Choose what you want to be notified about"
- Switches: "Product updates", "Comments", "Mentions", "Weekly digest"
- Save button: "Save preferences"
- Success: "Notification preferences saved."

**Team:**
- Title: "Team"
- Subtitle: "Manage who has access to this workspace"
- Members listed with name, email, role
- Remove button: "Remove"
- Invite section: "Invite a teammate"
- Email field label: "Email address"
- Invite button: "Send invite"
- Error (invalid email): "That doesn't look like a valid email. Check the format and try again — for example, name@company.com."
- Success (invite): "Invite sent to [email]."
- Remove dialog: "Remove [name] from Northwind?" / "They'll lose access to all projects and files. This can't be undone." / Buttons: "Remove" / "Keep"

**Projects:**
- Title: "Projects"
- Subtitle: "Organize your team's work"
- Empty state: "No projects yet. Create your first project to start organizing your team's work."
- Create button: "Create project"
- Success: "Project created."

**Billing:**
- Title: "Billing"
- Current plan: "Current plan: Growth"
- Card section: "Payment method"
- Card number label: "Card number"
- Expiry label: "Expiry date"
- CVC label: "Security code (CVC)"
- Pay button: "Update payment method"
- Error (declined): "Payment declined. Your bank rejected this card. Try a different card or contact your bank."
- Error (invalid): "Enter a valid 16-digit card number."
- Success: "Payment method updated."

**Danger Zone:**
- Title: "Danger Zone"
- Description: "This action is permanent and affects the entire workspace."
- Delete button: "Delete workspace"
- Dialog: "Delete Northwind?" / "All projects, files, and team access will be permanently removed. This can't be undone." / Buttons: "Delete workspace" / "Keep workspace"

Now let me think about accessibility:
- All form fields need proper labels (using `for`/`id` or `aria-label`)
- Focus indicators should be visible
- Keyboard navigation should work
- Dialogs need focus trap
- Switches need proper keyboard support (Space to toggle)
- Error messages should be associated with the field or be in a role="alert" or similar
- Actually, the contract says error messages have `data-error` attribute and are visible. I'll also add `role="alert"` to them for screen readers.

Wait, let me re-read the contract:
- "Every error message has a `data-error` attribute and is visible inside its panel."
- "Every success confirmation is in a `role="status"` element."

So errors need `data-error` and be visible. Success needs `role="status"`.

Let me also make sure the focus management is correct:
- When a dialog opens, focus moves to the first focusable element in the dialog
- When Escape is pressed, the dialog closes and focus returns to the trigger
- Tab cycles within the dialog (focus trap)

For the switches, I'll use a button element with role="switch":
```html
<button role="switch" aria-checked="true" data-switch="product-updates" aria-labelledby="label-product-updates">
  <span class="switch-track"><span class="switch-thumb"></span></span>
</button>
```

Actually, let me think about this more carefully. The switch needs to be accessible. A button with role="switch" that responds to Enter/Space should work. I'll make it so clicking or pressing Space/Enter toggles it.

Let me now write the full implementation. I need to be careful about:
1. No console errors
2. All the data attributes
3. Proper ARIA
4. The dialog behavior
5. The card validation logic
6. The email validation logic
7. The empty state behavior for projects

Let me also think about the visual design to make it look good for the blind human judging:
- Clean, modern design
- Good spacing and typography
- Subtle shadows and borders
- Smooth transitions
- The ocean depths theme should feel cohesive

I'll use a slightly lighter navy for the sidebar and a darker one for the main area, or vice versa. Let me think...

Actually, for a settings app, I think:
- Sidebar: slightly different shade (maybe a bit lighter navy or with a subtle border)
- Main content: the deep navy background
- Cards/sections: slightly lighter panels
- Text: cream
- Accents: teal and seafoam

Let me refine:
- Body background: #1a2332
- Sidebar: #151e2b (slightly darker) or #1f2d40 (slightly lighter)
- Cards: #1f2d40 with a subtle border
- Primary text: #f1faee
- Secondary text: #a8dadc
- Accent/primary: #2d8b8b
- Focus ring: #a8dadc
- Error: a warm red/coral that works with the theme - maybe #e76f51 or #ff6b6b
- Success: a green that works - maybe #52b788

Let me check contrast for error color:
- #e76f51 on #1a2332: Let me estimate. #e76f51 is (231, 111, 81). Luminance ≈ 0.2126*0.787 + 0.7152*0.172 + 0.0722*0.100 ≈ 0.167 + 0.123 + 0.007 = 0.297. Navy luminance ≈ 0.02. Contrast = (0.297+0.05)/(0.02+0.05) = 0.347/0.07 = 4.96:1. Passes.

Actually let me recalculate more carefully. The relative luminance formula is:
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
where R, G, B are linearized (sRGB to linear).

For #1a2332: R=26, G=35, B=50
Linearized: R=26/255=0.102 → 0.0102, G=35/255=0.137 → 0.0168, B=50/255=0.196 → 0.032
L = 0.2126*0.0102 + 0.7152*0.0168 + 0.0722*0.032 = 0.00217 + 0.01202 + 0.00231 = 0.0165

For #f1faee: R=241, G=250, B=238
Linearized: R=241/255=0.945 → 0.883, G=250/255=0.980 → 0.956, B=238/255=0.933 → 0.858
L = 0.2126*0.883 + 0.7152*0.956 + 0.0722*0.858 = 0.1877 + 0.6837 + 0.0619 = 0.933

Contrast = (0.933+0.05)/(0.0165+0.05) = 0.983/0.0665 = 14.8:1. Excellent.

For #a8dadc: R=168, G=218, B=220
Linearized: R=168/255=0.659 → 0.393, G=218/255=0.855 → 0.698, B=220/255=0.863 → 0.713
L = 0.2126*0.393 + 0.7152*0.698 + 0.0722*0.713 = 0.0835 + 0.499 + 0.0515 = 0.634
Contrast with navy = (0.634+0.05)/(0.0165+0.05) = 0.684/0.0665 = 10.3:1. Excellent.

For #2d8b8b: R=45, G=139, B=139
Linearized: R=45/255=0.176 → 0.0261, G=139/255=0.545 → 0.257, B=139/255=0.545 → 0.257
L = 0.2126*0.0261 + 0.7152*0.257 + 0.0722*0.257 = 0.00555 + 0.1838 + 0.01856 = 0.208
Contrast with navy = (0.208+0.05)/(0.0165+0.05) = 0.258/0.0665 = 3.88:1. This is below 4.5:1 for normal text!

So I should NOT use teal text on navy background for normal-sized text. I can use it for:
- Large text (18pt+ or 14pt+ bold) - needs 3:1, which 3.88:1 passes
- UI component borders and accents (non-text contrast needs 3:1, which passes)
- Button backgrounds (where the text on them is cream)

For button with teal background and cream text:
Contrast of cream on teal = (0.933+0.05)/(0.208+0.05) = 0.983/0.258 = 3.81:1. This is below 4.5:1!

Hmm, that's a problem. Let me think of alternatives:
- Use a darker teal for buttons? Or use the navy as button background with teal text?
- Actually, I could make buttons with a slightly darker teal. Let me try #237070:
  R=35, G=112, B=112
  Linearized: R=0.137→0.0168, G=0.439→0.162, B=0.439→0.162
  L = 0.2126*0.0168 + 0.7152*0.162 + 0.0722*0.162 = 0.00357 + 0.1159 + 0.0117 = 0.131
  Cream on this: (0.933+0.05)/(0.131+0.05) = 0.983/0.181 = 5.43:1. Passes!

Or I could use a different approach: use cream/seafoam text on a darker background for buttons, or use teal as a border/accent color and have the button be navy with a teal border.

Actually, let me reconsider. The theme says teal is for "highlights and emphasis." I think the best approach is:
- Primary buttons: use a slightly darker teal (#237070 or #1f6b6b) with cream text
- Or: use the deep navy background with a teal border and cream text (outline button style)
- Secondary elements: use seafoam for text/accents

Let me go with a darker teal for primary buttons to ensure contrast. I'll use #1e6e6e:
R=30, G=110, B=110
Linearized: R=0.118→0.0133, G=0.431→0.156, B=0.431→0.156
L = 0.2126*0.0133 + 0.7152*0.156 + 0.0722*0.156 = 0.00283 + 0.1116 + 0.01126 = 0.1257
Cream on this: (0.933+0.05)/(0.1257+0.05) = 0.983/0.1757 = 5.6:1. 

Actually, I'll just use #2d8b8b for the accent color (borders, highlights, active states) and for buttons I'll use a darker version. Let me define:
- --teal: #2d8b8b (for accents, borders, active nav)
- --teal-dark: #1e6e6e (for button backgrounds)
- --teal-light: #3aafa8 (for hover states)

Wait, I'm overcomplicating this. Let me just use the theme colors and ensure:
- Body text: cream on navy (14.8:1) ✅
- Secondary text: seafoam on navy (10.3:1) ✅
- Button text: cream on dark teal (5.6:1) ✅
- Links/accents: seafoam (10.3:1) ✅
- Teal for borders/decorative elements (3:1 non-text) ✅

This works. Let me proceed with the implementation.

One more thing: for the danger zone, I'll use a red color. Let me pick one that works:
- #e74c3c (a common red) on navy: 
  R=231, G=76, B=60
  Linearized: R=0.906→0.803, G=0.298→0.0742, B=0.235→0.0454
  L = 0.2126*0.803 + 0.7152*0.0742 + 0.0722*0.0454 = 0.1707 + 0.0531 + 0.00328 = 0.227
  Contrast with navy: (0.227+0.05)/(0.0165+0.05) = 0.277/0.0665 = 4.17:1. Below 4.5:1.

Let me try a lighter red: #ff6b6b
R=255, G=107, B=107
Linearized: R=1→1, G=0.42→0.147, B=0.42→0.147
L = 0.2126*1 + 0.7152*0.147 + 0.0722*0.147 = 0.2126 + 0.1051 + 0.0106 = 0.328
Contrast with navy: (0.328+0.05)/(0.0165+0.05) = 0.378/0.0665 = 5.68:1. Passes!

So I'll use #ff6b6b for error/danger text on the navy background.

For the danger button, I'll use a dark red background with cream text:
#9b2c2c: R=155, G=44, B=44
Linearized: R=0.608→0.332, G=0.173→0.0254, B=0.173→0.0254
L = 0.2126*0.332 + 0.7152*0.0254 + 0.0722*0.0254 = 0.0706 + 0.0182 + 0.00183 = 0.0906
Cream on this: (0.933+0.05)/(0.0906+0.05) = 0.983/0.1406 = 6.99:1. 

OK, I think I have enough to write the full implementation now. Let me write it out.

Let me also think about the dialog focus trap. When a dialog is open:
1. Focus moves to the first button (or the dialog itself if it's focusable)
2. Tab cycles through focusable elements within the dialog
3. Shift+Tab goes backwards
4. Escape closes the dialog
5. Focus returns to the element that opened the dialog

I'll implement this with a keydown listener on the dialog.

Let me also think about the notification switches more carefully. The grader will interact with them using real mouse and keyboard. So:
- Clicking the switch should toggle it
- Pressing Space or Enter while focused should toggle it
- The visual state should change (thumb position, track color)
- aria-checked should update

For the card number validation:
- Must be 16 digits (I'll strip spaces and check)
- If it's "4000000000000002", show declined error
- Otherwise, if valid 16-digit, show success
- If not 16 digits, show format error

Let me also think about what "any other 16-digit number is accepted" means. I think it means any 16-digit number that isn't the specific declined card. I should also validate the expiry and CVC fields, but the requirement only mentions the card number behavior. I'll validate the card number is 16 digits, and if it matches the declined card, show error. Otherwise show success.

Actually, re-reading: "The card 4000 0000 0000 0002 is always declined with an error message; any other 16-digit number is accepted with a confirmation." So I need to:
1. Check if it's 16 digits. If not, show an error about format.
2. If it's 16 digits and equals 4000000000000002, show declined error.
3. If it's 16 digits and not that card, show success.

I should also probably validate expiry and CVC, but the requirement doesn't specify their behavior. I'll keep it simple and just focus on the card number for the accept/decline logic. Maybe I'll add basic validation for the other fields (non-empty) but the main logic is on the card number.

Actually, let me re-read the requirement: "a payment form with card number, expiry and security code. The card 4000 0000 0000 0002 is always declined with an error message; any other 16-digit number is accepted with a confirmation."

I think the intent is that the card number is the key field for the logic. I'll validate that all three fields are filled, and the card number determines success/failure.

Let me now write the complete file. I'll be thorough and make sure everything works.

One more consideration: the grader says "The grader only ever closes it without deleting" for the danger zone. So I need to make sure the dialog closes properly on Escape and on the cancel button.

Let me also make sure I handle the case where the user navigates away while a dialog is open - I should probably close the dialog.

Actually, I'll keep it simple: dialogs can only be closed by Escape, the cancel button, or the confirm button. Navigation while a dialog is open shouldn't be an issue since the dialog is modal.

Let me write the code now. I'll structure it as:
1. HTML structure
2. CSS (in a style tag)
3. JavaScript (in a script tag at the end)

For the JavaScript, I'll use vanilla JS with event delegation where appropriate.

Let me finalize my design decisions:
- Sidebar: 240px wide, fixed position, slightly different background
- Main content: takes remaining width, scrollable
- Cards/sections: rounded corners, subtle background
- Buttons: rounded, with hover states
- Inputs: rounded, with focus states
- Transitions: subtle, 150-200ms

I think I'm ready to write the full implementation. Let me do it now.
