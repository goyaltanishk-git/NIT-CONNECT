import { supabase, syncAppSession } from "@/integrations/supabase/client";

/**
 * Diagnostic utility for job search authorization and filtering
 * Use this to verify users can only see jobs for their branch/graduation batch
 */

export async function diagnoseJobSearchAuthorization(userEmail: string) {
  const email = userEmail.toLowerCase();
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    user: email,
  };

  try {
    console.log("🔍 Starting job search authorization diagnosis...");

    // Step 1: Check user profile
    console.log("\n1️⃣ Checking user profile...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, branch, graduation_batch")
      .eq("email", email)
      .single();

    if (profileError) {
      results.profileError = profileError.message;
      console.error("❌ Profile fetch error:", profileError);
      return results;
    }

    results.userProfile = {
      email: profile.email,
      branch: profile.branch,
      graduation_batch: profile.graduation_batch,
    };
    console.log("✅ User profile:", profile.branch, profile.graduation_batch);

    // Step 2: Ensure session
    console.log("\n2️⃣ Setting up app session...");
    await syncAppSession(email);
    const { error: sessionError } = await (supabase as any).rpc("set_app_session_user", {
      user_email: email,
    });

    if (sessionError) {
      results.sessionError = sessionError.message;
      console.error("❌ Session error:", sessionError);
      return results;
    }
    console.log("✅ Session established");

    // Step 3: Check daily status
    console.log("\n3️⃣ Fetching daily status...");
    const { data: statusData, error: statusError } = await (supabase as any).rpc(
      "jobs_get_daily_status",
      { p_tz: "Asia/Kolkata" }
    );

    if (statusError) {
      results.statusError = statusError.message;
      console.error("❌ Daily status error:", statusError);
      return results;
    }

    const status = Array.isArray(statusData) ? statusData[0] : statusData;
    results.dailyStatus = {
      today: status.today,
      daily_limit: status.daily_limit,
      served_count: status.served_count,
      interacted_count: status.interacted_count,
      is_locked: status.is_locked,
      resets_at: status.resets_at,
    };
    console.log("✅ Daily status:", {
      served: status.served_count,
      interacted: status.interacted_count,
      limit: status.daily_limit,
      locked: status.is_locked,
    });

    // Step 4: Fetch available jobs for this user
    console.log("\n4️⃣ Fetching job feed...");
    const { data: feedData, error: feedError } = await (supabase as any).rpc(
      "jobs_get_daily_feed",
      { p_tz: "Asia/Kolkata" }
    );

    if (feedError) {
      results.feedError = feedError.message;
      console.error("❌ Feed error:", feedError);
      return results;
    }

    const jobs = Array.isArray(feedData) ? feedData : [];
    results.jobsShown = jobs.length;
    results.jobs = jobs.map((j: any) => ({
      slot_no: j.slot_no,
      job_id: j.job_id,
      title: j.title,
      company_name: j.company_name,
    }));

    console.log(`✅ Found ${jobs.length} jobs for user`);

    if (jobs.length === 0) {
      console.warn("⚠️ No jobs found. This could mean:");
      console.warn("   - No jobs targeting this user's branch/batch combination");
      console.warn("   - All jobs have expired");
      console.warn("   - All jobs are paused/closed");
    }

    // Step 5: Query all active jobs (admin check)
    console.log("\n5️⃣ Checking total active jobs in system...");
    const { data: allJobs, error: allJobsError } = await supabase
      .from("jobs")
      .select("id, title, company_name, status")
      .eq("status", "active")
      .limit(100);

    if (!allJobsError && allJobs) {
      results.totalActiveJobs = allJobs.length;
      console.log(`✅ Total active jobs: ${allJobs.length}`);
    }

    // Step 6: Check target groups for available jobs
    if (jobs.length > 0 && profile.branch && profile.graduation_batch) {
      console.log("\n6️⃣ Verifying target group filtering...");
      const jobIds = jobs.map((j: any) => j.job_id);

      const { data: targetGroups, error: tgError } = await supabase
        .from("job_target_groups")
        .select("job_id, target_branch, target_graduation_batch")
        .in("job_id", jobIds);

      if (!tgError && targetGroups) {
        const validGroups = targetGroups.filter(
          (tg: any) =>
            tg.target_branch.toLowerCase() === profile.branch.toLowerCase() &&
            tg.target_graduation_batch === profile.graduation_batch
        );
        results.targetGroupsMatched = validGroups.length;
        console.log(`✅ ${validGroups.length} target groups matched user's branch/batch`);
      }
    }

    // Generate summary
    console.log("\n📊 DIAGNOSIS SUMMARY");
    console.log("=".repeat(50));
    console.log(`User: ${email}`);
    console.log(`Branch: ${profile.branch}, Batch: ${profile.graduation_batch}`);
    console.log(`Jobs shown today: ${results.jobsShown}/${status.daily_limit}`);
    console.log(`Interactions: ${status.interacted_count}/2`);
    console.log(`Status: ${status.is_locked ? "🔒 LOCKED" : "🟢 ACTIVE"}`);

    if (results.jobsShown === 0) {
      console.warn("\n⚠️ ACTION REQUIRED: User is not seeing any jobs");
      console.warn("Possible causes:");
      console.warn("1. No jobs exist for this branch/batch combination");
      console.warn("2. Jobs are expired or not active");
      console.warn("3. Authorization/RLS issue");
    } else {
      console.log("\n✅ User can see jobs - authorization working correctly");
    }

    results.success = true;
  } catch (err: any) {
    console.error("❌ Diagnosis failed:", err);
    results.error = err.message;
    results.success = false;
  }

  return results;
}

/**
 * Check if admin user can add jobs
 */
export async function diagnoseAdminAccess(userEmail: string) {
  const email = userEmail.toLowerCase();
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    user: email,
  };

  try {
    console.log("🔐 Checking admin access...");

    await syncAppSession(email);
    const { error: sessionError } = await (supabase as any).rpc("set_app_session_user", {
      user_email: email,
    });

    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      return results;
    }

    const { data, error } = await (supabase as any).rpc("jobs_admin_can_add");

    if (error) {
      console.error("❌ Admin check error:", error);
      results.error = error.message;
      return results;
    }

    const row = Array.isArray(data) ? data[0] : data;
    results.isAdmin = Boolean(row?.can_add);
    results.actor_email = row?.actor_email;

    if (results.isAdmin) {
      console.log("✅ User is admin and can add jobs");
    } else {
      console.log("❌ User is not an admin");
    }

    results.success = true;
  } catch (err: any) {
    console.error("❌ Admin diagnosis failed:", err);
    results.error = err.message;
    results.success = false;
  }

  return results;
}

/**
 * Log all diagnosis information
 */
export function logDiagnosisReport(diagnosis: Record<string, any>) {
  console.group("📋 Full Diagnosis Report");
  console.table(diagnosis);
  console.groupEnd();
}
