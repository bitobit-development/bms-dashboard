# Bug: Pending Users Can Access Dashboard - Authorization Bypass

**Date:** 2025-10-31
**Severity:** 🔴 CRITICAL
**Status:** ❌ CONFIRMED - Not Fixed
**Test User:** testuser+1761888082@example.com
**Stack User ID:** eb16eafd-ad12-4560-94aa-06d6acd2f919

---

## Executive Summary

A critical security flaw allows users with `status='pending'` to access the full dashboard and view sensitive data **before admin approval**. This completely bypasses the intended user approval workflow and violates the core security requirement that users must be approved before accessing the system.

---

## Problem Description

### Expected Behavior
1. User signs up → account created with `status='pending'`
2. User sees message: "Your account requires admin approval before you can log in"
3. User is **blocked** from accessing `/dashboard` routes until approved
4. Admin reviews and approves user
5. User can then access dashboard

### Actual Behavior
1. ✅ User signs up → account created with `status='pending'`
2. ❌ No approval message shown to user
3. ❌ User can immediately access **full dashboard** with all data
4. ❌ Pending user sees all sites, equipment, telemetry, and system stats
5. ✅ Pending user correctly blocked from `/management` console
6. Database correctly shows `status='pending'`, but authorization is not enforced

---

## Test Results

### Test Case 1: New User Signup ✅ PASSED
- **Action:** Created user `testuser+1761888082@example.com`
- **Result:** User created successfully
- **Database Status:** `pending`
- **Role:** `viewer`
- **Organization ID:** `1`
- **Created:** 2025-10-31 07:22:05

### Test Case 2: Pending Status Message ❌ FAILED
- **Expected:** Message stating "admin approval required"
- **Actual:** No message shown, user redirected to dashboard
- **Impact:** User has no indication they need approval

### Test Case 3: Dashboard Access Control ❌ FAILED (CRITICAL)
- **Expected:** Pending user blocked from `/dashboard`
- **Actual:** **Pending user has FULL access to dashboard**
- **Accessed Routes:**
  - ✅ `/dashboard` (should be blocked ❌)
  - ✅ `/dashboard/sites/*` (should be blocked ❌)
  - ✅ All site data visible (should be blocked ❌)
  - ✅ System statistics visible (should be blocked ❌)
  - ✅ Telemetry data visible (should be blocked ❌)
- **Data Exposure:** All 5 sites with full telemetry, battery levels, solar generation, load data

### Test Case 4: Management Console Access ✅ PASSED
- **Expected:** Pending user blocked from `/management`
- **Actual:** Correctly blocked with "Access Denied - Admin role required"
- **Note:** Management layout checks `status !== 'active'` (line 66)

### Test Case 5: Database Verification ✅ PASSED
```bash
pnpm user:list
```
**Output:**
```
⏳ testuser+1761888082@example.com
   Stack User ID: eb16eafd-ad12-4560-94aa-06d6acd2f919
   Status: pending  ← Correctly set
   Role: viewer
   Organization: 1
   Created: Fri Oct 31 2025 07:22:05 GMT+0200
   Accepted: Not yet  ← Correct
```

---

## Root Cause Analysis

### 1. **Middleware Does NOT Check User Status** (middleware.ts:46-48)
```typescript
// User is authenticated, allow access
// Approval check will happen in dashboard layout
return NextResponse.next()
```

**Problem:** Comment claims "approval check will happen in dashboard layout" but **this check does NOT exist**.

**Code Location:** `/Users/haim/Projects/bms-dashboard/middleware.ts:46-48`

**Current Logic:**
- ✅ Checks if user authenticated via Stack Auth
- ✅ Handles user sync cookie
- ❌ **Does NOT check user status in database**
- ❌ **Allows ALL authenticated users**, regardless of pending status

### 2. **Dashboard Layout Has NO Status Check** (app/dashboard/layout.tsx)
```typescript
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* No authorization check at all */}
      {children}
    </div>
  )
}
```

**Problem:** Client-side layout component with **zero authorization logic**.

**Code Location:** `/Users/haim/Projects/bms-dashboard/app/dashboard/layout.tsx:25-51`

### 3. **Dashboard Page Only Syncs User** (app/dashboard/page.tsx:17-19)
```typescript
// Sync user to database on mount (for new signups)
useEffect(() => {
  syncUserToDatabase().catch(console.error)
}, [])
```

**Problem:** Only creates/syncs user record, **does NOT block pending users**.

**Code Location:** `/Users/haim/Projects/bms-dashboard/app/dashboard/page.tsx:17-19`

### 4. **Inconsistent Authorization Pattern**

**Management Console** (✅ CORRECT):
```typescript
// app/management/layout.tsx:66-85
if (orgUser.status !== 'active') {
  return (
    <div>Account Inactive - Your account is {orgUser.status}</div>
  )
}
```

**Dashboard** (❌ MISSING):
- No equivalent status check exists
- Relies on non-existent "approval check will happen in dashboard layout"

---

## Security Impact

### Data Exposure
| Data Type | Exposed to Pending Users | Severity |
|-----------|-------------------------|----------|
| All site names and locations | ✅ YES | HIGH |
| Battery levels and capacity | ✅ YES | HIGH |
| Solar generation data | ✅ YES | MEDIUM |
| Load consumption data | ✅ YES | MEDIUM |
| Equipment details | ✅ YES | MEDIUM |
| Real-time telemetry | ✅ YES | HIGH |
| System statistics | ✅ YES | MEDIUM |

### Business Impact
- **Compliance Risk:** Unapproved users accessing sensitive energy infrastructure data
- **Data Privacy:** Violates principle of least privilege
- **Audit Trail:** Approved workflow exists but is not enforced
- **User Confusion:** No feedback about pending status

