import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualJobEntryTab } from "./ManualJobEntryTab";
import { PendingJobsApprovalTab } from "./PendingJobsApprovalTab";
import { usePendingJobsAdmin } from "@/hooks/usePendingJobsAdmin";
import { useEffect } from "react";
import { Briefcase, ListChecks } from "lucide-react";

export function JobAdminDashboard({ userEmail }: { userEmail?: string }) {
  const { pendingCount, fetchCount } = usePendingJobsAdmin(userEmail);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return (
    <div className="w-full h-full bg-black text-white px-2 py-4 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                 Job Administration
               </h1>
               <p className="text-zinc-400 mt-1">Manage the global job feed and review scraped jobs.</p>
            </div>
         </div>

         <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/5 border border-white/10 p-1 rounded-xl">
               <TabsTrigger 
                  value="pending" 
                  onClick={() => fetchCount()}
                  className="rounded-lg data-[state=active]:bg-pink-600 data-[state=active]:text-white text-zinc-400 transition-all font-medium py-2.5 relative flex items-center justify-center gap-2"
               >
                  <ListChecks className="w-4 h-4" />
                  Review Queue
                  {pendingCount > 0 && (
                     <span className="ml-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-white text-pink-600 text-[10px] font-bold shadow-lg">
                        {pendingCount}
                     </span>
                  )}
               </TabsTrigger>
               <TabsTrigger 
                  value="manual" 
                  className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400 transition-all font-medium py-2.5 flex items-center justify-center gap-2"
               >
                  <Briefcase className="w-4 h-4" />
                  Manual Entry
               </TabsTrigger>
            </TabsList>

            <div className="mt-6">
               <TabsContent value="pending" className="m-0 border-none p-0 outline-none focus-visible:ring-0">
                  <PendingJobsApprovalTab userEmail={userEmail} />
               </TabsContent>
               
               <TabsContent value="manual" className="m-0 border-none p-0 outline-none focus-visible:ring-0">
                  <ManualJobEntryTab userEmail={userEmail} />
               </TabsContent>
            </div>
         </Tabs>
      </div>
    </div>
  );
}
