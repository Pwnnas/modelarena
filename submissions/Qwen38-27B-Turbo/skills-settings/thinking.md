Let me think through this carefully. I need to build a single-file HTML settings app called "Harbor" following three skills: Ocean Depths theme, UX copy, and accessibility review.

Key requirements:
1. Six panels: Profile, Notifications, Team, Projects, Billing, Danger Zone
2. Specific grader contract with data attributes
3. Ocean Depths theme: #1a2332, #2d8b8b, #a8dadc, #f1faee with DejaVu Sans fonts
4. UX copy principles: clear, concise, human, specific CTAs
5. Accessibility: WCAG 2.1 AA, contrast, keyboard navigation, ARIA

Let me plan the structure:

**Theme (Ocean Depths):**
- Background: #1a2332 (deep navy)
- Sidebar: darker or same with accent
- Text: #f1faee (cream)
- Accents: #2d8b8b (teal), #a8dadc (seafoam)
- Fonts: DejaVu Sans (system fallback: sans-serif)

**Sidebar Navigation:**
- Six buttons with data-nav attributes
- Active state indication

**Panel 1: Profile**
- Full name input (prefilled with sample data)
- Email input (prefilled)
- Save button (data-action="save-profile")
- Error message area (data-error)
- Success status area (role="status")

**Panel 2: Notifications**
- Four switches (role="switch", aria-checked, data-switch)
- Labels: Product updates, Comments, Mentions, Weekly digest
- Save button (data-action="save-notifications")

**Panel 3: Team**
- Three members with data-member, name, email, role
- Remove button per member (data-action="remove-member")
- Confirmation dialog on remove
- Invite form with email field (data-field="invite-email")
- Invite button (data-action="invite")
- Error handling for invalid email

**Panel 4: Projects**
- Empty state initially (data-empty)
- Create button (data-action="create-project")
- Project list after creation (data-project)

**Panel 5: Billing**
- Current plan display
- Card number (data-field="card-number")
- Card expiry (data-field="card-expiry")
- Card CVC (data-field="card-cvc")
- Pay button (data-action="pay")
- Error/success messages
- Special handling: 4000 0000 0000 0002 declined

**Panel 6: Danger Zone**
- Delete workspace button (data-action="delete-workspace")
- Confirmation dialog
- Grader only closes, doesn't delete

**Dialog system:**
- role="dialog", aria-modal="true"
- Close on Escape
- Hidden when closed

**Sample data:**
- Workspace: "Northwind"
- Profile: "Alex Morgan", "alex@northwind.io"
- Team: 3 members

Let me write the code now, ensuring all grader contract requirements are met.

For accessibility:
- Proper heading hierarchy
- Labels for all inputs
- ARIA attributes
- Keyboard focus management
- Sufficient contrast (cream on navy is good)
- Focus indicators

For UX copy:
- Clear, human language
- Specific CTAs
- Helpful error messages
- Good empty states

Let me code this up:
