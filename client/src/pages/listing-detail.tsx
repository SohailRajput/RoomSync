import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Bed,
  Users,
  Calendar,
  Star,
  ChevronLeft,
  MessageCircle,
  Share,
  Bookmark,
} from "lucide-react";
import { type Listing } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function ListingDetail() {
  const params = useParams();
  const listingId = params.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: listing, isLoading, error } = useQuery<Listing>({
    queryKey: ["/api/listings", listingId],
    enabled: !isNaN(listingId),
  });

  // Handle "Contact" action
  const handleContact = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to message the listing owner.",
        variant: "destructive",
      });
      return;
    }
    
    // Redirect to messages page with the listing owner as the recipient
    navigate(`/messages/${listing?.userId}`);
  };

  // Handle save/bookmark action
  const handleSave = () => {
    toast({
      title: "Listing saved",
      description: "This listing has been saved to your bookmarks.",
    });
  };

  // Handle share action
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title || "Roommate listing",
        text: `Check out this listing: ${listing?.title || "Great room listing"}`,
        url: window.location.href,
      }).catch(err => console.error("Error sharing:", err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Listing URL copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-16 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-8">
              <div className="h-6 bg-neutral-200 rounded w-1/4"></div>
              <div className="h-96 bg-neutral-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-16 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
            <p className="text-neutral-600 mb-8">
              The listing you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/listings">Browse Listings</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb and back navigation */}
          <div className="mb-6">
            <Button variant="ghost" asChild className="p-0 hover:bg-transparent">
              <Link href="/listings" className="flex items-center text-neutral-600 hover:text-neutral-900">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to listings
              </Link>
            </Button>
          </div>

          {/* Listing details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content - takes 2/3 of the space on large screens */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title and rating */}
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">{listing.title}</h1>
                <div className="flex items-center mt-2 text-neutral-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{listing.location}</span>
                  <div className="ml-auto flex items-center text-yellow-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-1 font-medium">{listing.rating ? (listing.rating / 10).toFixed(1) : "New"}</span>
                  </div>
                </div>
              </div>

              {/* Image carousel */}
              <div className="rounded-lg overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {listing.images.map((image, i) => (
                        <CarouselItem key={i}>
                          <img
                            src={image}
                            alt={`${listing.title} - Image ${i + 1}`}
                            className="w-full h-96 object-cover rounded-lg"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt={listing.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Key details */}
              <div className="grid grid-cols-3 gap-4 bg-white rounded-lg p-4 shadow-sm">
                <div className="text-center p-4">
                  <Bed className="h-6 w-6 mx-auto text-neutral-700 mb-2" />
                  <p className="text-sm text-neutral-500">Room Type</p>
                  <p className="font-medium">{listing.roomType}</p>
                </div>
                <div className="text-center p-4">
                  <Users className="h-6 w-6 mx-auto text-neutral-700 mb-2" />
                  <p className="text-sm text-neutral-500">Roommates</p>
                  <p className="font-medium">{listing.roommates} {listing.roommates === 1 ? 'Person' : 'People'}</p>
                </div>
                <div className="text-center p-4">
                  <Calendar className="h-6 w-6 mx-auto text-neutral-700 mb-2" />
                  <p className="text-sm text-neutral-500">Available From</p>
                  <p className="font-medium">{listing.availableFrom}</p>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About this listing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-700 whitespace-pre-line">{listing.description}</p>
                </CardContent>
              </Card>

              {/* Amenities */}
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {listing.amenities && listing.amenities.length > 0 ? (
                      listing.amenities.map((amenity, i) => (
                        <div key={i} className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span>{amenity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-neutral-500 col-span-full">No amenities listed</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - takes 1/3 of the space on large screens */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Price card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-3xl font-bold text-primary">
                      ${listing.price}
                      <span className="text-base font-normal text-neutral-500">/month</span>
                    </CardTitle>
                    <CardDescription>
                      {listing.isFeatured && (
                        <Badge variant="verified" className="mt-2">Featured Listing</Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full" onClick={handleContact}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleSave}
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleShare}
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="text-sm text-neutral-500">
                      <p>Listed by {listing.userName || "Owner"}</p>
                      <p>Property ID: {listing.id}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}