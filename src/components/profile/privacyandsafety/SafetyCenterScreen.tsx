import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft, ShieldCheck } from "lucide-react";

interface SafetyCenterScreenProps {
  onBack: () => void;
}

export function SafetyCenterScreen({ onBack }: SafetyCenterScreenProps) {
  const safetyTips = [
    {
      title: "Genuine NIT Community",
      content:
        "All profiles on this platform belong to verified NIT students. Registration is restricted to institute email IDs, ensuring a genuine and trusted community experience.",
    },
    {
      title: "Protect Your Information",
      content:
        "Do not share your phone number too early. Avoid sharing hostel or home address. Never share OTPs or financial details. Keep your profile information limited.",
    },
    {
      title: "Trust Your Instincts",
      content:
        "If something feels wrong, leave immediately. You can block or report users anytime. Never feel pressured into anything.",
    },
    {
      title: "Avoid Scams",
      content:
        "Never send money to anyone on the platform. Avoid clicking suspicious links. Stay alert for fake profiles.",
    },
    {
      title: "Group Chats & Communities",
      content:
        "Avoid joining unknown groups. Do not download files from strangers. Leave any group that feels unsafe.",
    },
    {
      title: "Anonymous Users",
      content:
        "Not everyone is who they claim to be. Be cautious with emotional stories. Avoid oversharing personal details.",
    },
    {
      title: "User Profiles",
      content:
        "Do not trust profile photos alone. Watch for inconsistencies. Try to stay on the platform before moving elsewhere.",
    },
    {
      title: "Report & Block",
      content:
        "Block users instantly if needed. Report harassment or suspicious activity. Strict action is taken against repeated violations.",
    },
    {
      title: "Women Safety",
      content:
        "Use incognito mode if needed. Control when to reveal your identity. Safety concerns are given priority support.",
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="glass border-b border-white/10 sticky top-0 z-50 p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-white/10 text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Safety Center</h1>
        <div className="w-9"></div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              Safety Guidelines
            </CardTitle>
            <p className="text-sm text-gray-400 pt-1">
              Follow these guidelines to ensure a safe and positive experience.
            </p>
          </CardHeader>

          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {safetyTips.map((tip, index) => (
                <AccordionItem
                  value={`item-${index}`}
                  key={index}
                  className="border-white/10"
                >
                  <AccordionTrigger className="hover:text-green-400 transition-colors">
                    {tip.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400">
                    {tip.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm">
          Take your time. Genuine connections don’t rush.
        </p>
      </div>
    </div>
  );
}