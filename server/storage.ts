import { 
  users, 
  listings,
  messages,
  roommates,
  conversations,
  badges,
  type User, 
  type InsertUser, 
  type UpdateUserProfile, 
  type Roommate, 
  type Listing, 
  type Message, 
  type Conversation,
  type Badge,
  type UserBadge
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, gte, lte, like, inArray, desc, sql, asc, isNotNull, or } from "drizzle-orm";
import postgres from "postgres";
import * as crypto from "crypto";
import { Pool } from "pg";
import { db as dbInstance } from "./db";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User>;
  
  // Roommate methods
  getRoommates(filters?: RoommateFilters): Promise<Roommate[]>;
  getTopMatches(userId: number): Promise<Roommate[]>;
  
  // Listing methods
  getListings(filters?: ListingFilters, currentUserId?: number): Promise<Listing[]>;
  getListingById(id: number, currentUserId?: number): Promise<Listing | undefined>;
  getFeaturedListings(): Promise<Listing[]>;
  getUserListings(userId: number): Promise<Listing[]>;
  createListing(userId: number, listing: Omit<Listing, "id" | "userId" | "createdAt">): Promise<Listing>;
  
  // Message methods
  getMessages(userId: number, otherUserId: number): Promise<Message[]>;
  getConversations(userId: number): Promise<Conversation[]>;
  createMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message>;
  
  // Badge methods
  getAllBadges(): Promise<Badge[]>;
  getBadgeById(id: number): Promise<Badge | undefined>;
  getUserBadges(userId: number): Promise<UserBadge[]>;
  awardBadge(userId: number, badgeId: number): Promise<UserBadge>;
  calculateProfileCompletion(userId: number): Promise<number>;
}

// Filter interfaces
interface RoommateFilters {
  location?: string;
  minAge?: number;
  maxAge?: number;
  gender?: string;
  lifestyle?: string[];
  isVerified?: boolean;
}

