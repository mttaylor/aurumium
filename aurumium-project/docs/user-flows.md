# Aurumium — User Flows & Stories (v0.1)

The product promise in one line: **open the app, know in ten seconds which
relationships are making you money, and know your next action.** Every flow
below is judged against that.

## Personas

**Riley, Loan Officer (primary).** Runs a personal book of 15–40 referral
partners. Checks in daily on mobile between appointments, weekly on desktop.
Wants: who's hot, who's slipping, what's stuck. Tolerance for configuration:
low. Everything must work great on the default template.

**Dana, Branch/Producing Manager.** Oversees 6–12 LOs. Monthly partner-review
cadence. Wants: roster-level sorting, exports for meetings, score-weight
control so the score reflects branch priorities. Tolerance for configuration:
high — Dana is who customization is for.

## Core user stories

1. As an LO, I open the app and see my top partners and any fires (stale
   deals) without clicking anything. *(Dashboard default template)*
2. As an LO, before coffee with a realtor, I open their profile and see their
   score, their funnel, and where their deals fall out. *(Partner profile)*
3. As an LO, I see my bottom-5 partners and can trigger an action — call,
   email, schedule, note — in two taps. *(Nurture list + radial actions)*
4. As a manager, I sort all partners by contract canx rate before a partner
   review. *(Partners table)*
5. As a manager, I change the score weights so compensation matters more,
   and every medallion updates. *(Score config)*
6. As any user, I swap a metric card I never use for one I care about, and it
   stays that way. *(Dashboard layout PUT — customization is data)*
7. As any user, I ask Auri "why did Marcus's score drop?" and get an answer
   grounded in real numbers with a suggested next click. *(Auri + tools)*
8. As a new user, my first session starts from the default template with
   sample data visible until my import lands — never a blank screen.

## Primary flow — the daily check-in (must stay under 10 seconds)
Open app → Dashboard (default template) → scan KPI strip → scan medallions →
red flags jump out (stale deals, nurture list) → tap through to partner or
loan → act (radial action / Auri question).

Design rules that protect this flow:
- **Zero-click insight.** The default template must surface top partners,
  stale deals, and the funnel without any interaction.
- **Everything clickable drills down.** Partner name → profile. Loan row →
  partner. Metric card → (later) metric detail. No dead ends.
- **Two taps to act.** Any partner surfaced anywhere → radial actions.
- **Customization never blocks flow.** Defaults are excellent; editing is
  discoverable (the ⌄ on cards) but never required. Reset-to-preset is
  always one click. A user who never customizes gets full value.
- **Auri is ambient, not modal.** Docked launcher, slide-over panel; the
  dashboard stays visible behind it. Auri's answers deep-link into the UI
  ("open Marcus's profile") instead of describing where to click.

## Secondary flows
- **Partner review (Dana, monthly):** Partners table → sort by chosen ratio →
  open profiles → export report → adjust score weights if priorities shifted.
- **Pipeline triage (Riley, weekly):** Pipeline → stale flags sorted worst-
  first → tap loan → partner context → nudge via action buttons.
- **First-run (either):** Sign in → default dashboard with sample data +
  import prompt → connect LOS/CSV → rollup refresh → real data replaces
  sample. Auri proactively offers a 60-second tour.

## Open UX questions (decide before beta)
- Mobile: bottom-tab nav (Dashboard / Partners / Pipeline / Auri) vs. top nav?
- Score-weight editing: slider UI with live medallion preview?
- Notifications: stale-deal push alerts — daily digest or real-time?
