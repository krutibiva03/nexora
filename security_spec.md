# NEXORA Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict PII Isolation**: User email addresses and account flags live exclusively in `/usersPrivate/{userId}` and are readable/writable only by `request.auth.uid == userId` with verified email.
2. **Ownership Integrity**: Every document in `/profiles/{userId}`, `/skills/{skillId}`, `/projects/{projectId}`, `/achievements/{achievementId}`, and `/activities/{activityId}` stores an immutable `userId` equal to the creator's `request.auth.uid`.
3. **Public vs Private Boundary**: Profiles, skills, projects, and achievements with `isPublic == false` are readable ONLY by their owner (`request.auth.uid == resource.data.userId`). Only documents with `isPublic == true` are visible to Community Discover and public profile visitors.
4. **Immutable Temporal & Identity Fields**: `userId` and `createdAt` cannot be modified on update. `createdAt` on create and `updatedAt` on create/update must equal `request.time` (server timestamp).
5. **Bounded Payloads**: Every string field has strict `.size()` bounds and arrays (`interests`, `technologies`) are capped at 12 entries.
6. **Zero Shadow Fields**: Document creation checks both `keys().hasAll(...)` and `keys().hasOnly(...)`; updates check `affectedKeys().hasOnly(...)` inside named action branches.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Cross-Tenant Profile Hijack**: Authenticated user A attempts to create/update `/profiles/{userB}` with `userId: userA`.
2. **PII Snooping**: Authenticated user A attempts `get` or `list` on `/usersPrivate/{userB}`.
3. **Private Project Scraping**: Unauthenticated or user B attempts `list` on `/projects` without `where('isPublic', '==', true)` or reads a private project (`isPublic: false`).
4. **Shadow Field Injection**: User A creates `/profiles/{userA}` adding an undocumented `isAdmin: true` or `verifiedBadge: true` field.
5. **Unverified Email Spoofing**: User with `email_verified: false` attempts to write to `/skills/{skillId}`.
6. **Timestamp Forgery**: User A creates a project with a client-forged `createdAt` in the past instead of `request.time`.
7. **Immortal Field Mutation**: User A updates an existing skill and tries to reassign `userId` to user B or alter `createdAt`.
8. **ID Poisoning**: User A tries to create `/skills/{2000-char-id}` or `/skills/bad$id`.
9. **Array Exhaustion**: User A creates `/projects/{id}` with 50 technologies in `technologies` (> 12 limit) or non-string elements.
10. **String Resource Exhaustion**: User A submits a 1MB `bio` (> 1200 chars) or `description` (> 2500 chars).
11. **Invalid Enum Injection**: User A submits `/skills/{id}` with `category: "Arbitrary"` or `proficiency: 999`.
12. **Private Activity Leak**: User B attempts `get` or `list` on `/activities` belonging to user A.
