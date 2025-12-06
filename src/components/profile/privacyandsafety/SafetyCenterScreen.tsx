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
      title: "Meet Safely in Public",
      content: "Always arrange to meet for the first time in a public place, like a coffee shop or restaurant. Avoid private or remote locations. Let a friend or family member know your plans, including where you're going and who you're meeting.",
    },
    {
      title: "Protect Your Personal Information",
      content: "Be cautious about sharing personal details like your home or work address, phone number, or financial information. Get to know someone before sharing more sensitive information.",
    },
    {
      title: "Trust Your Instincts",
      content: "If something feels off, it probably is. Don't hesitate to end a conversation or a date if you feel uncomfortable or unsafe. Your safety is the top priority.",
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">
      <div className="glass border-b border-white/10 sticky top-0 z-50 p-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/10 text-white">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Safety Center</h1>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      <div className="p-6 space-y-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              Top Safety Tips
            </CardTitle>
             <p className="text-sm text-gray-400 pt-1">
              Follow these guidelines to help ensure a safe and positive experience.
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {safetyTips.map((tip, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-white/10">
                  <AccordionTrigger className="hover:text-green-400 transition-colors">{tip.title}</AccordionTrigger>
                  <AccordionContent className="text-gray-400">
                    {tip.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}