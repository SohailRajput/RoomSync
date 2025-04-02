import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertTriangle, Trash2 } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  
  // Define a default profile to avoid type errors
  const defaultProfile: z.infer<typeof updateUserProfileSchema> = {
    firstName: "",
    lastName: "",
    age: undefined,
    gender: "",
    occupation: "",
    location: "",
    bio: "",
    preferences: [],
    minBudget: undefined,
    maxBudget: undefined,
    moveInDate: "",
    duration: "",
    lookingFor: "room",
    roommatePreferences: [],
    isProfilePublic: true,
    messageNotifications: true,
    matchNotifications: true,
    listingNotifications: true,
  };
  
  // Using generic type parameter and getQueryFn to handle proper typing
  const { data: profile, isLoading } = useQuery<z.infer<typeof updateUserProfileSchema>>({
    queryKey: ["/api/users/profile"],
    // Default to the empty profile if none exists yet
    select: (data) => data || defaultProfile,
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
      minBudget: undefined,
      maxBudget: undefined,
      moveInDate: "",
      duration: "",
      lookingFor: "room",
      roommatePreferences: [],
      // Account settings default values
      isProfilePublic: true,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      messageNotifications: true,
      matchNotifications: true,
      listingNotifications: true,
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
        minBudget: profile.minBudget || undefined,
        maxBudget: profile.maxBudget || undefined,
        moveInDate: profile.moveInDate || "",
        duration: profile.duration || "",
        lookingFor: profile.lookingFor || "room",
        roommatePreferences: profile.roommatePreferences || [],
        // Account settings - use values from profile or defaults
        isProfilePublic: profile.isProfilePublic !== undefined ? profile.isProfilePublic : true,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        messageNotifications: profile.messageNotifications !== undefined ? profile.messageNotifications : true,
        matchNotifications: profile.matchNotifications !== undefined ? profile.matchNotifications : true,
        listingNotifications: profile.listingNotifications !== undefined ? profile.listingNotifications : true,
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
  
  const onPersonalInfoSubmit = (data: z.infer<typeof updateUserProfileSchema>) => {
    // Make a copy of the original profile data
    const updatedData = {
      ...(profile || {}),
      // Update with the personal info from the form
      firstName: data.firstName,
      lastName: data.lastName,
      age: data.age,
      gender: data.gender,
      occupation: data.occupation,
      location: data.location,
      bio: data.bio,
      preferences: selectedPreferences, // Use the preferences from the state
    };
    
    console.log("Submitting personal info with preferences:", selectedPreferences);
    updateProfileMutation.mutate(updatedData);
  };
  
  const onPreferencesSubmit = (data: z.infer<typeof updateUserProfileSchema>) => {
    // Make a copy of the original profile data
    const updatedData = {
      ...(profile || {}),
      // Update with the preferences from the form
      minBudget: data.minBudget,
      maxBudget: data.maxBudget, 
      moveInDate: data.moveInDate,
      duration: data.duration,
      lookingFor: data.lookingFor,
      roommatePreferences: data.roommatePreferences,
    };
    
    console.log("Submitting roommate preferences form data:", {
      minBudget: data.minBudget,
      maxBudget: data.maxBudget,
      moveInDate: data.moveInDate,
      duration: data.duration,
      lookingFor: data.lookingFor,
      roommatePreferences: data.roommatePreferences,
    });
    
    updateProfileMutation.mutate(updatedData);
  };
  
  const onAccountSettingsSubmit = (data: z.infer<typeof updateUserProfileSchema>) => {
    // Extract only the account settings fields to be updated
    const accountSettingsData = {
      isProfilePublic: data.isProfilePublic,
      messageNotifications: data.messageNotifications,
      matchNotifications: data.matchNotifications,
      listingNotifications: data.listingNotifications,
    };
    
    // Log the form submission for debugging
    console.log("Account settings form submitted:", accountSettingsData);
    
    // Handle password change separately if provided
    if (data.currentPassword && data.newPassword && data.confirmPassword) {
      // Validate passwords
      if (data.newPassword !== data.confirmPassword) {
        toast({
          title: "Password Error",
          description: "New password and confirmation don't match.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Password change requested");
      // In a real app, we would verify the current password and update to the new one
      // For now, just show a success message
    }
    
    // Make a copy of the original profile data and add only the account settings
    const updatedData = {
      ...(profile || {}),
      ...accountSettingsData
    };
    
    // Use the mutation to update the profile
    updateProfileMutation.mutate(updatedData, {
      onSuccess: () => {
        toast({
          title: "Account settings updated",
          description: "Your account settings have been saved successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to update account settings. Please try again.",
          variant: "destructive",
        });
        console.error("Error updating account settings:", error);
      }
    });
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
                      <form onSubmit={form.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
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
                      <form onSubmit={form.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <FormLabel className="block mb-2">Budget Range</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormField
                                control={form.control}
                                name="minBudget"
                                render={({ field }) => (
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Min $"
                                      className="w-full"
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) => {
                                        const value = e.target.value === "" ? undefined : Number(e.target.value);
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                )}
                              />
                              <span>to</span>
                              <FormField
                                control={form.control}
                                name="maxBudget"
                                render={({ field }) => (
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Max $"
                                      className="w-full"
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) => {
                                        const value = e.target.value === "" ? undefined : Number(e.target.value);
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                )}
                              />
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Your monthly budget for rent</p>
                          </div>
                          
                          <div>
                            <FormLabel className="block mb-2">Move-in Date</FormLabel>
                            <FormField
                              control={form.control}
                              name="moveInDate"
                              render={({ field }) => (
                                <FormControl>
                                  <Input
                                    type="date"
                                    className="w-full"
                                    {...field}
                                  />
                                </FormControl>
                              )}
                            />
                            <p className="text-xs text-neutral-500 mt-1">When you're planning to move</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <FormLabel className="block mb-2">Duration</FormLabel>
                            <FormField
                              control={form.control}
                              name="duration"
                              render={({ field }) => (
                                <FormControl>
                                  <Select 
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
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
                                </FormControl>
                              )}
                            />
                            <p className="text-xs text-neutral-500 mt-1">Your preferred lease length</p>
                          </div>
                          
                          <div>
                            <FormLabel className="block mb-2">Looking For</FormLabel>
                            <FormField
                              control={form.control}
                              name="lookingFor"
                              render={({ field }) => (
                                <FormControl>
                                  <Select 
                                    value={field.value || "room"}
                                    onValueChange={field.onChange}
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
                                </FormControl>
                              )}
                            />
                            <p className="text-xs text-neutral-500 mt-1">Are you looking for a room or a roommate?</p>
                          </div>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="roommatePreferences"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Roommate Traits</FormLabel>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                {lifestylePreferences.map((preference) => (
                                  <div key={preference} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`roommate-${preference}`}
                                      checked={(field.value || []).includes(preference)}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        const newValues = checked
                                          ? [...currentValues, preference]
                                          : currentValues.filter((val) => val !== preference);
                                        field.onChange(newValues);
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
                              <FormDescription>
                                Select the traits you'd prefer in a roommate
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
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
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="h-10 bg-neutral-100 animate-pulse rounded"></div>
                      <div className="h-10 bg-neutral-100 animate-pulse rounded"></div>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onAccountSettingsSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-lg font-medium mb-2">Profile Verification</h3>
                              <div className="rounded-lg border p-4 bg-neutral-50">
                                <div className="flex items-center mb-2">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">
                                    Verified
                                  </Badge>
                                  <p className="text-sm">Your email is verified</p>
                                </div>
                                <p className="text-xs text-neutral-500">
                                  Verified accounts receive more responses and are more likely to be contacted by potential roommates.
                                </p>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-lg font-medium mb-2">Profile Visibility</h3>
                              <div className="rounded-lg border p-4 bg-neutral-50">
                                <div className="flex items-center mb-2">
                                  <FormField
                                    control={form.control}
                                    name="isProfilePublic"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                          <Switch 
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                          />
                                        </FormControl>
                                        <FormLabel className="ml-2 text-sm">
                                          Public profile
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <p className="text-xs text-neutral-500">
                                  When enabled, your profile is visible to other users on the platform.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium mb-2">Password</h3>
                            <div className="rounded-lg border p-4 bg-neutral-50 space-y-4">
                              <FormField
                                control={form.control}
                                name="currentPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <p className="text-xs text-neutral-500">
                                Password must be at least 8 characters long and include a mix of letters, numbers, and special characters.
                              </p>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium mb-2">Notification Settings</h3>
                            <div className="rounded-lg border p-4 bg-neutral-50 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">New Message Notifications</p>
                                  <p className="text-xs text-neutral-500">Get notified when you receive a new message</p>
                                </div>
                                <FormField
                                  control={form.control}
                                  name="messageNotifications"
                                  render={({ field }) => (
                                    <FormControl>
                                      <Switch 
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  )}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">New Match Notifications</p>
                                  <p className="text-xs text-neutral-500">Get notified when you have a new compatible roommate match</p>
                                </div>
                                <FormField
                                  control={form.control}
                                  name="matchNotifications"
                                  render={({ field }) => (
                                    <FormControl>
                                      <Switch 
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  )}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">New Listing Notifications</p>
                                  <p className="text-xs text-neutral-500">Get notified when new listings match your preferences</p>
                                </div>
                                <FormField
                                  control={form.control}
                                  name="listingNotifications"
                                  render={({ field }) => (
                                    <FormControl>
                                      <Switch 
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium mb-2">Account Actions</h3>
                            <div className="rounded-lg border p-4 bg-neutral-50 space-y-3">
                              <p className="text-sm text-neutral-600">
                                These actions affect your entire account and cannot be undone.
                              </p>
                              <div className="flex flex-col space-y-2">
                                <Button variant="outline" className="justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200">
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Deactivate Account Temporarily
                                </Button>
                                <Button variant="outline" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Account Permanently
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full md:w-auto"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Account Settings"}
                        </Button>
                      </form>
                    </Form>
                  )}
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
