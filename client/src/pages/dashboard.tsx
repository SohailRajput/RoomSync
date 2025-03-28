import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoommateCard from "@/components/roommate-card";
import ListingCard from "@/components/listing-card";
import { useAuth } from "@/lib/auth.tsx";
import { MessageSquare, Plus, Search, User, Home as HomeIcon } from "lucide-react";
import { type Roommate, type Listing } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: topMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/roommates/top-matches"],
  });

  const { data: myListings, isLoading: listingsLoading } = useQuery({
    queryKey: ["/api/listings/my-listings"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages"],
  });
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Not Logged In</CardTitle>
              <CardDescription>
                You need to log in to view your dashboard.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/login">Log In</Link>
              </Button>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-neutral-900 font-heading">Welcome back, {user.username}!</h1>
            <p className="mt-2 text-neutral-600">Here's what's happening with your roommate search.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{topMatches?.length || 0}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/find-roommates">
                    <Search className="h-4 w-4 mr-2" />
                    Find Roommates
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">My Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{myListings?.length || 0}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/create-listing">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Listing
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">New Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{messages?.filter(m => !m.read)?.length || 0}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Messages
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Tabs defaultValue="matches" className="mt-10">
            <TabsList className="mb-8">
              <TabsTrigger value="matches" className="px-4 py-2">
                <User className="h-4 w-4 mr-2" />
                Top Matches
              </TabsTrigger>
              <TabsTrigger value="listings" className="px-4 py-2">
                <HomeIcon className="h-4 w-4 mr-2" />
                My Listings
              </TabsTrigger>
              <TabsTrigger value="messages" className="px-4 py-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                Recent Messages
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="matches">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchesLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white h-80 rounded-lg animate-pulse" />
                  ))
                ) : topMatches?.length ? (
                  (topMatches as Roommate[]).slice(0, 3).map((match) => (
                    <RoommateCard 
                      key={match.id}
                      roommate={match}
                      compatibilityScore={match.compatibilityScore}
                    />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-10">
                    <p className="text-neutral-500 mb-4">No matches found yet. Complete your profile to get started.</p>
                    <Button asChild>
                      <Link href="/profile">Complete Profile</Link>
                    </Button>
                  </div>
                )}
              </div>
              {topMatches?.length > 3 && (
                <div className="mt-6 text-center">
                  <Button variant="outline" asChild>
                    <Link href="/find-roommates">View All Matches</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="listings">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listingsLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white h-80 rounded-lg animate-pulse" />
                  ))
                ) : myListings?.length ? (
                  (myListings as Listing[]).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-10">
                    <p className="text-neutral-500 mb-4">You haven't created any listings yet.</p>
                    <Button asChild>
                      <Link href="/create-listing">Create a Listing</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="messages">
              {messagesLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white h-20 rounded-lg animate-pulse mb-4" />
                ))
              ) : messages?.length ? (
                <div className="space-y-4">
                  {messages.slice(0, 5).map((message) => (
                    <Card key={message.id} className={`${!message.read ? 'border-l-4 border-l-primary' : ''}`}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{message.senderName}</p>
                          <p className="text-sm text-neutral-500 truncate max-w-md">{message.content}</p>
                        </div>
                        <p className="text-xs text-neutral-400">{new Date(message.timestamp).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                  <div className="text-center mt-6">
                    <Button variant="outline" asChild>
                      <Link href="/messages">View All Messages</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-neutral-500">No messages yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
