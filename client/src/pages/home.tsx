import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import RoommateCard from "@/components/roommate-card";
import ListingCard from "@/components/listing-card";
import { useQuery } from "@tanstack/react-query";
import { Check, Shield, UserCheck, MessageSquare, Percent, Star } from "lucide-react";
import { type Roommate, type Listing } from "@shared/schema";

export default function Home() {
  const { data: topMatches, isLoading: loadingMatches } = useQuery({
    queryKey: ["/api/roommates/top-matches"],
  });

  const { data: featuredListings, isLoading: loadingListings } = useQuery({
    queryKey: ["/api/listings/featured"],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-primary-dark">
          <div className="absolute inset-0">
            <img 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1529316738131-4d0c0aea222b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
              alt="People in shared living space" 
            />
            <div className="absolute inset-0 bg-primary-dark mix-blend-multiply"></div>
          </div>
          <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl font-heading">
              Find your perfect roommate
            </h1>
            <p className="mt-6 text-xl text-white max-w-3xl">
              Discover compatible roommates based on your lifestyle, preferences, and personality. Create meaningful connections and find your ideal living situation.
            </p>
            <div className="mt-10 max-w-sm sm:flex sm:max-w-none">
              <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                <Button 
                  size="lg" 
                  className="flex items-center justify-center px-4 py-3 bg-accent hover:bg-accent-dark sm:px-8"
                  asChild
                >
                  <Link href="/find-roommates">Find a roommate</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex items-center justify-center px-4 py-3 text-primary bg-white hover:bg-neutral-50 sm:px-8"
                  asChild
                >
                  <Link href="/create-listing">List a room</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl font-heading">
                How RoomMatch Works
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-neutral-500 mx-auto">
                Our platform makes finding the right roommate simple, safe, and stress-free.
              </p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-light text-white">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-neutral-900 font-heading">Create Your Profile</h3>
                  <p className="mt-2 text-base text-neutral-600 text-center">
                    Tell us about yourself, your lifestyle, preferences, and what you're looking for in a roommate.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-secondary text-white">
                    <Percent className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-neutral-900 font-heading">Get Matched</h3>
                  <p className="mt-2 text-base text-neutral-600 text-center">
                    Our algorithm finds compatible roommates based on your lifestyle, budget, location preferences and personality.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent text-white">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-neutral-900 font-heading">Connect Safely</h3>
                  <p className="mt-2 text-base text-neutral-600 text-center">
                    Message potential roommates, schedule meetings, and find your perfect match all within our secure platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Preview Section */}
        <div className="py-16 bg-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl font-heading">
                Your Top Matches
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-neutral-500 mx-auto">
                Based on your profile and preferences, these roommates might be perfect for you.
              </p>
            </div>

            <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
              {loadingMatches ? (
                // Loading skeletons - you'd use shadcn's skeleton component here
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white h-80 rounded-lg animate-pulse" />
                ))
              ) : (
                (topMatches as Roommate[])?.map((match) => (
                  <RoommateCard 
                    key={match.id} 
                    roommate={match} 
                    compatibilityScore={match.compatibilityScore}
                  />
                ))
              )}
            </div>

            <div className="mt-12 text-center">
              <Button size="lg" asChild>
                <Link href="/find-roommates">View All Matches</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Listings Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl font-heading">
                Featured Listings
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-neutral-500 mx-auto">
                Explore these available rooms and apartments in your preferred areas.
              </p>
            </div>

            <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
              {loadingListings ? (
                // Loading skeletons
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white h-80 rounded-lg animate-pulse" />
                ))
              ) : (
                (featuredListings as Listing[])?.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))
              )}
            </div>

            <div className="mt-12 text-center">
              <Button size="lg" asChild>
                <Link href="/listings">Browse All Listings</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="py-16 bg-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl font-heading">
                What Our Users Say
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-neutral-500 mx-auto">
                Hear from people who found their perfect living situation through RoomMatch.
              </p>
            </div>

            <div className="mt-12 space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <img 
                      className="h-12 w-12 rounded-full" 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60" 
                      alt="User testimonial" 
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-900">Jessica R.</h3>
                    <div className="mt-1 flex items-center">
                      <div className="flex text-yellow-400">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-base text-neutral-600">
                      "I was nervous about finding a roommate online, but RoomMatch made it easy and safe. My new roommate and I are incredibly compatible - we have similar schedules, cleanliness standards, and even share many of the same interests!"
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <img 
                      className="h-12 w-12 rounded-full" 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60" 
                      alt="User testimonial" 
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-900">Michael K.</h3>
                    <div className="mt-1 flex items-center">
                      <div className="flex text-yellow-400">
                        {Array(4).fill(0).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                        <Star className="h-4 w-4 fill-current opacity-50" />
                      </div>
                    </div>
                    <p className="mt-3 text-base text-neutral-600">
                      "When I moved to a new city for work, I had no local connections. RoomMatch helped me find not just a place to live, but a roommate who's become a great friend. The compatibility algorithm really works!"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Features Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl font-heading">
                  Your Safety Is Our Priority
                </h2>
                <p className="mt-3 max-w-3xl text-lg text-neutral-500">
                  We've built RoomMatch with your safety in mind. Our platform includes multiple features to help you confidently find your perfect roommate.
                </p>

                <div className="mt-8 space-y-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-white">
                        <Check className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">Verified Profiles</h3>
                      <p className="mt-2 text-base text-neutral-600">
                        Users can verify their identity through email, phone, and social media to build trust.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-white">
                        <Shield className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">Secure Messaging</h3>
                      <p className="mt-2 text-base text-neutral-600">
                        Our in-app messaging system keeps your personal contact information private until you're ready to share it.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-white">
                        <UserCheck className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">Review System</h3>
                      <p className="mt-2 text-base text-neutral-600">
                        Past roommates can leave reviews, helping you make informed decisions about potential matches.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 lg:mt-0">
                <img 
                  className="rounded-lg shadow-lg" 
                  src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                  alt="People socializing in living room" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl font-heading">
              <span className="block">Ready to find your perfect roommate?</span>
              <span className="block text-accent-light">Sign up for free today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="text-primary bg-white hover:bg-neutral-50"
                  asChild
                >
                  <Link href="/register">Get started</Link>
                </Button>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-white bg-primary-dark hover:bg-primary-dark"
                  asChild
                >
                  <Link href="#how-it-works">Learn more</Link>
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
