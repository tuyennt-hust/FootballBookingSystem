# Changelog

## v1.0.4 - Portfolio repository cleanup

- Rewrote the root README for GitHub/portfolio presentation.
- Added a concise technical documentation index.
- Added a dedicated location and naming guide for future portfolio screenshots.
- Replaced local database/session secrets in `.env.example` with explicit placeholders.
- Removed internal implementation-phase and updater documentation from the portfolio repository.
- Updated project verification/audit rules for the cleaned repository structure.

## v1.0.3 - Render & responsive polish

- Removed pitch-type labels drawn directly inside default SVG pitch images.
- Repositioned pitch status badges to prevent overlap/cropping.
- Reduced excessive spacing on the owner dashboard.
- Improved the Admin secondary navigation while scrolling.
- Fixed long revenue values overflowing Admin KPI cards.
- Refined responsive behavior for KPI cards and booking history.

## v1.0.2 - Dashboard & profile polish

- Removed auth placeholders and the registration security promo block.
- Refined owner and Admin dashboards.
- Standardized booking/payment/admin status badges.
- Improved the account profile and responsive dashboard components.

## v1.0.1 - Auth UI refinement

- Added a real stadium visual to authentication pages.
- Removed demo-account credentials from the sign-in UI.
- Refined auth spacing, typography, and responsive presentation.

## v1.0.0 - UI/UX portfolio release

- Added the portfolio design system in `public/css/ui-v1.css`.
- Refined home, pitch discovery, booking, payment, owner, and Admin interfaces.
- Improved responsive behavior, interaction states, typography, spacing, and accessibility.

## v0.9.0 - System finalization

- Completed layered application modules and customer flows.
- Added CSP/security headers, CSRF hardening, request limits, and private-page cache controls.
- Added project verify/audit/database checks and final smoke tests.
- Completed API, database, security, deployment, test, and user documentation.
- Added ERD, Use Case, Architecture, and Booking Sequence diagrams.

## v0.8.0 - Admin

- Added Admin dashboard, account/area management, global monitoring, and reports.

## v0.7.0 - Services and payment

- Added booking services, invoice detail, and simulated payment flow.
- Fixed pitch price validation for round values such as `200000`.

## v0.6.0 - Pitch owner management

- Added owner dashboard, pitch management, image upload, status management, and booking confirmation.
- Added `001_add_pitch_image_url.sql` migration and Multer 2.x.

## v0.5.0 - Booking flow

- Added booking creation, history, detail, and cancellation workflows.
