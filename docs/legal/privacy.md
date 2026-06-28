# OmniDesk — Privacy Policy

**Version:** 2026-06 · **Effective date:** 2026-06-05

> **Draft for review.** Plain-language draft aligned with the project's
> principles. Not legal advice; review before a public launch.

## The short version

- **We never sell your data. Ever.** This is a core commitment of the project.
- **No third-party tracking, no ads, no analytics SDKs.**
- We store only what's needed to run your account and the features you use.
- You can **export everything** and **delete everything** at any time.

## 1. Who is responsible

The public instance is operated by a single individual ("the operator"). For
self-hosted instances, the person running that instance is the data controller.

## 2. What we collect

- **Account data:** email, password (stored only as a bcrypt hash), display
  name, optional avatar, your timezone, and timestamps (created, last login).
- **Your content:** everything you create in the app — calendar events, lists,
  notes, todos, habits, finance records, notifications, themes, and uploaded
  images. This is stored to provide the service back to you.
- **Operational data:** minimal logs and an audit log of significant or
  destructive actions (e.g. account deletion, suspension) including IP address
  and user agent, kept for security and abuse investigation.
- **2FA data (if enabled):** an encrypted TOTP secret and hashed backup codes.

We do **not** use third-party analytics, advertising, or tracking cookies. The
only cookies/local storage used are those strictly necessary for authentication.

## 3. How we use it

Solely to: operate your account, provide the features you use, secure the
service (rate limiting, abuse prevention), and communicate essential account
emails (verification, password reset, deletion notice). We do **not** profile
you or use your content for any purpose other than showing it back to you.

## 4. Email

Transactional emails only (verification, password reset, account-deletion
notice). No marketing. Email is sent via the configured SMTP provider; if mock
mode is enabled, emails are logged rather than sent.

## 5. Sharing

We do not share your personal data with third parties, except:

- The infrastructure needed to run the instance (hosting/server, SMTP provider,
  and the captcha provider on the sign-up page, which receives a challenge
  token and your IP for anti-abuse).
- Where required by law.

We never sell, rent, or trade your data.

## 6. Retention and deletion

- Your data is kept while your account is active.
- Deleting your account soft-deletes it for a short grace period (so you can
  recover it via the emailed link), after which **all your data and uploaded
  files are permanently erased**, including from disk.
- Audit-log entries for security events may be retained briefly after deletion
  for abuse investigation, without your content.

## 7. Your rights

You can, at any time and without asking:

- **Access / export** all your data (Settings → Export) as a complete archive.
- **Rectify** your data by editing it in the app.
- **Delete** your account and all associated data.

For GDPR-style requests beyond the in-app tools, contact the operator.

## 8. Security

Passwords are hashed with bcrypt (cost ≥ 12). Transport is encrypted via HTTPS
when configured. Optional two-factor authentication is available. No system is
perfectly secure — see the "no guarantees" note in the Terms.

## 9. International

The instance may be hosted in a different country than yours; using it means
your data may be processed there.

## 10. Changes

This policy may be updated; material changes bump the version and are surfaced
in-app.

## 11. Contact

See the contact details published on the public instance or the project's
repository.
