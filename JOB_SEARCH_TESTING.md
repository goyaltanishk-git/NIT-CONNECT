# Job Search Testing Checklist

## Prerequisites
- Access to browser DevTools (F12)
- Two test user accounts with different branches/batches
- Admin account (in job_admins table)

---

## Test Scenario 1: Authorization - Users See Only Their Branch/Batch

### Setup
- User A: CSE branch, graduation batch 2027
- User B: ECE branch, graduation batch 2026
- Job 1: Target = CSE, 2027
- Job 2: Target = ECE, 2026

### Test Steps

#### Step 1.1: Admin Creates Job for CSE 2027
1. Admin opens Job Admin panel
2. Click "Add New Job"
3. Fill form:
   - Job Title: "CSE Internship Test"
   - Company: "Test Corp"
   - Location: "Bangalore"
   - Employment Type: "Internship"
   - Work Mode: "Remote"
   - Application URL: "https://test.com/apply"
   - Target Batch: **2027**
   - Select Branch: **CSE**
4. Submit

**Expected:** Job created successfully ✅

**If 400 Error:**
- Check browser console (F12 → Network tab)
- Look for RPC error details
- Branch name must not be empty
- Batch must be exactly 4 digits (2027, not 27)

#### Step 1.2: User A (CSE 2027) Fetches Jobs
1. User A signs in
2. Goes to Job Search screen
3. Open browser console (F12)
4. Run diagnostic:
   ```javascript
   import { diagnoseJobSearchAuthorization } from "@/utils/jobSearchDiagnostics";
   const result = await diagnoseJobSearchAuthorization("userA@nitkkr.ac.in");
   console.log(result);
   ```

**Expected Output:**
```
✅ User can see jobs - authorization working correctly
Jobs shown: 1/2
User Profile: branch=CSE, batch=2027
```

**If No Jobs Found:**
```
⚠️ No jobs found
Check:
1. Job exists in database (jobs table)
2. Job target groups created (job_target_groups table)
3. User's profile has correct branch/batch
```

#### Step 1.3: User B (ECE 2026) Fetches Jobs
1. User B signs in
2. Goes to Job Search screen
3. Run same diagnostic
4. Check browser console

**Expected:** 0 jobs shown (not authorized for CSE 2027 job) ✅

**If User B Sees the CSE Job:**
- This indicates **AUTHORIZATION FAILURE**
- Run SQL check:
  ```sql
  SELECT * FROM job_target_groups 
  WHERE job_id = '<job_uuid>';
  -- Should show: target_branch = 'CSE', target_graduation_batch = 2027
  
  SELECT * FROM job_admins;
  -- Verify RLS policies are active
  ```

#### Step 1.4: Admin Creates Job for ECE 2026
1. Repeat Step 1.1 but select **ECE** branch and **2026** batch
2. User B should now see this job
3. User A should NOT see this job ✅

---

## Test Scenario 2: Daily Limits

### Setup
- 1 user account
- At least 2 active jobs for user's branch/batch

### Test Steps

#### Step 2.1: First Swipe (0/2 interactions)
1. User sees job 1
2. User swipes "LIKE" or "PASS"
3. Observe:
   - Animation plays
   - Job card disappears
   - Console shows: `Interactions: 1/2` ✅

#### Step 2.2: Second Swipe (1/2 interactions)
1. User sees job 2
2. User swipes
3. Observe:
   - Console shows: `Interactions: 2/2`
   - Status shows: `🔒 LOCKED` ✅

#### Step 2.3: Try Third Swipe (2/2 interactions)
1. User tries to swipe another job
2. Observe:
   - "Daily Limit Alert" shows up
   - Cannot swipe further ✅

#### Step 2.4: Reset After Midnight IST
1. Wait until midnight IST (or mock time in test)
2. Refresh page
3. Observe:
   - `Interactions: 0/2`
   - `🟢 ACTIVE`
   - Can swipe again ✅

---

## Test Scenario 3: Job Expiration

### Setup
- Admin creates job with expiration date

### Test Steps

#### Step 3.1: Create Job with Future Expiration
1. Admin creates job
2. Sets expiration to: tomorrow at noon
3. User should see job ✅

#### Step 3.2: Job Expires
1. Wait until expiration time (or manually update `jobs.expires_at` in DB)
2. User refreshes job feed
3. Job should disappear ✅

