import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import RoommateCard from "@/components/roommate-card";
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
import { Search, SlidersHorizontal } from "lucide-react";
import { type Roommate } from "@shared/schema";

export default function FindRoommates() {
  const [filters, setFilters] = useState({
    location: "",
    minAge: 18,
    maxAge: 65,
    gender: "any",
    lifestyle: [] as string[],
    isVerified: false,
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: roommates, isLoading } = useQuery({
    queryKey: [
      `/api/roommates?${new URLSearchParams({
        ...(filters.location ? { location: filters.location } : {}),
        ...(filters.minAge ? { minAge: filters.minAge.toString() } : {}),
        ...(filters.maxAge ? { maxAge: filters.maxAge.toString() } : {}),
        ...(filters.gender && filters.gender !== "any" ? { gender: filters.gender } : {}),
        ...(filters.lifestyle.length > 0 ? { lifestyle: filters.lifestyle.join(',') } : {}),
        ...(filters.isVerified ? { isVerified: 'true' } : {})
      }).toString()}`,
      filters
    ],
  });
  
  const handleLifestyleChange = (value: string) => {
    setFilters(prev => {
      if (prev.lifestyle.includes(value)) {
        return {
          ...prev,
          lifestyle: prev.lifestyle.filter(item => item !== value)
        };
      } else {
        return {
          ...prev,
          lifestyle: [...prev.lifestyle, value]
        };
      }
    });
  };
  
  const lifestyleOptions = [
    "Early bird", "Night owl", "Quiet", "Social", "Clean", "Relaxed",
    "Non-smoker", "Smoker", "Pet-friendly", "No pets", "Vegetarian", "Vegan"
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 font-heading">Find Your Perfect Roommate</h1>
            <p className="mt-2 text-neutral-600">Browse potential roommates filtered by your preferences</p>
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
                    <Label>Age Range: {filters.minAge} - {filters.maxAge}</Label>
                    <div className="pt-4 pb-2">
                      <Slider
                        value={[filters.minAge, filters.maxAge]}
                        min={18}
                        max={65}
                        step={1}
                        onValueChange={(value) => setFilters(prev => ({ 
                          ...prev, 
                          minAge: value[0], 
                          maxAge: value[1] 
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={filters.gender} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Gender</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="verified" 
                      checked={filters.isVerified}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, isVerified: checked as boolean }))
                      }
                    />
                    <Label htmlFor="verified">Verified Users Only</Label>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="lifestyle">
                    <AccordionTrigger>Lifestyle Preferences</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {lifestyleOptions.map(option => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox 
                              id={option} 
                              checked={filters.lifestyle.includes(option)}
                              onCheckedChange={() => handleLifestyleChange(option)}
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
            ) : roommates && Array.isArray(roommates) && roommates.length > 0 ? (
              roommates.map((roommate) => (
                <RoommateCard 
                  key={roommate.id} 
                  roommate={roommate} 
                  compatibilityScore={roommate.compatibilityScore}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-neutral-500">No roommates found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
