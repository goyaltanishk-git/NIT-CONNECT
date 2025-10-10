// src/components/profile/privacyandsafety/ReportConcernScreen.tsx

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Send } from "lucide-react";

interface ReportConcernScreenProps {
  onBack: () => void;
}

export function ReportConcernScreen({ onBack }: ReportConcernScreenProps) {
  const handleSubmit = () => {
    // In a real application, you would handle the form submission here,
    // sending the data to your backend for review.
    alert("Your report has been submitted. Our team will review it shortly.");
    onBack();
  };

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Report a Concern</h1>
        <div className="w-9"></div> {/* Spacer to keep title centered */}
      </div>

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Submit a Report</CardTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Your safety is our priority. Please provide as much detail as possible.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">Reason for Report</label>
              <Select>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam or Scam</SelectItem>
                  <SelectItem value="inappropriate_photos">Inappropriate Photos</SelectItem>
                  <SelectItem value="harassment">Harassment or Hate Speech</SelectItem>
                  <SelectItem value="underage">Underage User</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">User's Name (if applicable)</label>
              <Input id="username" placeholder="e.g., John D." />
            </div>
            <div className="space-y-2">
              <label htmlFor="details" className="text-sm font-medium">Details of the Incident</label>
              <Textarea id="details" placeholder="Please describe what happened..." rows={5} />
            </div>
            <Button className="w-full" onClick={handleSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Submit Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}