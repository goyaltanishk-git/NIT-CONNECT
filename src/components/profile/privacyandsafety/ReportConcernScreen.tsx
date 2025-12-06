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
    alert("Your report has been submitted. Our team will review it shortly.");
    onBack();
  };

  return (
    <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">
      <div className="glass border-b border-white/10 sticky top-0 z-50 p-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/10 text-white">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Report a Concern</h1>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      <div className="p-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Submit a Report</CardTitle>
            <p className="text-sm text-gray-400 pt-1">
              Your safety is our priority. Please provide as much detail as possible.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium text-gray-200">Reason for Report</label>
              <Select>
                <SelectTrigger id="reason" className="bg-white/5 border-white/10 text-white">
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
              <label htmlFor="username" className="text-sm font-medium text-gray-200">User's Name (if applicable)</label>
              <Input id="username" placeholder="e.g., John D." className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <label htmlFor="details" className="text-sm font-medium text-gray-200">Details of the Incident</label>
              <Textarea id="details" placeholder="Please describe what happened..." rows={5} className="bg-white/5 border-white/10 text-white" />
            </div>
            <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white" onClick={handleSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Submit Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}