import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AdminPanel({ email, onClose }: any) {
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = async () => {
    const { data } = await supabase.rpc("get_pending_community_requests", {
      p_email: email,
    });
    setRequests(data || []);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Pending Communities</h2>

      <Button onClick={onClose}>Back</Button>

      {requests.length === 0 ? (
        <p className="text-gray-400 mt-4">No pending requests</p>
      ) : (
        requests.map((r) => (
          <div
            key={r.id}
            className="bg-white/10 p-4 rounded-lg mt-3 flex justify-between"
          >
            <div>
              <h3 className="font-bold">{r.name}</h3>
              <p className="text-sm text-gray-400">{r.description}</p>
              <p className="text-xs text-gray-500">{r.created_by}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  await supabase.rpc("approve_community_request", {
                    p_community_id: r.id,
                    p_email: email,
                  });
                  fetchRequests();
                }}
              >
                Approve
              </Button>

              <Button
                variant="destructive"
                onClick={async () => {
                  await supabase.rpc("reject_community_request", {
                    p_community_id: r.id,
                    p_email: email,
                  });
                  fetchRequests();
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}