import { Building2, Clock3, IndianRupee, MapPin, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobFeedItem } from "@/hooks/useJobsFeed";
import React, { useState } from "react";
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
  const [pillsExpanded, setPillsExpanded] = useState(false);
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
  ].filter((pill, index, list) => {
    const normalized = pill.trim().toLowerCase();
    return normalized.length > 0 && list.findIndex((candidate) => candidate.trim().toLowerCase() === normalized) === index;
  });

  return (
    <div className="h-full w-full">
      <GlowCard customSize className="h-full w-full">
        <div className="flex h-full min-h-0 flex-col p-4">
          <div className="flex-1 min-h-0 space-y-3 pr-1 max-h-[45vh] overflow-hidden">
            <div>
              <h2
                className="text-2xl font-bold leading-tight text-white mb-1"
                style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {job.title}
              </h2>
              <p
                className="text-lg text-zinc-300 font-medium"
                style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {job.company_name}
              </p>
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

            <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(() => {
                const MAX = 4;
                const visible = pillsExpanded ? pills : pills.slice(0, MAX);
                const extra = Math.max(0, pills.length - visible.length);
                return (
                  <>
                    {visible.map((pill, idx) => (
                      <span
                        key={`${pill}-${idx}`}
                        className="inline-flex rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-sm font-medium text-pink-200"
                      >
                        {pill}
                      </span>
                    ))}
                    {!pillsExpanded && extra > 0 && (
                      <button
                        type="button"
                        onClick={() => setPillsExpanded(true)}
                        className="inline-flex items-center rounded-full border border-pink-400/20 bg-zinc-800/60 px-3 py-1 text-sm font-medium text-zinc-300 hover:bg-zinc-700/60"
                        aria-expanded={pillsExpanded}
                        aria-label={`Show ${extra} more tags`}
                      >
                        +{extra} more
                      </button>
                    )}
                    {pillsExpanded && pills.length > MAX && (
                      <button
                        type="button"
                        onClick={() => setPillsExpanded(false)}
                        className="inline-flex items-center rounded-full border border-pink-400/20 bg-zinc-800/60 px-3 py-1 text-sm font-medium text-zinc-300 hover:bg-zinc-700/60"
                        aria-expanded={pillsExpanded}
                        aria-label="Show less tags"
                      >
                        Show less
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
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

          <div className="mt-4 flex shrink-0 items-center justify-center gap-8 pb-4 pt-3">
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