---

## Recommended Solution

### Option 1: Server-Side Dashboard Layout (RECOMMENDED)
Convert `app/dashboard/layout.tsx` to server component with status check:

```typescript
// app/dashboard/layout.tsx
import { stackServerApp } from '@/app/stack'
import { redirect } from 'next/navigation'
import { db } from '@/src/db'
import { organizationUsers } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect('/login')
  }

  const [orgUser] = await db
    .select()
    .from(organizationUsers)
    .where(eq(organizationUsers.stackUserId, user.id))
    .limit(1)

  if (!orgUser) {
    redirect('/login?error=not_registered')
  }

  // 🔒 CRITICAL: Block pending users
  if (orgUser.status === 'pending') {
    return (
      <PendingApprovalPage userEmail={user.primaryEmail || ''} />
    )
  }

  if (orgUser.status !== 'active') {
    return (
      <AccountInactivePage status={orgUser.status} />
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
```

### Option 2: Middleware Enhancement (ALTERNATIVE)
Add status check directly in middleware:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 🔒 Check user status in database
    const [orgUser] = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.stackUserId, user.id))
      .limit(1)

    if (!orgUser || orgUser.status !== 'active') {
      return NextResponse.redirect(new URL('/pending-approval', request.url))
    }

    return NextResponse.next()
  }
  return NextResponse.next()
}
```

**Pros/Cons:**

| Approach | Pros | Cons |
|----------|------|------|
| **Option 1: Server Layout** | ✅ Consistent with `/management` pattern<br>✅ Can show custom pending UI<br>✅ Server-side rendering | ❌ Converts client layout to server |
| **Option 2: Middleware** | ✅ Centralized auth<br>✅ Runs before page load | ❌ Limited UI customization<br>❌ Adds DB query to every request |

### Recommended: **Option 1** - Matches existing `/management` authorization pattern

---

## Additional Improvements Needed

### 1. Add Pending Approval Page
Create `/app/pending-approval/page.tsx`:
```typescript
export default function PendingApprovalPage({ userEmail }: { userEmail: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
        <p className="text-gray-600 mb-4">
          Your account ({userEmail}) has been created but requires administrator
          approval before you can access the dashboard.
        </p>
        <p className="text-sm text-gray-500">
          You will receive an email notification once your account is approved.
        </p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    </div>
  )
}
```

### 2. Post-Signup Redirect
Update Stack Auth configuration to redirect to `/pending-approval` after signup instead of `/dashboard`.

### 3. Email Notifications
Ensure email notifications are sent (currently only console logs):
- Admin notification on new signup
- User notification on approval/rejection

### 4. Audit Log Verification
Verify `user_activity_log` captures:
- ✅ `user_created` - Confirmed in database
- ⏳ `user_approved` - Not yet tested
- ⏳ `user_rejected` - Not yet tested

---

## Testing Checklist

- [x] New user signup creates pending record
- [x] Pending user record in database verified
- [x] **FAILED:** Pending user blocked from dashboard
- [x] **FAILED:** Pending approval message shown
- [x] Management console correctly blocks pending users
- [ ] Admin can view pending users list
- [ ] Admin can approve user
- [ ] Approved user can access dashboard
- [ ] Admin can reject user
- [ ] Rejected user remains blocked
- [ ] Audit logs capture all actions
- [ ] Email notifications sent (or logged)

---

## Files Requiring Changes

1. ✏️ **`app/dashboard/layout.tsx`** - Add server-side status check (PRIMARY FIX)
2. ✏️ **`middleware.ts`** - Update comment at line 47 (remove misleading claim)
3. ➕ **`app/pending-approval/page.tsx`** - New file for pending users
4. ➕ **`components/management/pending-approval-ui.tsx`** - Reusable component
5. ⚙️ **Stack Auth config** - Update post-signup redirect

---

## Verification Steps

After implementing fix:

1. **Create new test user**
   ```bash
   testuser+$(date +%s)@example.com
   ```

2. **Verify blocked from dashboard**
   - Should redirect to `/pending-approval`
   - Should see clear pending message
   - Should NOT see any dashboard data

3. **Verify management console still works**
   - Admin should access `/management/users/pending`
   - Should see new user in pending list

4. **Test approval flow**
   - Admin approves user
   - User can then access dashboard
   - Audit log records approval

5. **Test rejection flow**
   - Create second user
   - Admin rejects
   - User remains blocked
   - Audit log records rejection

---

## Related Files

- `middleware.ts:17-58` - Current middleware (missing status check)
- `app/dashboard/layout.tsx:1-52` - Dashboard layout (no auth)
- `app/dashboard/page.tsx:13-19` - Dashboard page (sync only)
- `app/management/layout.tsx:66-85` - Management layout (✅ CORRECT pattern)
- `src/lib/actions/users.ts` - User approval functions
- `docs/fix_bugs/user-signup-approval-sync.md` - Related documentation

---

## Conclusion

**Status:** 🔴 **CRITICAL BUG CONFIRMED**

The user approval workflow is fundamentally broken. While users are correctly created with `pending` status and the management console properly enforces authorization, the main dashboard has **zero status checking**, allowing pending users full access to all system data.

The fix is straightforward: apply the same server-side authorization pattern used in `/management/layout.tsx` to the dashboard layout. This is a **critical security issue** that must be addressed before production deployment.

**Next Steps:**
1. Implement Option 1 (server-side dashboard layout)
2. Add pending approval page
3. Update Stack Auth redirect configuration
4. Test complete approval workflow
5. Verify audit logging
6. Deploy fix with migration plan for existing pending users
