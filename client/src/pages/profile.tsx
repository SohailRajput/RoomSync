import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth.tsx";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { updateUserProfileSchema } from "@shared/schema";

const lifestylePreferences = [
  "Early bird", "Night owl", "Quiet", "Social", "Clean", "Relaxed",
  "Non-smoker", "Smoker", "Pet-friendly", "No pets", "Vegetarian", "Vegan"
];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/users/profile"],
  });
  
  const form = useForm<z.infer<typeof updateUserProfileSchema>>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: undefined,
      gender: "",
      occupation: "",
      location: "",
      bio: "",
      preferences: [],
    },
  });
  
  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        age: profile.age || undefined,
        gender: profile.gender || "",
        occupation: profile.occupation || "",
        location: profile.location || "",
        bio: profile.bio || "",
        preferences: profile.preferences || [],
      });
      setSelectedPreferences(profile.preferences || []);
    }
  }, [profile, form]);
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateUserProfileSchema>) => {
      return apiRequest("PUT", "/api/users/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof updateUserProfileSchema>) => {
    data.preferences = selectedPreferences;
    updateProfileMutation.mutate(data);
  };
  
  const togglePreference = (preference: string) => {
    setSelectedPreferences((current) => {
      if (current.includes(preference)) {
        return current.filter((p) => p !== preference);
      } else {
        return [...current, preference];
      }
    });
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Not Logged In</CardTitle>
              <CardDescription>
                You need to log in to view your profile.
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
      <main className="flex-grow py-10 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-neutral-900 font-heading mb-8">Your Profile</h1>
          
          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList>
              <TabsTrigger value="profile">Personal Info</TabsTrigger>
              <TabsTrigger value="preferences">Roommate Preferences</TabsTrigger>
              <TabsTrigger value="account">Account Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and public profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="h-10 bg-neutral-100 animate-pulse rounded"></div>
                      <div className="h-10 bg-neutral-100 animate-pulse rounded"></div>
                      <div className="h-10 bg-neutral-100 animate-pulse rounded"></div>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your first name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter your age"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select your gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="non-binary">Non-binary</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="occupation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Occupation</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your occupation" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="City, State" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell potential roommates about yourself" 
                                  className="resize-none" 
                                  rows={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Keep it brief but informative. What should your potential roommates know about you?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          name="preferences"
                          render={() => (
                            <FormItem>
                              <FormLabel>Lifestyle Preferences</FormLabel>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                {lifestylePreferences.map((preference) => (
                                  <div key={preference} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={preference}
                                      checked={selectedPreferences.includes(preference)}
                                      onCheckedChange={() => togglePreference(preference)}
                                    />
                                    <label
                                      htmlFor={preference}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {preference}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormDescription>
                                Select all that apply to you. These help match you with compatible roommates.
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex gap-2">
                          {selectedPreferences.map((preference) => (
                            <Badge key={preference} variant="tag">
                              {preference}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full md:w-auto"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Roommate Preferences</CardTitle>
                  <CardDescription>
                    Tell us what you're looking for in a roommate and your living situation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="h-10 bg-neutral-100 animate-pulse rounded"></div>
                      <div className="h-10 bg-neutral-100 animate-pulse rounded"></div>
                      <div className="h-10 bg-neutral-100 animate-pulse rounded"></div>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <FormLabel className="block mb-2">Budget Range</FormLabel>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                placeholder="Min $" 
                                className="w-full"
                                value={profile?.minBudget || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? undefined : Number(e.target.value);
                                  // We'll update this in the full mutation
                                  if (value) {
                                    form.setValue("minBudget", value);
                                  }
                                }}
                              />
                              <span>to</span>
                              <Input 
                                type="number" 
                                placeholder="Max $" 
                                className="w-full"
                                value={profile?.maxBudget || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? undefined : Number(e.target.value);
                                  // We'll update this in the full mutation
                                  if (value) {
                                    form.setValue("maxBudget", value);
                                  }
                                }}
                              />
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Your monthly budget for rent</p>
                          </div>
                          
                          <div>
                            <FormLabel className="block mb-2">Move-in Date</FormLabel>
                            <Input 
                              type="date" 
                              className="w-full"
                              value={profile?.moveInDate || ""}
                              onChange={(e) => {
                                form.setValue("moveInDate", e.target.value);
                              }}
                            />
                            <p className="text-xs text-neutral-500 mt-1">When you're planning to move</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <FormLabel className="block mb-2">Duration</FormLabel>
                            <Select 
                              defaultValue={profile?.duration || ""}
                              onValueChange={(value) => form.setValue("duration", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select lease duration" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="short-term">Short term (1-3 months)</SelectItem>
                                <SelectItem value="medium-term">Medium term (3-6 months)</SelectItem>
                                <SelectItem value="long-term">Long term (6+ months)</SelectItem>
                                <SelectItem value="flexible">Flexible</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-neutral-500 mt-1">Your preferred lease length</p>
                          </div>
                          
                          <div>
                            <FormLabel className="block mb-2">Looking For</FormLabel>
                            <Select 
                              defaultValue={profile?.lookingFor || "room"}
                              onValueChange={(value) => form.setValue("lookingFor", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="What are you looking for?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="room">A room to rent</SelectItem>
                                <SelectItem value="roommate">A roommate for my place</SelectItem>
                                <SelectItem value="both">Both options</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-neutral-500 mt-1">Are you looking for a room or a roommate?</p>
                          </div>
                        </div>
                        
                        <div>
                          <FormLabel className="block mb-2">Preferred Roommate Traits</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {lifestylePreferences.map((preference) => (
                              <div key={preference} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`roommate-${preference}`}
                                  checked={(profile?.roommatePreferences || []).includes(preference)}
                                  onCheckedChange={(checked) => {
                                    const current = profile?.roommatePreferences || [];
                                    const updated = checked 
                                      ? [...current, preference]
                                      : current.filter(p => p !== preference);
                                    form.setValue("roommatePreferences", updated);
                                  }}
                                />
                                <label
                                  htmlFor={`roommate-${preference}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {preference}
                                </label>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-neutral-500 mt-2">
                            Select the traits you'd prefer in a roommate
                          </p>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full md:w-auto"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Preferences"}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and verification status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-500 mb-4">
                    This section is under development. Soon you'll be able to update your account settings here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
