import { useState } from "react";
import { Heart, Sparkles, Gift, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const GIRLS = [];
const BOYS = [];

export function LeaderboardScreen() {
  const [active, setActive] = useState<"girls" | "boys">("girls");
  const [likes, setLikes] = useState<Record<string, number>>({});

  const list = active === "girls" ? GIRLS : BOYS;

  const handleLike = (name: string) => {
    setLikes((prev) => ({
      ...prev,
      [name]: (prev[name] || Math.floor(Math.random() * 40 + 60)) + 1,
    }));
  };

  return (
    <>
      <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">

        <div className="p-6 space-y-6">

          {/* HERO – MAIN HEADLINE */}
          <Card className="glass-light border-pink-500/30 shadow-lg shadow-pink-500/20">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 animate-pulse">
                  <Gift className="h-4 w-4 text-pink-500" />
                </div>
                <div>
                <h1 className="text-2xl font-bold gradient-text-animated mb-4">
              Valentine Surprise Event 💘
            </h1>
                  <p className="text-lg text-gray-300 leading-relaxed ">
                    The most liked <b>boy</b> and <b>girl</b> during Valentine’s
                    Week will receive a special surprise gift from{" "}
                    <span className="text-white font-semibold">NITConnect</span>.
                  </p>
                  <p className="text-sm text-pink-400 font-semibold mt-2">
                    ❤️ Results to be  announced on Feb 14
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MOST LIKED SECTION */}
         {/* MOST LIKED SECTION */}
{/* MOST LIKED SECTION */}
<Card className="border border-white/10 bg-white/5">
  <CardContent className="p-10 space-y-4">

    {/* HEADING */}
    <h2 className="text-2xl font-bold text-pink-200 flex items-center gap-4">
  <span className="text-pink-500"><Trophy></Trophy></span>
  Most Liked Profiles
</h2>


    {/* TOGGLE */}
    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
      {["girls", "boys"].map((type) => (
        <Button
          key={type}
          onClick={() => setActive(type as any)}
          className={`flex-1 h-11 rounded-lg font-semibold border-0 ${
            active === type
              ? "bg-pink-500 text-white"
              : "bg-transparent text-gray-400 hover:text-white"
          }`}
        >
          {type.toUpperCase()}
        </Button>
      ))}
    </div>

    {/* NAMES ONLY */}
    <div className="space-y-2">
      {list.map((name, index) => (
        <div
          key={name}
          className="px-4 py-3 rounded-lg border border-white/10 text-white text-lg text-center"
        >
           {name}
        </div>
      ))}
    </div>

  </CardContent>
</Card>


        </div>
      </div>

      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </>
  );
}
