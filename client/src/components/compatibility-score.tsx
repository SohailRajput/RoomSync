import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { type CompatibilityDetails } from "@shared/schema";

interface CompatibilityScoreProps {
  score: number;
  details?: CompatibilityDetails;
}

export default function CompatibilityScore({ score, details }: CompatibilityScoreProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Helper to render score bar
  const renderScoreBar = (label: string, score: number) => {
    return (
      <div className="mt-2">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-neutral-600">{label}</span>
          <span className="text-sm font-medium text-neutral-800">{score}%</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getScoreColor(score)}`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (!details) {
    return (
      <Badge variant="match" className="text-base px-3 py-1.5">{score}% Match</Badge>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Badge variant="match" className="text-base px-3 py-1.5">{score}% Match</Badge>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
      
      {expanded && (
        <Card className="mt-2 border border-neutral-200">
          <CardContent className="p-4">
            {renderScoreBar("Lifestyle Compatibility", details.lifestyleScore)}
            {renderScoreBar("Location Compatibility", details.locationScore)}
            {renderScoreBar("Schedule Compatibility", details.scheduleScore)}
            
            {details.commonInterests.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-neutral-800 mb-2">Common Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {details.commonInterests.map((interest, i) => (
                    <div key={i} className="flex items-center gap-1 text-sm text-neutral-600">
                      <Check size={14} className="text-green-500" />
                      <span>{interest}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}