interface ListingFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: string;
  amenities?: string[];
  availableNow?: boolean;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private roommates: Map<number, Omit<Roommate, keyof User>>;
  private listings: Map<number, Listing>;
  private messages: Map<number, Message>;
  private conversations: Map<string, { lastMessageId: number, updatedAt: Date }>;
  private badges: Map<number, Badge>;
  
  private userId: number = 1;
  private listingId: number = 1;
  private messageId: number = 1;
  private badgeId: number = 1;
  
  constructor() {
    this.users = new Map();
    this.roommates = new Map();
    this.listings = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    this.badges = new Map();
    
    // Create some sample data for development
    this.seedData();
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password
    const hashedPassword = this.hashPassword(insertUser.password);
    
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      password: hashedPassword,
      firstName: null,
      lastName: null,
      age: null,
      gender: null,
      occupation: null,
      location: null,
      bio: null,
      preferences: [],
      profileImage: null,
      isVerified: false,
      profileCompletion: 0,
      userBadges: [],
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = {
      ...user,
      ...profile
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Roommate methods
  async getRoommates(filters?: RoommateFilters): Promise<Roommate[]> {
    let roommates = Array.from(this.users.values())
      .map(user => {
        const roommateData = this.roommates.get(user.id);
        if (!roommateData) return null;
        
        return {
          ...user,
          ...roommateData
        } as Roommate;
      })
      .filter(Boolean) as Roommate[];
    
    // Apply filters
    if (filters) {
      if (filters.location) {
        roommates = roommates.filter(r => 
          r.location?.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      
      if (filters.minAge !== undefined) {
        roommates = roommates.filter(r => r.age !== undefined && r.age >= filters.minAge!);
      }
      
      if (filters.maxAge !== undefined) {
        roommates = roommates.filter(r => r.age !== undefined && r.age <= filters.maxAge!);
      }
      
      if (filters.gender) {
        roommates = roommates.filter(r => r.gender === filters.gender);
      }
      
      if (filters.lifestyle && filters.lifestyle.length > 0) {
        roommates = roommates.filter(r => 
          filters.lifestyle!.some(pref => r.preferences.includes(pref))
        );
      }
      
      if (filters.isVerified) {
        roommates = roommates.filter(r => r.isVerified);
      }
    }
    
    return roommates;
  }
  
  async getTopMatches(userId: number): Promise<Roommate[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    const roommates = await this.getRoommates();
    
    // Exclude the current user
    const otherRoommates = roommates.filter(r => r.id !== userId);
    
    // Calculate compatibility scores with detailed breakdown
    return otherRoommates.map(roommate => {
      // Lifestyle compatibility (based on preferences)
      const commonPreferences = user.preferences?.filter(
        pref => roommate.preferences?.includes(pref)
      ) || [];
      
      const totalPreferences = new Set([
        ...(user.preferences || []),
        ...(roommate.preferences || [])
      ]).size;
      
      const lifestyleScore = totalPreferences > 0 
        ? Math.round((commonPreferences.length / totalPreferences) * 100) 
        : 50;
      
      // Location compatibility
      const locationScore = user.location && roommate.location && 
        user.location.toLowerCase() === roommate.location.toLowerCase() 
        ? 100 
        : user.location && roommate.location && 
          (user.location.toLowerCase().includes(roommate.location.toLowerCase()) || 
           roommate.location.toLowerCase().includes(user.location.toLowerCase()))
          ? 75
          : 50;
      
      // Schedule compatibility (simple algorithm based on lifestyle tags)
      const userSchedulePrefs = (user.preferences || []).filter(p => 
        ['Early bird', 'Night owl'].includes(p)
      );
      
      const roommateSchedulePrefs = (roommate.preferences || []).filter(p => 
        ['Early bird', 'Night owl'].includes(p)
      );
      
      const scheduleScore = userSchedulePrefs.length > 0 && roommateSchedulePrefs.length > 0
        ? userSchedulePrefs.some(p => roommateSchedulePrefs.includes(p)) ? 100 : 30
        : 70; // Neutral if one or both don't specify
      
      // Overall score is weighted average
      const overallScore = Math.round(
        (lifestyleScore * 0.5) + 
        (locationScore * 0.3) + 
        (scheduleScore * 0.2)
      );
      
      // Create detailed compatibility breakdown
      const compatibilityDetails = {
        lifestyleScore,
        locationScore,
        scheduleScore,
        overallScore,
        commonInterests: commonPreferences
      };
      
      return {
        ...roommate,
        compatibilityScore: overallScore,
        compatibilityDetails
      };
    })
    .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
    .slice(0, 6); // Return top 6 matches
  }
  
  // Listing methods
  async getListings(filters?: ListingFilters, currentUserId?: number): Promise<Listing[]> {
    let listings = Array.from(this.listings.values());

    // Filter for public listings or listings owned by current user
    listings = listings.filter(l => 
      l.isPublic === true || (currentUserId !== undefined && l.userId === currentUserId)
    );
    
    // Apply filters
    if (filters) {
      if (filters.location) {
        listings = listings.filter(l => 
          l.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      
      if (filters.minPrice !== undefined) {
        listings = listings.filter(l => l.price >= filters.minPrice!);
      }
      
      if (filters.maxPrice !== undefined) {
        listings = listings.filter(l => l.price <= filters.maxPrice!);
      }
      
      if (filters.roomType) {
        listings = listings.filter(l => l.roomType === filters.roomType);
      }
      
      if (filters.amenities && filters.amenities.length > 0) {
        listings = listings.filter(l => 
          filters.amenities!.some(amenity => l.amenities.includes(amenity))
        );
      }
      
      if (filters.availableNow) {
        const today = new Date().toISOString().split('T')[0];
        listings = listings.filter(l => l.availableFrom <= today);
      }
    }
    
    return listings;
  }
  
  async getListingById(id: number, currentUserId?: number): Promise<Listing | undefined> {
    const listing = this.listings.get(id);
    
    // If no listing found, return undefined
    if (!listing) {
      return undefined;
    }
    
    // Check if listing is public or belongs to the current user
    if (listing.isPublic || (currentUserId !== undefined && listing.userId === currentUserId)) {
      return listing;
    }
    
    // Otherwise, don't return the private listing
    return undefined;
  }
  
  async getFeaturedListings(): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => listing.isFeatured && listing.isPublic)
      .slice(0, 3); // Return top 3 featured listings
  }
  
  async getUserListings(userId: number): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => listing.userId === userId);
  }
  
  async createListing(userId: number, listing: Omit<Listing, "id" | "userId" | "createdAt">): Promise<Listing> {
    const id = this.listingId++;
    const newListing: Listing = {
      id,
      userId,
      ...listing,
      // Ensure arrays are initialized even if not provided
      amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
      images: Array.isArray(listing.images) ? listing.images : [],
      // Set default values for other fields
      isFeatured: listing.isFeatured ?? false,
      rating: listing.rating ?? 0,
      createdAt: new Date()
    };
    
    this.listings.set(id, newListing);
    return newListing;
  }
  
  // Message methods
  async getMessages(userId: number, otherUserId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === userId && message.receiverId === otherUserId) ||
        (message.senderId === otherUserId && message.receiverId === userId)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async getConversations(userId: number): Promise<Conversation[]> {
    // Get all messages where the user is either sender or receiver
    const userMessages = Array.from(this.messages.values())
      .filter(message => message.senderId === userId || message.receiverId === userId);
    
    // Find unique conversation partners
    const conversationPartners = new Set<number>();
    userMessages.forEach(message => {
      if (message.senderId === userId) {
        conversationPartners.add(message.receiverId);
      } else {
        conversationPartners.add(message.senderId);
      }
    });
    
    // Build conversation objects
    const conversations: Conversation[] = [];
    for (const partnerId of conversationPartners) {
      const partner = await this.getUser(partnerId);
      if (!partner) continue;
      
      // Get the latest message in this conversation
      const messages = await this.getMessages(userId, partnerId);
      const latestMessage = messages[messages.length - 1];
      
      if (latestMessage) {
        conversations.push({
          userId: partnerId,
          name: `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || partner.username,
          profileImage: partner.profileImage,
          lastMessage: latestMessage.content,
          lastMessageTime: latestMessage.timestamp,
          read: latestMessage.senderId === userId || latestMessage.read
        });
      }
    }
    
    // Sort by most recent message
    return conversations.sort((a, b) => 
      b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
  }
  
  async createMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = {
      id,
      ...message,
      timestamp: new Date()
    };
    
    this.messages.set(id, newMessage);
    
    // Update or create conversation
    const conversationKey = this.getConversationKey(message.senderId, message.receiverId);
    this.conversations.set(conversationKey, {
      lastMessageId: id,
      updatedAt: new Date()
    });
    
    return newMessage;
  }
  
  // Badge methods
  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }
  
  async getBadgeById(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    const user = await this.getUser(userId);
    if (!user || !user.userBadges) return [];
    return user.userBadges;
  }
  
  async awardBadge(userId: number, badgeId: number): Promise<UserBadge> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const badge = await this.getBadgeById(badgeId);
    if (!badge) {
      throw new Error("Badge not found");
    }
    
    // Create UserBadge
    const userBadge: UserBadge = {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      awardedAt: new Date()
    };
    
    // Add badge to user
    if (!user.userBadges) {
      user.userBadges = [];
    }
    
    // Check if user already has this badge
    if (!user.userBadges.some(b => b.id === badgeId)) {
      user.userBadges.push(userBadge);
      this.users.set(user.id, user);
    }
    
    return userBadge;
  }
  
  async calculateProfileCompletion(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Fields to check for profile completion
    const fields = [
      'firstName',
      'lastName',
      'age',
      'gender',
      'occupation',
      'location',
      'bio',
      'profileImage'
    ];
    
    let completedFields = 0;
    fields.forEach(field => {
      if (user[field as keyof User] !== null && user[field as keyof User] !== undefined) {
        completedFields++;
      }
    });
    
    // Check preferences array
    if (user.preferences && user.preferences.length > 0) {
      completedFields++;
    }
    
    // Calculate percentage (9 is the total number of fields including preferences)
    const percentage = Math.round((completedFields / 9) * 100);
    
    // Update user profile completion
    user.profileCompletion = percentage;
    this.users.set(user.id, user);
    
    // Check if completion meets badge thresholds and award badges
    this.checkProfileCompletionBadges(user.id, percentage);
    
    return percentage;
  }
  
  // Helper method to award profile completion badges
  private async checkProfileCompletionBadges(userId: number, completion: number): Promise<void> {
    if (completion >= 25) {
      // Find or create the "Profile Starter" badge
      let starterBadge = Array.from(this.badges.values()).find(b => b.name === "Profile Starter");
      if (!starterBadge) {
        starterBadge = {
          id: this.badgeId++,
          name: "Profile Starter",
          description: "Completed 25% of your profile",
          icon: "🏅",
          category: "profile",
          criteria: "Complete 25% of your profile",
          requiredPoints: 25
        };
        this.badges.set(starterBadge.id, starterBadge);
      }
      await this.awardBadge(userId, starterBadge.id);
    }
    
    if (completion >= 50) {
      // Find or create the "Halfway There" badge
      let halfwayBadge = Array.from(this.badges.values()).find(b => b.name === "Halfway There");
      if (!halfwayBadge) {
        halfwayBadge = {
          id: this.badgeId++,
          name: "Halfway There",
          description: "Completed 50% of your profile",
          icon: "🥈",
          category: "profile",
          criteria: "Complete 50% of your profile",
          requiredPoints: 50
        };
        this.badges.set(halfwayBadge.id, halfwayBadge);
      }
      await this.awardBadge(userId, halfwayBadge.id);
    }
    
    if (completion >= 75) {
      // Find or create the "Almost Complete" badge
      let almostBadge = Array.from(this.badges.values()).find(b => b.name === "Almost Complete");
      if (!almostBadge) {
        almostBadge = {
          id: this.badgeId++,
          name: "Almost Complete",
          description: "Completed 75% of your profile",
          icon: "🥇",
          category: "profile",
          criteria: "Complete 75% of your profile",
          requiredPoints: 75
        };
        this.badges.set(almostBadge.id, almostBadge);
      }
      await this.awardBadge(userId, almostBadge.id);
    }
    
    if (completion === 100) {
      // Find or create the "Profile Master" badge
      let masterBadge = Array.from(this.badges.values()).find(b => b.name === "Profile Master");
      if (!masterBadge) {
        masterBadge = {
          id: this.badgeId++,
          name: "Profile Master",
          description: "Completed 100% of your profile",
          icon: "🏆",
          category: "profile",
          criteria: "Complete 100% of your profile",
          requiredPoints: 100
        };
        this.badges.set(masterBadge.id, masterBadge);
      }
      await this.awardBadge(userId, masterBadge.id);
    }
  }
  
  // Helper methods
  private hashPassword(password: string): string {
    // In a real app, use a proper password hashing library like bcrypt
    return crypto.createHash('sha256').update(password).digest('hex');
  }
  
  private getConversationKey(user1Id: number, user2Id: number): string {
    // Ensure consistent key regardless of order
    return [user1Id, user2Id].sort().join('-');
  }
  
  private seedData(): void {
    // Add sample users, roommates, listings, and messages for development
    // This will be replaced by real user data in production
    
    // Sample users
    const user1: User = {
      id: this.userId++,
      username: "sarah_j",
      password: this.hashPassword("password123"),
      firstName: "Sarah",
      lastName: "Johnson",
      age: 28,
      gender: "female",
      occupation: "Marketing Manager",
      location: "Downtown, New York",
      bio: "I'm a tidy, social professional looking for a compatible roommate. I enjoy cooking and quiet evenings during the week, but I'm social on weekends.",
      preferences: ["Non-smoker", "Early bird", "Clean", "Pet-friendly"],
      profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      isVerified: true,
      profileCompletion: 100,
      userBadges: [],
      createdAt: new Date()
    };
    
    const user2: User = {
      id: this.userId++,
      username: "alex_dev",
      password: this.hashPassword("password123"),
      firstName: "Alex",
      lastName: "Chen",
      age: 26,
      gender: "male",
      occupation: "Software Developer",
      location: "Williamsburg, Brooklyn",
      bio: "Software developer who works from home most days. I'm quiet, clean, and respect personal space. Looking for a roommate with similar values.",
      preferences: ["Non-smoker", "Night owl", "Organized", "Quiet"],
      profileImage: "https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      isVerified: true,
      profileCompletion: 100,
      userBadges: [],
      createdAt: new Date()
    };
    
    const user3: User = {
      id: this.userId++,
      username: "jamie_g",
      password: this.hashPassword("password123"),
      firstName: "Jamie",
      lastName: "Garcia",
      age: 24,
      gender: "non-binary",
      occupation: "Graphic Designer",
      location: "Chelsea, New York",
      bio: "Creative soul who enjoys art, music, and good conversation. Looking for a roommate who appreciates a vibrant living space with character.",
      preferences: ["Non-smoker", "Flexible schedule", "Creative", "Social"],
      profileImage: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      isVerified: true,
      profileCompletion: 100,
      userBadges: [],
      createdAt: new Date()
    };
    
    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    this.users.set(user3.id, user3);
    
    // Sample roommate data
    this.roommates.set(user1.id, {
      isLookingForRoom: true,
      budget: 1200,
      moveInDate: "2023-09-01",
      duration: "1 year",
      compatibilityScore: 89
    });
    
    this.roommates.set(user2.id, {
      isLookingForRoom: true,
      budget: 1350,
      moveInDate: "2023-08-15",
      duration: "6+ months",
      compatibilityScore: 85
    });
    
    this.roommates.set(user3.id, {
      isLookingForRoom: true,
      budget: 1100,
      moveInDate: "2023-10-01",
      duration: "1+ year",
      compatibilityScore: 82
    });
    
    // Sample listings
    const listing1: Listing = {
      id: this.listingId++,
      userId: user1.id,
      title: "Modern Studio Apartment",
      description: "Beautiful, newly renovated studio in the heart of East Village. Close to restaurants, bars, and public transportation. Looking for a clean, responsible roommate.",
      location: "East Village, New York",
      price: 1200,
      roomType: "Private Room",
      roommates: 1,
      availableFrom: "2023-08-01",
      amenities: ["Furnished", "Utilities Included", "WiFi"],
      images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"],
      isFeatured: true,
      isPublic: true,
      rating: 48, // Represents 4.8 as integer
      createdAt: new Date()
    };
    
    const listing2: Listing = {
      id: this.listingId++,
      userId: user2.id,
      title: "Spacious Room in Shared Apartment",
      description: "Large private room in a 2-bedroom apartment. The space is bright, clean, and in a great neighborhood. Looking for a quiet, responsible roommate.",
      location: "Williamsburg, Brooklyn",
      price: 950,
      roomType: "Private Room",
      roommates: 2,
      availableFrom: "2023-09-01",
      amenities: ["Partially Furnished", "Laundry", "Balcony"],
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"],
      isFeatured: true,
      isPublic: true,
      rating: 46, // Represents 4.6 as integer
      createdAt: new Date()
    };
    
    const listing3: Listing = {
      id: this.listingId++,
      userId: user3.id,
      title: "Cozy Room in Brownstone",
      description: "Charming room in a historic brownstone with lots of character. Shared living room and kitchen with 3 creative professionals. Great for artists!",
      location: "Park Slope, Brooklyn",
      price: 1100,
      roomType: "Private Room",
      roommates: 3,
      availableFrom: "2023-10-15",
      amenities: ["Furnished", "Garden Access", "Pets Allowed"],
      images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"],
      isFeatured: true,
      isPublic: true,
      rating: 49, // Represents 4.9 as integer
      createdAt: new Date()
    };
    
    this.listings.set(listing1.id, listing1);
    this.listings.set(listing2.id, listing2);
    this.listings.set(listing3.id, listing3);
    
    // Sample messages
    const message1: Message = {
      id: this.messageId++,
      senderId: user1.id,
      receiverId: user2.id,
      content: "Hi! I saw your profile and think we might be compatible roommates. Are you still looking?",
      read: true,
      timestamp: new Date(Date.now() - 86400000 * 3) // 3 days ago
    };
    
    const message2: Message = {
      id: this.messageId++,
      senderId: user2.id,
      receiverId: user1.id,
      content: "Hey Sarah! Yes, I'm still looking. Your profile looks great. Would you like to chat more about our preferences?",
      read: true,
      timestamp: new Date(Date.now() - 86400000 * 2) // 2 days ago
    };
    
    const message3: Message = {
      id: this.messageId++,
      senderId: user1.id,
      receiverId: user2.id,
      content: "Definitely! I noticed we both prefer a clean living space. What are your typical work hours like?",
      read: false,
      timestamp: new Date(Date.now() - 86400000) // 1 day ago
    };
    
    this.messages.set(message1.id, message1);
    this.messages.set(message2.id, message2);
    this.messages.set(message3.id, message3);
    
    // Update conversations
    this.conversations.set(this.getConversationKey(user1.id, user2.id), {
      lastMessageId: message3.id,
      updatedAt: message3.timestamp
    });
  }
}

export class DatabaseStorage implements IStorage {
  private db = dbInstance;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
  }

  // Helper methods
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = this.hashPassword(insertUser.password);
    
    const result = await this.db.insert(users).values({
      username: insertUser.username,
      password: hashedPassword,
      preferences: [],
      isVerified: false,
      profileCompletion: 0,
      userBadges: []
    }).returning();
    
    return result[0];
  }

  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User> {
    const result = await this.db.update(users)
      .set(profile)
      .where(eq(users.id, id))
      .returning();
    
    if (!result.length) {
      throw new Error("User not found");
    }
    
    return result[0];
  }

  // Roommate methods
  async getRoommates(filters?: RoommateFilters): Promise<Roommate[]> {
    let query = this.db
      .select({
        ...users,
        ...roommates,
      })
      .from(users)
      .innerJoin(roommates, eq(users.id, roommates.userId));
    
    // Apply filters
    if (filters) {
      const conditions = [];
      
      if (filters.location) {
        conditions.push(like(users.location, `%${filters.location}%`));
      }
      
      if (filters.minAge !== undefined) {
        conditions.push(gte(users.age, filters.minAge));
      }
      
      if (filters.maxAge !== undefined) {
        conditions.push(lte(users.age, filters.maxAge));
      }
      
      if (filters.gender) {
        conditions.push(eq(users.gender, filters.gender));
      }
      
      if (filters.isVerified) {
        conditions.push(eq(users.isVerified, true));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    const results = await query;
    
    // Post-process for lifestyle preferences if needed
    let filteredResults = results;
    if (filters?.lifestyle && filters.lifestyle.length > 0) {
      filteredResults = results.filter(r => {
        return r.preferences && filters.lifestyle!.some(pref => 
          r.preferences.includes(pref)
        );
      });
    }
    
    return filteredResults as unknown as Roommate[];
  }

  async getTopMatches(userId: number): Promise<Roommate[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    const roommates = await this.getRoommates();
    
    // Exclude the current user
    const otherRoommates = roommates.filter(r => r.id !== userId);
    
    // Calculate compatibility scores with detailed breakdown
    return otherRoommates.map(roommate => {
      // Lifestyle compatibility (based on preferences)
      const commonPreferences = user.preferences?.filter(
        pref => roommate.preferences?.includes(pref)
      ) || [];
      
      const totalPreferences = new Set([
        ...(user.preferences || []),
        ...(roommate.preferences || [])
      ]).size;
      
      const lifestyleScore = totalPreferences > 0 
        ? Math.round((commonPreferences.length / totalPreferences) * 100) 
        : 50;
      
      // Location compatibility
      const locationScore = user.location && roommate.location && 
        user.location.toLowerCase() === roommate.location.toLowerCase() 
        ? 100 
        : user.location && roommate.location && 
          (user.location.toLowerCase().includes(roommate.location.toLowerCase()) || 
           roommate.location.toLowerCase().includes(user.location.toLowerCase()))
          ? 75
          : 50;
      
      // Schedule compatibility (simple algorithm based on lifestyle tags)
      const userSchedulePrefs = (user.preferences || []).filter(p => 
        ['Early bird', 'Night owl'].includes(p)
      );
      
      const roommateSchedulePrefs = (roommate.preferences || []).filter(p => 
        ['Early bird', 'Night owl'].includes(p)
      );
      
      const scheduleScore = userSchedulePrefs.length > 0 && roommateSchedulePrefs.length > 0
        ? userSchedulePrefs.some(p => roommateSchedulePrefs.includes(p)) ? 100 : 30
        : 70; // Neutral if one or both don't specify
      
      // Overall score is weighted average
      const overallScore = Math.round(
        (lifestyleScore * 0.5) + 
        (locationScore * 0.3) + 
        (scheduleScore * 0.2)
      );
      
      // Create detailed compatibility breakdown
      const compatibilityDetails = {
        lifestyleScore,
        locationScore,
        scheduleScore,
        overallScore,
        commonInterests: commonPreferences
      };
      
      return {
        ...roommate,
        compatibilityScore: overallScore,
        compatibilityDetails
      };
    })
    .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
    .slice(0, 6); // Return top 6 matches
  }

  // Listing methods
  async getListings(filters?: ListingFilters, currentUserId?: number): Promise<Listing[]> {
    // Build array of conditions
    const conditions = [];
    
    // Base condition - public listings or user's own listings
    conditions.push(
      or(
        eq(listings.isPublic, true),
        currentUserId ? eq(listings.userId, currentUserId) : undefined
      )
    );
    
    // Apply filters
    if (filters) {
      if (filters.location) {
        conditions.push(like(listings.location, `%${filters.location}%`));
      }
      
      if (filters.minPrice !== undefined) {
        conditions.push(gte(listings.price, filters.minPrice));
      }
      
      if (filters.maxPrice !== undefined) {
        conditions.push(lte(listings.price, filters.maxPrice));
      }
      
      if (filters.roomType) {
        conditions.push(eq(listings.roomType, filters.roomType));
      }
      
      if (filters.availableNow) {
        const today = new Date().toISOString().split('T')[0];
        conditions.push(lte(listings.availableFrom, today));
      }
    }
    
    // Execute query with all conditions combined with AND
    const results = await this.db.select()
      .from(listings)
      .where(and(...conditions.filter(Boolean)));
    
    // Post-process for amenities if needed
    let filteredResults = results;
    if (filters?.amenities && filters.amenities.length > 0) {
      filteredResults = results.filter(l => {
        return l.amenities && filters.amenities!.some(amenity => 
          l.amenities.includes(amenity)
        );
      });
    }
    
    // Enhance with username info
    const enhancedResults = await Promise.all(
      filteredResults.map(async (listing) => {
        const user = await this.getUser(listing.userId);
        return {
          ...listing,
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : undefined
        };
      })
    );
    
    return enhancedResults;
  }

  async getListingById(id: number, currentUserId?: number): Promise<Listing | undefined> {
    const result = await this.db.select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!result.length) return undefined;
    
    const listing = result[0];
    
    // Check if listing is public or belongs to the current user
    if (!listing.isPublic && (!currentUserId || listing.userId !== currentUserId)) {
      return undefined; // Return undefined for private listings not owned by current user
    }
    
    const user = await this.getUser(listing.userId);
    
    return {
      ...listing,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : undefined
    };
  }

  async getFeaturedListings(): Promise<Listing[]> {
    const result = await this.db.select()
      .from(listings)
      .where(and(
        eq(listings.isFeatured, true),
        eq(listings.isPublic, true) // Only show public featured listings
      ))
      .limit(3);
    
    // Enhance with username info
    const enhancedResults = await Promise.all(
      result.map(async (listing) => {
        const user = await this.getUser(listing.userId);
        return {
          ...listing,
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : undefined
        };
      })
    );
    
    return enhancedResults;
  }

  async getUserListings(userId: number): Promise<Listing[]> {
    const result = await this.db.select()
      .from(listings)
      .where(eq(listings.userId, userId));
    
    const user = await this.getUser(userId);
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : undefined;
    
    return result.map(listing => ({
      ...listing,
      userName
    }));
  }

  async createListing(userId: number, listing: Omit<Listing, "id" | "userId" | "createdAt">): Promise<Listing> {
    const result = await this.db.insert(listings).values({
      userId,
      ...listing,
      // Ensure arrays are properly handled
      amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
      images: Array.isArray(listing.images) ? listing.images : [],
      // Set default values
      roommates: listing.roommates ?? 0,
      isFeatured: false,
      rating: 0, // Start with a neutral rating until reviewed
    }).returning();
    
    const user = await this.getUser(userId);
    
    return {
      ...result[0],
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : undefined
    };
  }

  // Message methods
  async getMessages(userId: number, otherUserId: number): Promise<Message[]> {
    const result = await this.db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId),
            eq(messages.receiverId, otherUserId)
          ),
          and(
            eq(messages.senderId, otherUserId),
            eq(messages.receiverId, userId)
          )
        )
      )
      .orderBy(asc(messages.timestamp));
    
    // Mark messages as read
    await this.db.update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, userId),
          eq(messages.read, false)
        )
      );
    
    // Enhance with sender names
    const enhancedResults = await Promise.all(
      result.map(async (message) => {
        const sender = await this.getUser(message.senderId);
        return {
          ...message,
          senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.username : undefined
        };
      })
    );
    
    return enhancedResults;
  }

  async getConversations(userId: number): Promise<Conversation[]> {
    try {
      // Find all messages for this user
      const userMessages = await this.db.select()
        .from(messages)
        .where(
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        );
      
      // Find unique conversation partners
      const partners = new Set<number>();
      userMessages.forEach(msg => {
        if (msg.senderId === userId) {
          partners.add(msg.receiverId);
        } else {
          partners.add(msg.senderId);
        }
      });
      
      // Build conversation objects
      const conversations: Conversation[] = [];
      
      for (const partnerId of partners) {
        // Get partner info
        const partner = await this.getUser(partnerId);
        if (!partner) continue;
        
        // Get the latest message for this conversation
        const conversationMessages = userMessages.filter(msg => 
          (msg.senderId === userId && msg.receiverId === partnerId) ||
          (msg.senderId === partnerId && msg.receiverId === userId)
        ).sort((a, b) => {
          // Sort by timestamp descending
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
          return timeB - timeA;
        });
        
        if (conversationMessages.length > 0) {
          const latestMessage = conversationMessages[0];
          
          conversations.push({
            userId: partnerId,
            name: `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || partner.username,
            profileImage: partner.profileImage || undefined,
            lastMessage: latestMessage.content,
            lastMessageTime: latestMessage.timestamp instanceof Date ? latestMessage.timestamp : new Date(),
            read: latestMessage.senderId === userId || !!latestMessage.read
          });
        }
      }
      
      // Sort by most recent message
      return conversations.sort((a, b) => 
        b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
      );
    } catch (error) {
      console.error("Error getting conversations:", error);
      return [];
    }
  }

  async createMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message> {
    try {
      // Ensure read is properly set
      const messageData = {
        ...message,
        read: message.read === undefined ? false : message.read
      };
      
      const result = await this.db.insert(messages).values(messageData).returning();
      
      if (!result || result.length === 0) {
        throw new Error("Failed to create message");
      }
      
      const newMessage = result[0];
      
      // Try to update or create conversation record if needed
      try {
        const conversationKey = this.getConversationKey(message.senderId, message.receiverId);
        const [user1Id, user2Id] = conversationKey.split('-').map(Number);
        
        const existingConversation = await this.db.select()
          .from(conversations)
          .where(
            or(
              and(
                eq(conversations.user1Id, user1Id),
                eq(conversations.user2Id, user2Id)
              ),
              and(
                eq(conversations.user1Id, user2Id),
                eq(conversations.user2Id, user1Id)
              )
            )
          )
          .limit(1);
        
        if (existingConversation.length) {
          await this.db.update(conversations)
            .set({ 
              lastMessageId: newMessage.id,
              updatedAt: new Date()
            })
            .where(eq(conversations.id, existingConversation[0].id));
        } else {
          await this.db.insert(conversations).values({
            user1Id,
            user2Id,
            lastMessageId: newMessage.id
          });
        }
      } catch (convError) {
        console.error("Error updating conversation:", convError);
        // Continue even if conversation update fails
      }
      
      // Get sender info
      const sender = await this.getUser(message.senderId);
      
      return {
        ...newMessage,
        senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.username : undefined
      };
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  }

  private getConversationKey(user1Id: number, user2Id: number): string {
    // Ensure consistent key regardless of order
    return [user1Id, user2Id].sort().join('-');
  }

  // Badge methods
  async getAllBadges(): Promise<Badge[]> {
    const result = await this.db.select().from(badges);
    return result;
  }

  async getBadgeById(id: number): Promise<Badge | undefined> {
    const result = await this.db.select().from(badges).where(eq(badges.id, id)).limit(1);
    return result[0];
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    const user = await this.getUser(userId);
    return user?.userBadges || [];
  }

  async awardBadge(userId: number, badgeId: number): Promise<UserBadge> {
    // Get the badge details
    const badge = await this.getBadgeById(badgeId);
    if (!badge) {
      throw new Error(`Badge with ID ${badgeId} not found`);
    }

    // Get the user
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Check if the user already has this badge
    const existingBadges = user.userBadges || [];
    if (existingBadges.some(b => b.id === badgeId)) {
      // User already has this badge, return it
      return existingBadges.find(b => b.id === badgeId)!;
    }

    // Create a new badge entry for the user
    const userBadge: UserBadge = {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      awardedAt: new Date()
    };

    // Add the badge to the user's badges and update the user
    const updatedBadges = [...existingBadges, userBadge];
    await this.db.update(users)
      .set({ userBadges: updatedBadges })
      .where(eq(users.id, userId));

    return userBadge;
  }

  async calculateProfileCompletion(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Define fields that contribute to profile completeness
    const fields = [
      !!user.firstName,
      !!user.lastName,
      !!user.age,
      !!user.gender,
      !!user.occupation,
      !!user.location,
      !!user.bio,
      !!(user.preferences && user.preferences.length > 0),
      !!user.profileImage,
    ];

    // Calculate percentage based on filled fields
    const filledFields = fields.filter(Boolean).length;
    const totalFields = fields.length;
    const completion = Math.round((filledFields / totalFields) * 100);

    // Update user's profile completion if it has changed
    if (user.profileCompletion !== completion) {
      await this.db.update(users)
        .set({ profileCompletion: completion })
        .where(eq(users.id, userId));

      // Check if we need to award new badges
      await this.checkProfileCompletionBadges(userId, completion);
    }

    return completion;
  }

  private async checkProfileCompletionBadges(userId: number, completion: number): Promise<void> {
    if (completion >= 25) {
      // Find or create the "Profile Starter" badge
      let starterBadge = (await this.getAllBadges()).find(b => b.name === "Profile Starter");
      if (!starterBadge) {
        // Create the badge in the database
        const [newBadge] = await this.db.insert(badges).values({
          name: "Profile Starter",
          description: "Completed 25% of your profile",
          icon: "🏅",
          category: "profile",
          criteria: "Complete 25% of your profile",
          requiredPoints: 25
        }).returning();
        starterBadge = newBadge;
      }
      await this.awardBadge(userId, starterBadge.id);
    }

    if (completion >= 50) {
      // Find or create the "Halfway There" badge
      let halfwayBadge = (await this.getAllBadges()).find(b => b.name === "Halfway There");
      if (!halfwayBadge) {
        // Create the badge in the database
        const [newBadge] = await this.db.insert(badges).values({
          name: "Halfway There",
          description: "Completed 50% of your profile",
          icon: "🥈",
          category: "profile",
          criteria: "Complete 50% of your profile",
          requiredPoints: 50
        }).returning();
        halfwayBadge = newBadge;
      }
      await this.awardBadge(userId, halfwayBadge.id);
    }

    if (completion >= 75) {
      // Find or create the "Almost Complete" badge
      let almostBadge = (await this.getAllBadges()).find(b => b.name === "Almost Complete");
      if (!almostBadge) {
        // Create the badge in the database
        const [newBadge] = await this.db.insert(badges).values({
          name: "Almost Complete",
          description: "Completed 75% of your profile",
          icon: "🥇",
          category: "profile",
          criteria: "Complete 75% of your profile",
          requiredPoints: 75
        }).returning();
        almostBadge = newBadge;
      }
      await this.awardBadge(userId, almostBadge.id);
    }

    if (completion === 100) {
      // Find or create the "Profile Master" badge
      let masterBadge = (await this.getAllBadges()).find(b => b.name === "Profile Master");
      if (!masterBadge) {
        // Create the badge in the database
        const [newBadge] = await this.db.insert(badges).values({
          name: "Profile Master",
          description: "Completed 100% of your profile",
          icon: "🏆",
          category: "profile",
          criteria: "Complete 100% of your profile",
          requiredPoints: 100
        }).returning();
        masterBadge = newBadge;
      }
      await this.awardBadge(userId, masterBadge.id);
    }
  }
}

// Initialize appropriate storage based on environment
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
