// src/components/profile/HelpScreen.tsx

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft, LifeBuoy, Zap } from "lucide-react";

interface HelpScreenProps {
  onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  const faqs = [
    {
      question: "How can I improve my match rate?",
      answer: "To improve your match rate, make sure you have a complete profile with at least 4-6 high-quality photos, a detailed bio, and listed interests. Being active on the app also helps!",
    },
    {
        question: "What happens when I run out of likes?",
        answer: "Free users have a limited number of likes that reset every 12 hours. This encourages more thoughtful swiping. If you want unlimited likes, you can upgrade to our premium subscription.",
    },
    {
        question: "How does the matching process work?",
        answer: "You are shown profiles based on your preferences and location. If you like someone and they like you back, it's a match! You can then start a conversation in the messages tab."
    },
    {
      question: "How do I edit my profile?",
      answer: "You can edit your profile information, including your bio, photos, interests, and personal details, by tapping the 'Edit Profile' button on your profile screen.",
    },
    {
      question: "How can I report or block someone?",
      answer: "If you encounter a profile that violates our guidelines or makes you feel uncomfortable, you can report or block them by tapping the menu on their profile. Reporting helps keep our community safe.",
    },
    {
      question: "How do I delete my account?",
      answer: "To permanently delete your account, go to 'Account Settings' from your profile page. Please be aware that this action is irreversible and will erase all your matches and conversations.",
    }
  ];

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Help & Support</h1>
        <div className="w-9"></div> {/* Spacer to center title */}
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Still need help?</CardTitle>
            </CardHeader>
            <CardContent>
                 <p className="text-sm text-muted-foreground mb-4">
                    If you can't find the answer you're looking for, please get in touch with our support team.
                 </p>
                 <Button className="w-full">
                    <LifeBuoy className="h-4 w-4 mr-2" />
                    Contact Support
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}