import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { type Roommate } from "@shared/schema";
import CompatibilityScore from "./compatibility-score";

interface RoommateCardProps {
  roommate: Roommate;
  compatibilityScore?: number;
}

export default function RoommateCard({ 
  roommate, 
  compatibilityScore 
}: RoommateCardProps) {
  return (
    <Card className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
      <div className="flex-shrink-0 relative">
        {compatibilityScore && (
          <div className="absolute top-2 right-2">
            <CompatibilityScore 
              score={compatibilityScore} 
              details={roommate.compatibilityDetails}
            />
          </div>
        )}
        <img 
          className="h-60 w-full object-cover" 
          src={roommate.profileImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
          alt={`${roommate.firstName}, ${roommate.age}`} 
        />
      </div>
      <CardContent className="flex-1 p-6 flex flex-col justify-between">
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="text-xl font-semibold text-neutral-900">
              {roommate.firstName}, {roommate.age}
            </p>
            <div className="flex space-x-1">
              {roommate.isVerified && (
                <Badge variant="verified">Verified</Badge>
              )}
            </div>
          </div>
          <p className="mt-2 text-base text-neutral-600">{roommate.occupation}</p>
          <p className="mt-1 text-sm text-neutral-500 flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> {roommate.location}
          </p>
          
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {roommate.preferences.map((preference, index) => (
                <Badge key={index} variant="tag">{preference}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex space-x-2">
            <Button asChild>
              <Link href={`/roommate/${roommate.id}`}>View Profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/messages/${roommate.id}`}>Message</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
