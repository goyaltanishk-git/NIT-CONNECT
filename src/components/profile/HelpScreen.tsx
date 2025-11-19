// src/components/profile/HelpScreen.tsx

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, LifeBuoy, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface HelpScreenProps {
  onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  const faqs = [
    {
      question: "How can I improve my match rate?",
      answer:
        "To improve your match rate, make sure you have a complete profile with at least 4-6 high-quality photos, a detailed bio, and listed interests. Being active on the app also helps!",
    },
    {
      question: "What happens when I run out of likes?",
      answer:
        "Free users have a limited number of likes that reset every 24 hours. This encourages more thoughtful swiping. If you want unlimited likes, you can upgrade to our premium subscription.",
    },
    {
      question: "How does the matching process work?",
      answer:
        "You are shown profiles based on your preferences and location. If you like someone and they like you back, it's a match! You can then start a conversation in the messages tab.",
    },
    {
      question: "How do I edit my profile?",
      answer:
        "You can edit your profile information, including your bio, photos, interests, and personal details, by tapping the 'Edit Profile' button on your profile screen.",
    },
    {
      question: "How can I report or block someone?",
      answer:
        "If you encounter a profile that violates our guidelines or makes you feel uncomfortable, you can report or block them by tapping the menu on their profile. Reporting helps keep our community safe.",
    },
    {
      question: "How do I delete my account?",
      answer:
        "To permanently delete your account, go to 'Account Settings' from your profile page. Please be aware that this action is irreversible and will erase all your matches and conversations.",
    },
  ];

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/10 text-white">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Help & Support</h1>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="p-6 space-y-6">
        {/* FAQ Section */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Zap className="h-5 w-5 text-pink-500" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-white/10">
                  <AccordionTrigger className="text-left text-sm font-medium hover:text-pink-400 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support Section */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Still need help?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3">
            <p className="text-sm text-gray-400 text-center">
              Can't find what you need? Our support team is happy to help! 💌
            </p>

            {/* Gmail button */}
            <motion.a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=nitconnectofficial@gmail.com&su=Need%20Help%20with%20NITconnect"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center w-full p-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all duration-300 shadow-md shadow-pink-900/20"
            >
              <LifeBuoy className="h-5 w-5 mr-2" />
              Contact Support via Gmail
            </motion.a>

            {/* Direct email as plain text */}
            <div className="text-center mt-2">
              <p className="text-pink-400 font-semibold text-sm select-all">
                nitconnectofficial@gmail.com
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Email us directly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}