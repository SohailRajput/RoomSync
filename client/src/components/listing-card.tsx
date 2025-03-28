import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Users, Calendar, Star } from "lucide-react";
import { type Listing } from "@shared/schema";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <Card className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
      <div className="flex-shrink-0 relative">
        <img 
          className="h-48 w-full object-cover" 
          src={listing.images[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
          alt={listing.title} 
        />
        <div className="absolute bottom-2 left-2">
          <Badge variant="price">${listing.price}/month</Badge>
        </div>
      </div>
      <CardContent className="flex-1 p-6 flex flex-col justify-between">
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="text-xl font-semibold text-neutral-900">{listing.title}</p>
            <div className="text-yellow-400 flex items-center">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-neutral-600 ml-1 text-sm">{listing.rating}</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-neutral-500 flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> {listing.location}
          </p>
          
          <div className="mt-4">
            <div className="flex flex-wrap gap-4 text-neutral-600 text-sm">
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" /> {listing.roomType}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" /> {listing.roommates} {listing.roommates === 1 ? 'Roommate' : 'Roommates'}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" /> {listing.availableFrom}
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((amenity, index) => (
                <Badge key={index} variant="tag">{amenity}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button className="w-full" asChild>
            <Link href={`/listings/${listing.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