---

## Test Scenario 4: Admin Authorization

### Setup
- Admin account (in job_admins table)
- Non-admin account

### Test Steps

#### Step 4.1: Admin Can Add Jobs
1. Admin signs in
2. Sees "Add Job" button in Job Search
3. Can access job admin form ✅

#### Step 4.2: Non-Admin Cannot Add Jobs
1. Regular user signs in
2. Does NOT see "Add Job" button ✅
3. If user somehow tries to call RPC:
   ```javascript
   import { supabase, syncAppSession } from "@/integrations/supabase/client";
   await syncAppSession("user@example.com");
   await (supabase as any).rpc("jobs_admin_add_job", {...});
   // Should error: "NOT_AUTHORIZED_ADMIN"
   ```

---

## Test Scenario 5: Branch/Batch Format Validation

### Setup
- Test various invalid formats

### Test Steps

#### Step 5.1: Invalid Batch (Not 4 Digits)
1. Admin fills job form
2. Target Batch: "27" (only 2 digits)
3. Try to submit
4. Observe: Submit button disabled or error ✅

#### Step 5.2: Invalid Batch (Non-Numeric)
1. Target Batch: "202A"
2. Cannot submit ✅

#### Step 5.3: Empty Branch
1. No branches selected
2. Cannot submit ✅

#### Step 5.4: Valid Format
1. Target Batch: "2027"
2. Branch: "CSE"
3. Can submit ✅

---

## Test Scenario 6: RPC Session Management

### Setup
- Test session expiration and reconnection

### Test Steps

#### Step 6.1: Session Established
1. User signs in
2. First job fetch initiates `set_app_session_user`
3. Jobs load successfully ✅

#### Step 6.2: Session Timeout (Simulated)
1. User goes idle for >1 hour
2. Tries to swipe job
3. App automatically re-establishes session
4. Swipe works ✅

---

## Debugging Guide

### Use the Diagnostic Utility in Browser Console

```javascript
// Import and use diagnostics
import { diagnoseJobSearchAuthorization } from "@/utils/jobSearchDiagnostics";
import { diagnoseAdminAccess } from "@/utils/jobSearchDiagnostics";

// Check user can see jobs
const authDiag = await diagnoseJobSearchAuthorization("user@nitkkr.ac.in");
console.log(authDiag);

// Check admin status
const adminDiag = await diagnoseAdminAccess("admin@nitkkr.ac.in");
console.log(adminDiag);
```

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "rpc"
4. Look for:
   - `jobs_get_daily_feed` - should return jobs
   - `jobs_admin_add_job` - should return job_id
   - `jobs_record_swipe` - should return success: true

### View Database Directly (Supabase Dashboard)

1. `profiles` table:
   - Verify user has `branch` and `graduation_batch`

2. `jobs` table:
   - Verify job has `status = 'active'`
   - Check `expires_at` is in future

3. `job_target_groups` table:
   - Verify entries exist for each job
   - Check `target_branch` and `target_graduation_batch` match

4. `job_daily_slots` table:
   - Verify user gets 2 new slots per day
   - Check `slot_date` matches today's date (IST)

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request on job creation | Invalid target groups | Check batch format (YYYY), branch not empty |
| 400 Bad Request | Empty target groups array | Select at least one branch |
| "No jobs match your branch..." | Correct behavior | Admin needs to create jobs for this branch/batch |
| User sees all jobs | RLS failure | Check RLS policies enabled on job tables |
| Daily limit not reset | Time zone issue | IST timezone should be used (Asia/Kolkata) |
| "JOB_NOT_IN_TODAY_SLOTS" | Invalid job ID | Job might be expired or not showing |

---

## Sign-Off Checklist

After running all tests:

- [ ] Test Scenario 1: Authorization working (users see only their jobs)
- [ ] Test Scenario 2: Daily limits enforced
- [ ] Test Scenario 3: Job expiration works
- [ ] Test Scenario 4: Admin authorization protected
- [ ] Test Scenario 5: Format validation working
- [ ] Test Scenario 6: Session management solid
- [ ] No 400 errors on job creation
- [ ] Console has no authorization warnings
- [ ] Database RLS policies are active
- [ ] All diagnostic outputs show "success: true"

