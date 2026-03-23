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
    question: "What is NIT Connect (NITVerse)?",
    answer:
      "NIT Connect is an all-in-one platform exclusively for NIT students. It combines social networking, dating, communities, and career opportunities in a single app built for the NIT ecosystem.",
  },
  {
    question: "What is the NIT News section?",
    answer:
      "NIT News is like an Instagram-style feed where students can share updates, events, and important news related to NIT campuses. You can browse, engage, and stay updated with campus activities.",
  },
  {
    question: "How does the community/Discord section work?",
    answer:
      "The community section allows you to join groups based on interests, branches, or topics. It works similar to Discord where you can interact, chat, and collaborate with other students.",
  },
  {
    question: "How many communities can I join?",
    answer:
      "You can join multiple communities based on your interests. There is no strict limit, so feel free to explore and be part of different groups across academics, hobbies, and discussions.",
  },
  {
    question: "How does the dating feature work?",
    answer:
      "The dating section allows you to discover and connect with other verified NIT students. If both users like each other, it's a match and you can start chatting securely within the app.",
  },
  {
    question: "Is NIT Connect safe and verified?",
    answer:
      "Yes, only users with valid NIT institute email IDs can register. This ensures that all profiles are genuine and part of the NIT community.",
  },
  {
    question: "What is the Jobs/Internships section?",
    answer:
      "The jobs section provides curated internship and full-time opportunities for NIT students. You can find companies, explore roles, and directly access application links.",
  },
  {
    question: "Can I apply to companies directly through the app?",
    answer:
      "Yes, each job or internship listing includes a direct link to apply on the company's official portal.",
  },
  {
    question: "How do I report inappropriate content or users?",
    answer:
      "You can report posts, profiles, or messages directly from the app. Our team reviews reports and takes strict action to maintain a safe environment.",
  },
];

  return (
    <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="glass border-b border-white/10 sticky top-0 z-50 p-4 flex items-center">
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