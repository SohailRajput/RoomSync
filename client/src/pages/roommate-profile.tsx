import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Calendar, DollarSign, Clock, User, Mail, Star } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import CompatibilityScore from "@/components/compatibility-score";
import type { Roommate } from "@shared/schema";

export default function RoommateProfile() {
  const { user } = useAuth();
  const [, params] = useRoute<{ id: string }>('/roommate/:id');
  const roommateId = params?.id ? parseInt(params.id, 10) : undefined;
  
  const { data: roommate, isLoading } = useQuery<Roommate>({
    queryKey: [`/api/roommates/${roommateId}`],
    enabled: !!roommateId,
  });
  
  // Get compatibility details
  const { data: compatibility } = useQuery<Roommate>({
    queryKey: [`/api/roommates/compatibility/${roommateId}`],
    enabled: !!roommateId && !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-10 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-neutral-200 rounded w-3/4"></div>
              <div className="h-60 bg-neutral-200 rounded"></div>
              <div className="h-40 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!roommate) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-10 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle>Roommate Not Found</CardTitle>
                <CardDescription>
                  We couldn't find the roommate you're looking for.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/find-roommates">Back to Roommates</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg">
                <div className="relative h-60">
                  <img 
                    src={roommate.profileImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                    alt={`${roommate.firstName}'s profile`}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  {roommate.isVerified && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="verified">Verified Profile</Badge>
                    </div>
                  )}
                </div>
                
                <CardContent className="pt-6 pb-4">
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {roommate.firstName} {roommate.lastName}
                    <span className="text-xl text-neutral-500">({roommate.age})</span>
                  </h1>
                  
                  <p className="text-lg font-medium text-neutral-700 mt-1">{roommate.occupation}</p>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center text-neutral-600">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      <span>{roommate.location}</span>
                    </div>
                    
                    {roommate.budget && (
                      <div className="flex items-center text-neutral-600">
                        <DollarSign className="h-5 w-5 mr-2 text-primary" />
                        <span>Budget: ${roommate.budget}/month</span>
                      </div>
                    )}
                    
                    {roommate.moveInDate && (
                      <div className="flex items-center text-neutral-600">
                        <Calendar className="h-5 w-5 mr-2 text-primary" />
                        <span>Available from: {roommate.moveInDate}</span>
                      </div>
                    )}
                    
                    {roommate.duration && (
                      <div className="flex items-center text-neutral-600">
                        <Clock className="h-5 w-5 mr-2 text-primary" />
                        <span>Duration: {roommate.duration}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0 flex justify-center">
                  <Button asChild>
                    <Link href={`/messages/${roommate.id}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Contact {roommate.firstName}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Compatibility Card (only if logged in and has compatibility data) */}
              {user && compatibility?.compatibilityDetails && (
                <Card className="mt-6 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Compatibility</CardTitle>
                    <CardDescription>
                      How well you might get along with {roommate.firstName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CompatibilityScore 
                      score={compatibility.compatibilityScore || 0} 
                      details={compatibility.compatibilityDetails}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Profile Details */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>About {roommate.firstName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {roommate.bio && (
                    <div>
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">Bio</h3>
                      <p className="text-neutral-600">{roommate.bio}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">Lifestyle Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                      {roommate.preferences.map((preference, index) => (
                        <Badge key={index} variant="tag">{preference}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {user && compatibility?.compatibilityDetails?.commonInterests && 
                   compatibility.compatibilityDetails.commonInterests.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">
                        Shared Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {compatibility.compatibilityDetails?.commonInterests?.map((interest, index) => (
                          <Badge key={index} variant="tag" className="bg-primary text-white">
                            <Star className="mr-1 h-3 w-3" />
                            {interest}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-neutral-500 mt-2">
                        You and {roommate.firstName} share these lifestyle preferences.
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">Looking For</h3>
                    <div className="bg-neutral-50 p-4 rounded-lg">
                      <p className="text-neutral-600">
                        {roommate.isLookingForRoom 
                          ? `${roommate.firstName} is looking for a room to rent.` 
                          : `${roommate.firstName} has a place and is looking for roommates.`
                        }
                      </p>
                      
                      {roommate.budget && (
                        <p className="text-neutral-600 mt-2">
                          Budget: Up to ${roommate.budget}/month
                        </p>
                      )}
                      
                      {roommate.moveInDate && (
                        <p className="text-neutral-600 mt-2">
                          Available to move in from: {roommate.moveInDate}
                        </p>
                      )}
                      
                      {roommate.duration && (
                        <p className="text-neutral-600 mt-2">
                          Looking for: {roommate.duration} stay
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-4">
                <Button asChild>
                  <Link href={`/messages/${roommate.id}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Message {roommate.firstName}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/find-roommates">
                    Back to Roommates
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}