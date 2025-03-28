import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ListingCard from "@/components/listing-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, PlusCircle } from "lucide-react";
import { type Listing } from "@shared/schema";

export default function Listings() {
  const [filters, setFilters] = useState({
    location: "",
    minPrice: 500,
    maxPrice: 3000,
    roomType: "",
    amenities: [] as string[],
    availableNow: false,
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/listings", filters],
  });
  
  const handleAmenityChange = (value: string) => {
    setFilters(prev => {
      if (prev.amenities.includes(value)) {
        return {
          ...prev,
          amenities: prev.amenities.filter(item => item !== value)
        };
      } else {
        return {
          ...prev,
          amenities: [...prev.amenities, value]
        };
      }
    });
  };
  
  const amenityOptions = [
    "Furnished", "Utilities Included", "WiFi", "Laundry", 
    "Private Bathroom", "Parking", "Gym", "Air Conditioning",
    "Balcony", "Pets Allowed", "Garden Access", "Security System"
  ];
  
  const roomTypeOptions = [
    "Private Room", "Shared Room", "Studio Apartment", "1 Bedroom Apartment",
    "2 Bedroom Apartment", "3+ Bedroom Apartment", "House"
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 font-heading">Browse Listings</h1>
              <p className="mt-2 text-neutral-600">Find available rooms and apartments in your area</p>
            </div>
            <Button asChild>
              <Link href="/create-listing">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Listing
              </Link>
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter city or neighborhood"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label>Price Range: ${filters.minPrice} - ${filters.maxPrice}</Label>
                    <div className="pt-4 pb-2">
                      <Slider
                        value={[filters.minPrice, filters.maxPrice]}
                        min={500}
                        max={3000}
                        step={50}
                        onValueChange={(value) => setFilters(prev => ({ 
                          ...prev, 
                          minPrice: value[0], 
                          maxPrice: value[1] 
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="roomType">Room Type</Label>
                    <Select 
                      value={filters.roomType} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, roomType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any Room Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any Room Type</SelectItem>
                        {roomTypeOptions.map(type => (
                          <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="availableNow" 
                      checked={filters.availableNow}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, availableNow: checked as boolean }))
                      }
                    />
                    <Label htmlFor="availableNow">Available Now</Label>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="amenities">
                    <AccordionTrigger>Amenities</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {amenityOptions.map(option => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox 
                              id={option} 
                              checked={filters.amenities.includes(option)}
                              onCheckedChange={() => handleAmenityChange(option)}
                            />
                            <Label htmlFor={option}>{option}</Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white h-80 rounded-lg animate-pulse" />
              ))
            ) : listings?.length ? (
              (listings as Listing[]).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-neutral-500">No listings found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
