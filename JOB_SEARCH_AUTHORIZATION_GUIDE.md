# Job Search Authorization & Filtering Guide

## Overview
The job search system implements a complete authorization layer to ensure users only see jobs matching their:
- **Branch** (e.g., "CSE", "ECE")
- **Graduation Batch** (year format: YYYY, e.g., 2026, 2027)

## How Authorization Works

### 1. User Profile Data
Each user has a profile with:
```sql
branch text              -- e.g., 'CSE', 'ECE', 'ME'
graduation_batch integer -- e.g., 2026, 2027
```

### 2. Job Target Groups
When an admin creates a job, they specify which branch/batch combinations should see it:
```sql
job_target_groups (
  job_id uuid,
  target_branch text,
  target_graduation_batch integer
)
```

Example: A job for "CSE 2027" branch + "2027" graduation batch only.

### 3. Daily Feed Generation (`jobs_get_daily_feed`)
When a user requests their job feed:

**Step 1:** Get user's profile data
```sql
SELECT p.branch, p.graduation_batch
FROM public.profiles p
WHERE lower(p.email) = v_email
```

**Step 2:** Filter jobs by matching target groups
```sql
AND EXISTS (
  SELECT 1
  FROM public.job_target_groups tg
  WHERE tg.job_id = j.id
    AND lower(tg.target_branch) = lower(v_branch)
    AND tg.target_graduation_batch = v_batch
)
```

**Step 3:** Only active, non-expired jobs are returned
```sql
WHERE j.status = 'active'
  AND (j.expires_at IS NULL OR j.expires_at > now())
```

### 4. Daily Slot Limits
Each user gets 2 job slots per day (IST timezone):
- **Slot 1 & 2** = swipe opportunities
- Resets daily at midnight IST
- Cannot interact with more than 2 jobs per day

### 5. Row Level Security (RLS)

All job tables have RLS policies that **deny direct access** to authenticated users:

```sql
CREATE POLICY "job_admins_no_direct_access" ON public.job_admins 
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "jobs_no_direct_access" ON public.jobs 
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "job_target_groups_no_direct_access" ON public.job_target_groups 
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
```

**Users MUST go through RPC functions** - they cannot query tables directly.

### 6. Authorized RPC Functions

Only these functions are available to users:

| Function | Purpose | Authorization |
|----------|---------|-----------------|
| `jobs_get_daily_feed` | Get 2 jobs for today | Branch+batch match required |
| `jobs_get_daily_status` | Check swipe count/limits | Current user only |
| `jobs_record_swipe` | Like/pass a job | Must be in daily feed |
| `jobs_admin_can_add` | Check admin status | Email must be in job_admins |
| `jobs_admin_add_job` | Create new job | Admin only |
| `jobs_create_target_group` | Create branch group | Admin only |

### 7. Session Management

Each RPC call validates the user via `app_session_email()`:

```sql
CREATE FUNCTION public.app_session_email()
RETURNS text AS $$
  SELECT lower(nullif(current_setting('app.current_user_email', true), ''));
$$;
```

The session email is set by the client before each RPC call:
```typescript
await syncAppSession(userEmail);
await (supabase as any).rpc("set_app_session_user", {
  user_email: userEmail.toLowerCase(),
});
```

## Verification Checklist

✅ **User can only see jobs for their branch**
- Example: CSE student sees only CSE jobs

✅ **User can only see jobs for their graduation batch**
- Example: 2027 batch student sees only 2027 jobs

✅ **Direct table access is blocked**
- Users cannot query `jobs`, `job_target_groups`, etc. directly
- Must use RPC functions

✅ **Admin-only operations protected**
- Only emails in `job_admins` can add jobs
- Only they can create branch groups

✅ **Daily limits enforced**
- Max 2 jobs per day, resets at midnight IST
- Swiped/Passed counts tracked

✅ **Invalid jobs filtered out**
- Expired jobs hidden
- Paused/closed jobs hidden
- Jobs without matching target groups hidden

## Common Issues & Fixes

### Issue: "No active jobs match your branch and graduation batch"
**Cause:** No jobs exist for user's branch/batch combination

**Fix:** 
1. Admin creates a job
2. When adding job, select user's branch and graduation batch year
3. User should see it in next refresh

### Issue: 400 Bad Request on job creation
**Cause:** Target groups validation failed

**Fixes:**
- ✅ Branch name must not be empty
- ✅ Graduation batch must be 4-digit year (YYYY)
- ✅ At least one valid target group required

### Issue: User sees jobs from other branches
**Cause:** Target group filtering not working (RLS misconfiguration)

**Debug:**
```sql
-- Check user's profile
SELECT branch, graduation_batch FROM profiles 
WHERE email = 'user@example.com';

-- Check job's target groups
SELECT * FROM job_target_groups 
WHERE job_id = '<job_uuid>';

-- Verify branch/batch matching (case-insensitive for branch)
SELECT * FROM job_target_groups 
WHERE lower(target_branch) = lower('CSE')
  AND target_graduation_batch = 2027;
```

## Testing Authorization

### Test 1: User A (CSE, 2027) vs User B (ECE, 2026)

1. Admin creates job → Target: CSE, 2027
2. User A fetches feed → Should see job ✓
3. User B fetches feed → Should NOT see job ✓

### Test 2: Daily Limits

1. User swipes job 1 → Remaining: 1
2. User swipes job 2 → Remaining: 0, is_locked: true
3. Next day (after midnight IST) → Reset to 2 ✓

### Test 3: Job Expiration

1. Admin creates job with expiration
2. After expiration time → Job hidden ✓

## Transaction Safety

- Job creation uses ACID transactions
- Daily slot allocation uses advisory locks to prevent race conditions
- Swipe recording is atomic with counter verification

## Performance Considerations

**Indexes for filtering:**
```sql
idx_job_target_groups_lookup (target_branch, target_graduation_batch)
idx_jobs_active_expiry (status, expires_at)
idx_job_daily_slots_user_date (user_email, slot_date)
```

These ensure fast branch/batch filtering and daily limit checks.

