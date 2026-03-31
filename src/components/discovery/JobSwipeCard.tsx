import { Briefcase, Building2, Clock3, IndianRupee, MapPin, Sparkles, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobFeedItem } from "@/hooks/useJobsFeed";
import React from "react";
import { GlowCard } from "@/components/ui/GlowCard";

interface JobSwipeCardProps {
  job: JobFeedItem;
  onLike: () => void;
  onPass: () => void;
  disabled?: boolean;
}

const formatEmploymentLabel = (type: JobFeedItem["employment_type"]) => {
  if (type === "full_time") return "Full Time";
  if (type === "part_time") return "Part Time";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatWorkModeLabel = (mode: JobFeedItem["work_mode"]) => {
  if (mode === "onsite") return "Onsite";
  if (mode === "remote") return "Remote";
  return "Hybrid";
};

export function JobSwipeCard({ job, onLike, onPass, disabled = false }: JobSwipeCardProps) {
  const computedSalaryLabel = job.stipend_salary_label ||
    (job.stipend_min != null && job.stipend_max != null
      ? `est. ${job.currency_code} ${job.stipend_min}-${job.stipend_max}`
      : "Compensation not disclosed");

  const pills = [
    formatEmploymentLabel(job.employment_type),
    formatWorkModeLabel(job.work_mode),
    computedSalaryLabel,
    ...(job.is_pre_placement_offer ? ["Pre-Placement Offer"] : []),
    ...(job.tag_pills || []),
  ];

  return (
    <div className="h-full w-full">
      <GlowCard customSize className="h-full w-full">
        <div className="flex h-full flex-col p-6">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
              <Briefcase className="mr-1.5 h-3 w-3" />
              NIT Connect Careers
            </div>

            <div>
              <h2 className="text-3xl font-bold leading-tight text-white mb-1">{job.title}</h2>
              <p className="text-lg text-zinc-300 font-medium">{job.company_name}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 text-sm text-zinc-300">
              <span className="inline-flex items-center rounded-full bg-zinc-800/90 px-3 py-1.5">
                <MapPin className="mr-1.5 h-4 w-4 text-emerald-400" />
                {job.location_text}
              </span>
              <span className="inline-flex items-center rounded-full bg-zinc-800/90 px-3 py-1.5">
                <IndianRupee className="mr-1.5 h-4 w-4 text-emerald-400" />
                {computedSalaryLabel}
              </span>
              {job.expires_at && (
                <span className="inline-flex items-center rounded-full bg-amber-600/20 px-3 py-1.5 text-amber-300">
                  <Clock3 className="mr-1.5 h-4 w-4" />
                  Apply before {new Date(job.expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-end flex-1">
            <div className="flex flex-wrap gap-2 mb-6">
              {pills.map((pill, idx) => (
                <span
                  key={`${pill}-${idx}`}
                  className="inline-flex rounded-full border border-pink-400/30 bg-pink-500/10 px-4 py-1.5 text-sm font-medium text-pink-200"
                >
                  {pill}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400">Company</p>
                <div className="mt-1 flex items-center text-sm font-semibold text-zinc-100">
                  <Building2 className="mr-1.5 h-4 w-4 text-cyan-300" />
                  {job.company_name}
                </div>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400">Work Type</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">{formatWorkModeLabel(job.work_mode)}</p>
              </div>
            </div>

            
          </div>

          <div className="mt-auto flex items-center justify-center gap-8 pb-4">
            <Button
              type="button"
              onClick={onPass}
              disabled={disabled}
              className="h-16 w-16 rounded-full border-2 border-red-400/40 bg-red-500/15 text-red-200 hover:bg-red-500/25 transition-transform hover:scale-105 active:scale-95"
            >
              <X className="h-8 w-8 stroke-[3]" />
            </Button>
            <Button
              type="button"
              onClick={onLike}
              disabled={disabled}
              className="h-20 w-20 rounded-full border-2 border-emerald-400/50 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 transition-transform hover:scale-105 active:scale-95"
            >
              <Heart className="h-10 w-10 fill-emerald-400 stroke-emerald-400" />
            </Button>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}