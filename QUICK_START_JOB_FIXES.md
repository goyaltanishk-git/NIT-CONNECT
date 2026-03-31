# Quick Start: Verifying Your Job Search Fixes

## 🚀 Do This First (5 minutes)

### Step 1: Deploy the SQL Migration
```bash
# Option A: Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of: supabase/migrations/20260323021000_jobs_core_repair.sql
# 3. Paste and run

# Option B: Supabase CLI
supabase db push
```

### Step 2: Rebuild & Deploy Frontend
```bash
# TypeScript/React changes automatically apply on next build
npm run build
# Deploy to production
```

---

## ✅ Verify It Works (10 minutes)

### Test 1: Job Creation No Longer Gets 400 Error

1. **Admin Signs In**
   - User in `job_admins` table

2. **Add New Job**
   - Click "Add New Job" button
   - Fill all fields:
     - Title: "Test Job"
     - Company: "Test Corp"
     - Location: "Remote"
     - Batch: **2027** (keep it 4 digits!)
     - Branch: **Select one**
     - URL: "https://test.com"

3. **Submit**
   - ✅ Should see: "Job added - The job is now live"
   - ❌ Should NOT see: "400 Bad Request" error

### Test 2: Users See Only Their Branch/Batch

1. **Create 2 Jobs**
   - Job A: CSE, 2027
   - Job B: ECE, 2026

2. **User with CSE, 2027 profile**
   - Should see Job A ✅
   - Should NOT see Job B ✅

3. **User with ECE, 2026 profile**
   - Should NOT see Job A
   - Should see Job B ✅

### Test 3: Daily Limits Work

1. **Same user interacts with 2 jobs**
   - After 1st swipe: "1/2 interactions"
   - After 2nd swipe: "2/2 interactions" + 🔒 LOCKED

2. **Can't swipe 3rd job**
   - Shows "Daily Limit Alert"
   - Swipe blocked ✅

---

## 🔍 Debug If Issues Occur

### Issue: Still Getting 400 Error

1. **Check browser console** (F12)
   - What's the exact error message?
   - Copy it

2. **Run diagnostic**:
   ```javascript
   import { diagnoseAdminAccess } from "@/utils/jobSearchDiagnostics";
   const result = await diagnoseAdminAccess("admin@example.com");
   console.table(result);
   ```

3. **Common fixes**:
   - ❌ Batch is "27" → ✅ Make it "2027"
   - ❌ Batch is "2027A" → ✅ Use only digits
   - ❌ No branch selected → ✅ Select at least one branch
   - ❌ Empty target groups → ✅ Branch field not empty

### Issue: User Sees All Jobs (Authorization Broken)

1. **Run diagnostic for user**:
   ```javascript
   import { diagnoseJobSearchAuthorization } from "@/utils/jobSearchDiagnostics";
   const result = await diagnoseJobSearchAuthorization("user@example.com");
   console.table(result);
   ```

2. **Check the output**:
   - User profile branch/batch correct?
   - Jobs shown match that branch/batch?
   - If not → RLS policy issue

3. **Verify RLS is active**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT schemaname, tablename, policydefs
   FROM pg_policies
   WHERE tableName IN ('jobs', 'job_target_groups', 'job_daily_slots');
   -- Should show policies are enabled
   ```

---

## 📋 Quick Reference

### Where to Look for Each Issue

| Problem | File | What to Check |
|---------|------|---|
| 400 error on job add | AddJobDialog.tsx | Batch format (4 digits), branch selected |
| 400 error on RPC call | useJobsAdmin.ts | Console error, target_groups validation |
| No jobs showing | jobs_get_daily_feed SQL | Branch/batch match, job active, not expired |
| User sees wrong jobs | RLS policies | Policies enabled, filtering logic |
| Daily limit not working | useJobsFeed.ts | Daily counter, slot creation |
| Can't add job as admin | job_admins table | Email in table, set is_active = true |

---

## 🎓 Full Documentation Available

For complete details, see these files:

1. **[JOB_SEARCH_AUTHORIZATION_GUIDE.md](JOB_SEARCH_AUTHORIZATION_GUIDE.md)**
   - How the system works
   - Authorization flow
   - Troubleshooting guide

2. **[JOB_SEARCH_TESTING.md](JOB_SEARCH_TESTING.md)**
   - Detailed test scenarios
   - Step-by-step procedures
   - Expected results

3. **[JOB_SEARCH_FIXES_SUMMARY.md](JOB_SEARCH_FIXES_SUMMARY.md)**
   - What was fixed
   - Why it was broken
   - All changes made

---

## 💡 Pro Tips

### Use Console Diagnostic in Browser
- Go to any page
- Press F12 (DevTools)
- Go to Console tab
- Paste and run:
  ```javascript
  import { diagnoseJobSearchAuthorization } from "@/utils/jobSearchDiagnostics";
  await diagnoseJobSearchAuthorization("user@example.com");
  ```

### Check Supabase Dashboard
- **Profiles table**: Verify user branch/graduation_batch
- **Jobs table**: Verify job is active, not expired
- **Job Target Groups**: Verify entries exist and match profile data
- **Job Admins table**: Verify admin email exists, is_active = true

### Monitor Network Requests
- F12 → Network tab
- Filter by "rpc"
- Look for:
  - `jobs_admin_add_job` responses
  - `jobs_get_daily_feed` responses
  - Error details in response body

---

## ✨ You're Done When:
- ✅ Admin creates jobs without 400 errors
- ✅ Users see only their branch jobs
- ✅ Users see only their batch jobs
- ✅ Daily limits work (2 max)
- ✅ Diagnostic outputs show "success: true"
- ✅ No authorization warnings in console

