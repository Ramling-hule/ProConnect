
import os

output_dir = r"C:\Users\Hule Ramling\.gemini\antigravity-ide\brain\b7a60392-fc4f-4177-a860-f80a0b482155"
os.makedirs(output_dir, exist_ok=True)

part1 = r"""# ProConnect — SDE Interview Prep (Part 1: Overview, Codebase, Flows, APIs, DB, Auth, Cache, Externals, Errors)

---

# 1. PROJECT OVERVIEW

## What problem does it solve?
University students and early-career professionals have no single platform that combines:
- Professional networking (like LinkedIn)
- Hackathon discovery + team formation
- Mentor booking + mentor pods (group mentoring)
- Community groups + real-time messaging

## Who are the users?
- Students: join hackathons, find teammates, connect, join groups
- Mentors: offer 1-on-1 sessions, create pods (small group mentoring cohorts)
- Admins: manage users, approve mentors, moderate content
- Organizers: create and manage hackathons

## Major Features (confirmed from actual code)

| Feature | Evidence |
|---|---|
| LinkedIn-style connections | Connection.js, ConnectionService.js |
| Post feed + cursor pagination | Post.js, PostService.js |
| Hackathons + waitlist + teams + payment | Hackathon.js, HackathonRegistrationService.js |
| Mentor booking + payment | Booking.js, PaymentService.js |
| Mentor Pods (group cohorts) | Pod.js, PodMember.js, podController.js |
| Groups public/private + invite codes | Group.js, groupController.js |
| Real-time messaging DM+Group+Pod | socket/index.js, Message.js |
| Notifications (DB + Redis + Socket.io) | notificationService.js (Observer pattern) |
| AI features (team suggestions, skill gap) | HackathonAiService.js, Google Gemini |
| Webinars | Webinar.js, WebinarRegistration.js |
| MFA (TOTP - Google Authenticator) | AuthService.js - otplib |
| Google OAuth | AuthService.googleSignIn() |
| Audit logging | AuditService.js, AuditLog.js |
| Payment reconciliation cron | cron/paymentReconciliation.js - every 15 min |

## Technology Stack

| Component | Technology | Why |
|---|---|---|
| Backend | Node.js + Express.js v5 | Non-blocking I/O; real-time; huge ecosystem |
| Database | MongoDB (Mongoose) | Flexible schema for variable user profiles and nested hackathon docs |
| Cache + Sessions | Redis Cloud (ioredis) | Session store + API caching + distributed locks |
| Real-Time | Socket.io | Built-in rooms; WebSocket abstraction |
| Media | Cloudinary | Auto CDN; image transformations; no infra to manage |
| Auth | JWT + RefreshToken in DB | Stateless JWTs + revocable refresh tokens |
| Payments | Razorpay | India-focused; UPI support |
| Email | Nodemailer + Brevo SMTP | Transactional emails (OTP, password reset) |
| AI | Google Gemini (@google/genai) | Team suggestions, skill gap, project ideas |
| Validation | Zod | Runtime schema validation; async capable |
| Logging | Winston + daily-rotate | Structured JSON logs with rotation |
| Password | bcryptjs | Industry-standard hashing (argon2 also installed but unused) |
| Frontend | Next.js + Tailwind CSS | SSR/SSG, file-based routing |
| Frontend HTTP | Axios + interceptors | Auto token refresh; queue pending requests |

## Architecture: Modular Monolith

Single Node.js process, internally layered:
```
routes -> controllers -> services -> repositories/models -> DB
                   |
              middlewares (auth, rate-limit, validate, error)
                   |
              Socket.io (event-driven side channel)
                   |
              Redis (session store + cache + distributed lock)
```

## 2-Minute Interview Script

"I built ProConnect, a professional networking platform for college students. Think LinkedIn but for the tech community in colleges.

Students need more than just a profile - they need to find teammates for hackathons, book sessions with mentors, and collaborate in communities. So I built all of that in one place.

Backend is Node.js with Express, database is MongoDB, Redis for caching and sessions, Socket.io for real-time messaging and notifications, Cloudinary for media uploads, and Razorpay for payments.

The authentication uses JWTs for short-lived access tokens, with refresh tokens stored in the database as SHA-256 hashes - so they are revocable, and there is reuse detection if a token is stolen. I also added TOTP-based MFA and Google OAuth.

For hackathons I built a registration system with waitlists, team formation, payment, and AI features using Google Gemini - like suggesting teammates based on skill gaps and generating project ideas.

The notification system uses the Observer pattern - when a notification is triggered, it simultaneously saves to MongoDB, invalidates the Redis cache, and pushes real-time via Socket.io.

It is a modular monolith, not microservices, because at this scale that would be over-engineering. But the code is well-layered: routes, controllers, services, and repositories are all separate."

---

# 2. ACTUAL CODEBASE ANALYSIS

## Folder Structure

```
backend/src/
  app.js              - Express setup (CORS, sessions, middleware registration)
  server.js           - HTTP server + Socket.io + process signal handlers
  config/
    db.js             - MongoDB connection via Mongoose
    redis.js          - Redis client with reconnect strategy (3 retries, 500ms-2s backoff)
    cloudinary.js     - Cloudinary SDK initialization
    env.js            - All env variables validated and centrally exported
  controllers/        - 18 controllers (thin - call service, return response)
  services/           - 22 service files (all business logic)
  models/             - 35 Mongoose models
  repositories/       - HackathonRepository.js, HackathonRegistrationRepository.js
  routes/             - 19 route files + index.js (registration via array loop)
  middlewares/        - authMiddleware, errorHandler, rateLimiter, validateRequest, upload, guards
  socket/index.js     - Socket.io handlers (user, DM, group, room, hackathon, pod)
  cron/               - paymentReconciliation.js (every 15 min via node-cron)
  utils/              - AppError, CacheKeys, asyncHandler, logger, skillNormalizer
  validations/        - Zod schemas for auth and other inputs
  strategies/         - (Passport strategies - not read fully)
  workers/            - Background workers

frontend/src/
  app/                - Next.js App Router pages
  Components/         - React components
  redux/              - State management
  services/           - apiClient.js (Axios with interceptors for auto token refresh)
  utils/              - config, helpers
```

## Key Classes

### AuthService (singleton - services/AuthService.js)
- All authentication: register, verify email, login, MFA, Google OAuth, logout, refresh token
- _createSession(user, deviceInfo): creates JWT + hashed refresh token in DB + Redis session
- rotateRefreshToken(): marks old token isUsed=true; if already used -> security threat -> revoke ALL

### CacheService (singleton - services/CacheService.js)
- Redis wrapper; checks redisClient.isReady before every operation
- setSession(userId, sessionId, ttl, payload) -> key: session:active:{userId}:{sessionId}
- deleteSession(userId) -> deletes all session:active:{userId}:* keys
- acquireLock(key, value, ttl) -> atomic Redis SET NX EX -> distributed lock
- get/set/del -> generic cache operations
- All methods fail silently when Redis is down

### PaymentService (singleton - services/PaymentService.js)
- Razorpay integration: createOrder, verifyPayment, createHackathonOrder, verifyHackathonPayment
- fulfillPayment() runs inside MongoDB transaction: update Payment + update Booking/Registration/Team
- Idempotent: if payment already 'captured', returns {alreadyCaptured: true}

### NotificationService (Observer pattern - services/notificationService.js)
- notify() calls 3 observers:
  1. DbNotificationObserver -> Notification.create()
  2. RedisNotificationObserver -> del notifications:{userId} (cache invalidation)
  3. SocketNotificationObserver -> io.to(userId).emit('new_notification', notif)
- Why: decoupled. Add email notifications = add another observer, no other code changes.

### HackathonRegistrationService
- registerIndividual() checks: window open, eligibility, duplicate, then calls _consumeCapacityAtomically()
- _consumeCapacityAtomically(): findOneAndUpdate with { registrationCount: { $lt: maxParticipants } }
  - If null returned = hackathon is full -> waitlist
  - This is atomic; no race conditions
- cancelRegistration(): if cancelled and there's a waitlisted user -> automatically promote them

### HackathonAiService
- Calls Google Gemini; caches result in Redis (5min-1hr TTL)
- getTeamSuggestions(): analyzes current team skills, calls Gemini for missing skills, queries DB for matching users
- getSkillGapAnalysis(), getProjectIdeas(), getTeamBalanceAnalysis(), getSubmissionChecklist()

### authMiddleware.protect
1. Extract Bearer token from Authorization header
2. jwt.verify(token, secret, { issuer, audience })
3. User.findById(decoded.id).select('-password')
4. Check user.lockedUntil
5. Check decoded.version === user.tokenVersion (revocation via version bump)
6. IF redisClient.isReady: check session:active:{userId}:* exists (at least 1 key)
7. req.user = user; next()

### PostService.getPosts() - Cursor Pagination
- Cursor = Base64 JSON { createdAt, _id }
- Query: { $or: [{ createdAt < cursorDate }, { createdAt == cursorDate AND _id < cursorId }] }
- Sort: { createdAt: -1, _id: -1 } - uses compound index
- Stable: no duplicates/skips on concurrent inserts

---

# 3. COMPLETE REQUEST FLOWS

## Registration
```
POST /api/auth/register
-> registrationLimiter (10/hour per IP)
-> Zod validate
-> AuthService.register()
    -> User.findOne(email) - check duplicate
    -> crypto.randomInt(1000,9999) -> 4-digit OTP
    -> sha256(otp) -> stored as verificationOtpHash (NOT plaintext)
    -> new User({ isVerified: false, verificationOtpHash, verificationOtpExpires: +10min })
    -> EmailService.sendOtpEmail(email, otp) -> Nodemailer -> Brevo SMTP
    -> user.save() -> bcrypt pre-save hook: hash password (salt=10)
-> AuditService.log(userId, "REGISTRATION_SUCCESS", req)
-> 201: { message: "Verification OTP sent", userId }
```

## Login
```
POST /api/auth/login { email, password }
-> loginLimiter (5/15min per IP)
-> Zod validate
-> AuthService.login()
    -> User.findOne(email) -> check isVerified
    -> check role match
    -> check lockedUntil (423 if locked)
    -> user.matchPassword(password) -> bcrypt.compare
    -> If wrong: failedLoginAttempts++; if >=5 -> lockedUntil = now+15min
    -> If MFA: generate tempToken -> { mfaRequired: true, tempToken, userId }
    -> Else: _createSession(user, deviceInfo)
        -> jwt.sign({ id, version }, secret, { expiresIn, issuer, audience, jwtid })
        -> crypto.randomBytes(40) -> rawRefreshToken
        -> sha256(rawRefreshToken) -> RefreshToken.create() in DB
        -> Redis: SET session:active:{userId}:{sessionId} EX 2592000
-> setRefreshCookie(res, rawRefreshToken) -> httpOnly, path=/api/auth/refresh-token
-> AuditService.log(userId, "LOGIN_SUCCESS", req)
-> 200: { accessToken, user: { _id, name, email, role } }
```

## Authenticated Request
```
Any protected API (e.g., POST /api/dashboard/posts)
-> apiClient.js adds Authorization: Bearer <accessToken>
-> authMiddleware.protect:
    -> jwt.verify(token) -> { id, version }
    -> User.findById(id).select('-password')
    -> check lockedUntil
    -> check decoded.version === user.tokenVersion
    -> if Redis ready: check session:active:{userId}:* exists
    -> req.user = user; next()
-> Controller -> Service -> MongoDB -> Response
```

## Token Refresh
```
Frontend detects 401 on API call
-> apiClient interceptor triggers
-> Other requests queued (isRefreshing = true)
-> POST /api/auth/refresh-token (cookie sent automatically)
-> AuthService.rotateRefreshToken(rawToken)
    -> sha256(rawToken) -> RefreshToken.findOne({ tokenHash }).populate('user')
    -> If isUsed or isRevoked -> SECURITY ALERT
        -> RefreshToken.deleteMany({ user: userId })
        -> CacheService.deleteSession(userId)
        -> 401 "Security threat detected"
    -> tokenDoc.isUsed = true; save
    -> generate new JWT + new rawRefreshToken
    -> RefreshToken.create({ newHash, parentTokenHash: oldHash })
    -> return { newAccessToken, newRawRefreshToken }
-> Set new refreshToken cookie
-> Return { accessToken: newAccessToken }
-> apiClient retries all queued requests with new token
```

## Hackathon Registration (Free, Individual)
```
POST /api/hackathons/:id/register/individual
-> protect middleware
-> HackathonRegistrationService.registerIndividual(hackathonId, userId, io)
    -> Hackathon.findById()
    -> _assertRegistrationWindowOpen() - checks dates
    -> User.findById()
    -> _assertEligibility() - college, year constraints
    -> findByHackathonAndUser() - 409 if already registered
    -> if approvalRequired -> status='pending'
    -> else if !isFree -> status='pending' (needs payment)
    -> else -> _consumeCapacityAtomically()
        -> findOneAndUpdate({ registrationCount: { $lt: max } }, { $inc: { registrationCount: 1 } })
        -> If null -> full -> if waitlistEnabled -> waitlist; else 409
    -> HackathonRegistrationRepository.create({ hackathon, user, status, paymentStatus })
    -> notificationManager.notify({ type: 'hackathon_accepted' }, io)
        -> DbObserver -> Notification.create()
        -> RedisObserver -> del notifications:{userId}
        -> SocketObserver -> io.to(userId).emit('new_notification', notif)
-> 201: { registration }
```

## Payment Flow (Hackathon)
```
Step 1: POST /api/payments/hackathon/:registrationId/order
-> PaymentService.createHackathonOrder(registrationId, userId)
    -> find HackathonRegistration + Hackathon
    -> razorpay.orders.create({ amount: fee*100, currency, receipt, payment_capture: 1 })
    -> Payment.create({ razorpayOrderId, amount, status: 'created' })
    -> registration.payment = payment._id; registration.paymentStatus = 'pending'; save
-> Return { order, paymentId }

Step 2: Frontend opens Razorpay Checkout -> user pays

Step 3: POST /api/payments/hackathon/:registrationId/verify
-> PaymentService.verifyHackathonPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
    -> body = orderId + "|" + paymentId
    -> expectedSig = HMAC-SHA256(body, keySecret)
    -> if expectedSig != razorpaySignature -> mark payment 'failed'; throw 400
    -> fulfillPayment() [MONGODB TRANSACTION]:
        -> Payment.findOne({ razorpayOrderId }).session(session)
        -> if already 'captured' -> return { alreadyCaptured: true } (idempotent)
        -> payment.status = 'captured'; payment.razorpayPaymentId = paymentId; save
        -> registration.status = 'confirmed'; registration.paymentStatus = 'paid'; save
        -> Hackathon.$inc({ registrationCount: memberCount })
        -> session.commitTransaction()
-> 200: { success: true }
```

---

# 4. KEY API DOCUMENTATION

## POST /api/auth/register
Rate limit: 10/hour per IP
Zod: name, username, email, password, institute required
Flow: User.findOne -> User.create (bcrypt hook) -> sendOtpEmail -> AuditLog
201: { message, userId }
400: email exists+verified | Zod validation error
429: rate limit
503: SMTP down

## POST /api/auth/login
Rate limit: 5/15min per IP
Flow: findOne -> matchPassword -> failedAttempts/lockout -> MFA check -> _createSession
200: { accessToken, user } + refreshToken httpOnly cookie
401: bad credentials | not verified
403: role mismatch
423: account locked (>=5 failures, 15min lockout)
429: rate limit

## POST /api/auth/refresh-token
Input: httpOnly refreshToken cookie (automatic)
Flow: sha256(raw) -> lookup -> check isUsed/isRevoked -> rotate -> issue new pair
200: { accessToken } + new cookie
401: invalid/expired/reused token

## POST /api/dashboard/posts (multipart)
Auth: Bearer token
File: optional image/video via multer
Flow: Cloudinary upload_stream -> Post.create -> populate user
201: { _id, text, media: { url, resourceType, format, bytes }, likes: [], comments: [] }
400: no text or file

## GET /api/dashboard/posts?cursor=<base64>&limit=10
Flow: decode cursor -> compound query -> sort by { createdAt:-1, _id:-1 } -> limit
200: { posts: [...], nextCursor: "base64", hasMore: bool }
Why cursor not offset: skip() is O(N) full scan; cursor uses index, O(log N)

## POST /api/payments/webhook (RAW body - before express.json)
Auth: X-Razorpay-Signature header
Events: order.paid -> fulfillPayment() [transaction], payment.failed, refund.processed

---

# 5. DATABASE DEEP DIVE

## Why MongoDB?
- User profiles are variable: some have codingProfiles, education, achievements; others dont
- Hackathons embed complex arrays: tracks[], prizes[], sponsors[], faqs[], judgingCriteria[], refundPolicy
- No migrations for new optional fields
- Document maps directly to JSON API response

## Schema Relationships
```
User (1:N) Connection (requester/recipient)
User (1:N) Post
User (1:N) RefreshToken
User (N:M) Group (via embedded members[], admins[])
User (1:1) Mentor
Mentor (1:N) Booking
Booking (1:1) Payment
Hackathon (1:N) HackathonRegistration
Hackathon (1:N) HackathonTeam
HackathonTeam (1:N) HackathonRegistration (for team members)
HackathonRegistration (1:1) Payment
Pod (1:N) PodMember
Pod (1:N) PodMessage
User (1:N) Notification (recipient)
```

## Key Collections

### User
- email: unique
- username: unique
- googleId: unique + sparse
- role: enum student/admin/institute/mentor
- tokenVersion: incremented on password reset/logout-all to invalidate all JWTs
- lockedUntil, failedLoginAttempts: brute force protection
- verificationOtpHash, verificationOtpExpires: email OTP (hash only, never plaintext)
- mfaEnabled, mfaSecret, tempMfaToken: TOTP MFA
- passwordResetTokenHash, passwordResetExpires: password reset
- Sparse indexes on verificationOtpHash and passwordResetTokenHash

### Hackathon (8 indexes)
- slug: unique (URL-friendly)
- status: draft/published/ongoing/completed/cancelled
- registrationCount, waitlistCount: atomically updated
- Embedded: tracks[], prizes[], sponsors[], faqs[], judgingCriteria[], refundPolicy{}
- Virtual: isRegistrationOpen (computed from status + dates)
- Indexes: slug(unique), {status,visibility,timeline.registrationClose}, {skills,category}, {isFeatured,createdAt}, {organizer}, {mode,difficulty}, {timeline.hackathonStart}, {deletedAt}, {isFree,registrationFee}

### Connection
- requester, recipient: ObjectId refs to User
- status: pending/accepted/rejected
- COMPOUND UNIQUE INDEX: { requester, recipient } -> prevents duplicates at DB level

### RefreshToken
- tokenHash: unique (SHA-256 of raw token - never plaintext)
- isUsed, isRevoked: for rotation + reuse detection
- parentTokenHash: tracks token lineage chain
- expiresAt: TTL INDEX (expireAfterSeconds: 0) -> MongoDB auto-deletes expired docs

### Payment (polymorphic)
- Only ONE of: booking, hackathonRegistration, hackathonTeam, podMember, webinarRegistration is non-null
- razorpayOrderId, razorpayPaymentId, razorpaySignature
- status: created/authorized/captured/failed/refunded

### Post
- likes: array of User ObjectIds (embedded)
- comments: array of { user, text, createdAt } (embedded)
- Indexes: { createdAt:-1, _id:-1 } (cursor pagination), { user:1 }, { postType, createdAt }

### HackathonTeam
- captain, members[], invitations[], joinRequests[]
- status: active/locked/deleted
- isLookingForMembers: for teammate discovery
- techStack, rolesNeeded: normalizeSkills() pre-save hook runs on both
- Indexes: {hackathon, members.user}, {hackathon, captain}, {hackathon, isLookingForMembers}, {invitations.user, invitations.status}

## MongoDB Transactions (PaymentService.fulfillPayment)
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Payment.status = 'captured'
  // 2. Booking.status = 'Confirmed' OR Registration confirmed OR Team locked
  // 3. Hackathon.$inc({ registrationCount: memberCount })
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```
Why: without transaction, payment could be 'captured' but booking not confirmed -> user paid for nothing.

## Atomic Capacity Check (key design pattern)
```javascript
const updated = await Hackathon.findOneAndUpdate(
  { _id: hackathonId, registrationCount: { $lt: maxParticipants } },
  { $inc: { registrationCount: 1 } },
  { new: true }
);
// null = hackathon is full -> waitlist
```
MongoDB document-level locking: only one concurrent update wins. No race condition.

---

# 6. DATABASE INTERVIEW Q&A

Q: Why MongoDB over PostgreSQL?
A: User profile is highly variable - coding profiles, education, achievements, tech stack differ per user.
MongoDB's flexible schema handles this without nullable columns everywhere.
Hackathons embed complex arrays (prizes, FAQs, tracks) read together, never queried independently.
BUT: if I needed strong multi-table transactions like a financial system, PostgreSQL would be better.

Q: Why compound unique index on Connection { requester, recipient }?
A: Prevents duplicate requests at DB level. Even with concurrent requests, MongoDB guarantees only one
insert succeeds. Service layer also checks in code, but index is the real safety net.

Q: How do you handle concurrent registrations when hackathon is full?
A: Atomic findOneAndUpdate with conditional: find where registrationCount < max AND increment.
If MongoDB returns null, condition didn't match - hackathon is full. This is far safer than
read-check-increment which has a race condition window between read and write.

Q: What happens if transaction fails halfway?
A: catch block calls session.abortTransaction(). finally calls session.endSession().
All changes rolled back. Payment stays 'created'. Reconciliation cron retries within 15 minutes.

Q: Why expireAfterSeconds: 0 on RefreshToken?
A: MongoDB TTL index. Auto-deletes documents where expiresAt is in the past. Built-in cleanup.

Q: How to debug slow queries?
A: 1. mongoose.set('debug', true) or Atlas slow query log
   2. .explain('executionStats') on query
   3. If COLLSCAN appears - no index used
   4. Add missing index
   5. Check $or query index usage

---

# 7. AUTHENTICATION & AUTHORIZATION

## Full Auth Flow

### Registration
POST /api/auth/register
-> Zod validate
-> User.findOne(email) -> duplicate check
-> Create User { isVerified: false, verificationOtpHash: sha256(4-digit OTP) }
-> bcrypt pre-save: hash password (salt=10)
-> sendOtpEmail() via Nodemailer -> Brevo
-> Return { userId }

POST /api/auth/verify-email { userId, code }
-> User.findById(userId)
-> sha256(code) === user.verificationOtpHash && not expired
-> user.isVerified = true; save

### Login
POST /api/auth/login
-> bcrypt.compare(password, user.password)
-> If wrong: failedLoginAttempts++; if >=5 -> lockedUntil = now+15min
-> If MFA: generate tempToken -> { mfaRequired: true, tempToken, userId }
-> Else: _createSession()
    -> jwt.sign({ id, version }, secret, { expiresIn, issuer: 'proconnect-api', audience: 'proconnect-client', jwtid: randomUUID() })
    -> crypto.randomBytes(40) -> rawRefreshToken
    -> sha256(rawRefreshToken) -> RefreshToken.create() in DB
    -> Redis: SET session:active:{userId}:{sessionId} EX 30days
-> Cookie: refreshToken (httpOnly, secure=prod, sameSite=lax, path=/api/auth/refresh-token)
-> Response: { accessToken, user }

### MFA
Setup: GET /api/auth/mfa/setup
-> authenticator.generateSecret()
-> otpauth URL -> QRCode.toDataURL() -> return QR to user
-> Store secret in user.mfaSecret; mfaEnabled = false

Enable: POST /api/auth/mfa/enable { code }
-> authenticator.verify({ token: code, secret: user.mfaSecret })
-> user.mfaEnabled = true; save

MFA Login: POST /api/auth/login/mfa { userId, tempToken, code }
-> User.findById(userId)
-> Verify tempToken === user.tempMfaToken
-> authenticator.verify({ token: code, secret: user.mfaSecret })
-> _createSession() -> return tokens

### Password Reset
POST /api/auth/forgot-password { email }
-> User.findOne(email)
-> crypto.randomInt(1000,9999) -> OTP
-> sha256(otp) -> user.passwordResetTokenHash; expires in 15min
-> sendPasswordResetOtpEmail()
-> 200: "If that email exists, an OTP has been sent" (no user enumeration)

POST /api/auth/reset-password { email, otp, password }
-> verify sha256(otp) === user.passwordResetTokenHash && not expired
-> user.password = password (bcrypt pre-save hook runs on save)
-> user.tokenVersion++ (invalidates ALL outstanding JWTs)
-> RefreshToken.deleteMany({ user: userId })
-> CacheService.deleteSession(userId)

### Authorization

Role-based (middleware):
```javascript
export const authorizeRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
  next();
};
```

Resource-based (service layer):
```javascript
if (hackathon.organizer.toString() !== organizerId.toString())
  throw new AppError('Only the organizer can approve registrations', 403);
```

## Security Weaknesses (Admit honestly)

1. KEYS command in Redis (authMiddleware line 30-33): O(N). Fix: Redis Set per user.
2. mfaSecret in plaintext MongoDB. Fix: encrypt at rest with app-level encryption.
3. tempMfaToken in plaintext MongoDB.
4. No CSRF token. sameSite: 'lax' provides partial protection.
5. OTP is only 4 digits (10k possibilities). Rate-limited to 5 attempts but 6 digits safer.
6. argon2 installed but bcryptjs used. Argon2 is more GPU-resistant.
7. No signed URLs for Cloudinary - identity proof documents accessible if URL guessed.

How to defend:
"The KEYS command is O(N) and blocks Redis in production. The fix is Redis Set - sadd user_sessions:{userId} {sessionId}
on login, sismember on check, srem on logout. This gives O(1) lookup. I'd fix before production."

---

# 8. CACHING

## Redis Keys

| Key | Purpose | TTL |
|---|---|---|
| session:active:{userId}:{sessionId} | Active session tracking (validates JWT) | 30 days |
| notifications:{userId} | Notification cache | Invalidated on new notification |
| ai:team_suggestions:{hackathonId}:{userId} | AI team suggestions | 5 min |
| ai:skill_gap:{hackathonId}:{teamId} | AI skill gap | 10 min |
| ai:project_ideas:{hackathonId}:{skills} | AI project ideas | 5 min |
| ai:submission_checklist:{hackathonId} | AI checklist | 1 hour |
| lock:{key} | Distributed lock | Varies |

## Strategy: Cache-Aside (Lazy Loading)
1. Check Redis -> cache hit -> return
2. Cache miss -> query MongoDB -> store in Redis with TTL -> return

Example (HackathonAiService._callAi):
```
const cached = await CacheService.get(cacheKey);
if (cached) return cached;           // HIT
const raw = await AiService.generateContent(...);
await CacheService.set(cacheKey, parsed, cacheTtl);  // POPULATE
return parsed;
```

## Cache Invalidation
Notifications: RedisNotificationObserver.update() -> del notifications:{userId} on every new notification
Sessions: CacheService.deleteSession(userId) deletes all session:active:{userId}:* on logout

## Redis Down Behavior
All CacheService methods check redisClient.isReady.
authMiddleware: session check is inside if(redisClient.isReady) -> SKIPPED if Redis down
AI: no cache -> every request hits Gemini API (slow, costly)
Notifications: no cache -> hits MongoDB every time
App CONTINUES TO WORK - graceful degradation

## Q&A

Q: What if Redis has stale data?
A: Sessions: 30-day TTL. Notifications: invalidation on write. AI: short TTLs (5-10min), acceptable staleness.

Q: What caching strategy?
A: Cache-Aside (Lazy Loading). Only populate on first miss. Simpler than Write-Through, avoids caching unused data.

Q: How does distributed lock work?
A: CacheService.acquireLock(key, value, ttl) uses Redis SET key value NX EX ttl.
NX = only set if Not eXists. Atomic. Only one process wins. If Redis down -> returns true (optimistic).

---

# 9. EXTERNAL APIS & THIRD-PARTY SERVICES

## Razorpay
Why: India-focused; UPI, cards, netbanking, wallets
Integration: razorpay npm SDK; orders.create(), payments.refund()
Flow:
  1. Server creates order -> orderId
  2. Frontend opens Razorpay Checkout with orderId
  3. User pays -> Razorpay webhook + frontend gets paymentId+signature
  4. Verify: HMAC-SHA256(orderId|paymentId, keySecret) === signature
  5. MongoDB transaction: captured + fulfill
Reliability: webhook + client verification + 15-min cron = 3 layers
Failure: order creation throws -> user sees error -> no money taken

## Google Gemini AI
Why: Team suggestions, skill gap, project ideas, submission checklists
Integration: @google/genai SDK, responseMimeType: 'application/json'
Caching: every response cached in Redis (5min-1hr)
Failure: no fallback; AI endpoints return 500 if Gemini down

## Cloudinary
Why: CDN-backed media storage; auto-optimization; no infra
Integration: cloudinary.uploader.upload_stream - streams buffer directly
Failure: AppError('Upload to cloud storage failed', 500)

## Nodemailer + Brevo SMTP
Why: Transactional emails (OTP, password reset)
Failure: throws status 503; no retry logic; user must re-register
Weakness: synchronous in registration flow - adds latency

## Google OAuth
Why: Login without password management
Flow: Frontend Google credential -> Backend googleClient.verifyIdToken() -> create/update user -> session
Library: google-auth-library

---

# 10. ERROR HANDLING

## Global Error Handler (middlewares/errorHandler.js)
Error thrown in route -> asyncHandler catches -> passed to Express error middleware
-> statusCode = err.statusCode || res.statusCode || 500
-> if 5xx: logger.error(message, { stack, requestId, userId, ip, url })
-> if 4xx: logger.warn(message, { requestId, userId })
-> Response: { success: false, status: 'error', message, requestId }
-> Dev only: includes stack trace

## Zod Validation Errors
validate() middleware -> schema.parseAsync()
-> ZodError -> format: [{ path, message }]
-> 400: { error: 'VALIDATION_ERROR', message: 'Invalid request data', details: [...] }

## Auth Error Codes
UNAUTHORIZED    401 - No token
TOKEN_EXPIRED   401 - JWT expired
INVALID_TOKEN   401 - JWT tampered
TOKEN_REVOKED   401 - tokenVersion mismatch
SESSION_EXPIRED 401 - No Redis session
USER_NOT_FOUND  401 - User deleted
ACCOUNT_LOCKED  423 - lockedUntil active
FORBIDDEN       403 - Wrong role

## Process Handlers (server.js)
process.on('uncaughtException') -> logger.error -> setTimeout(process.exit(1), 500)
process.on('unhandledRejection') -> logger.error -> setTimeout(process.exit(1), 500)
process.on('SIGTERM') -> server.close() -> process.exit(0)  [graceful]
server.on('error') -> log EADDRINUSE with fix hint -> process.exit(1)
"""

with open(os.path.join(output_dir, "ProConnect_Prep_Part1.md"), "w", encoding="utf-8") as f:
    f.write(part1)

print("Part 1 written successfully, length:", len(part1))
