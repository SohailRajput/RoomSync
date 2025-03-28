import { users, type User, type InsertUser, type UpdateUserProfile, type Roommate, type Listing, type Message, type Conversation } from "@shared/schema";
import * as crypto from "crypto";

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
  getListings(filters?: ListingFilters): Promise<Listing[]>;
  getListingById(id: number): Promise<Listing | undefined>;
  getFeaturedListings(): Promise<Listing[]>;
  getUserListings(userId: number): Promise<Listing[]>;
  createListing(userId: number, listing: Omit<Listing, "id" | "userId" | "createdAt">): Promise<Listing>;
  
  // Message methods
  getMessages(userId: number, otherUserId: number): Promise<Message[]>;
  getConversations(userId: number): Promise<Conversation[]>;
  createMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message>;
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
  
  private userId: number = 1;
  private listingId: number = 1;
  private messageId: number = 1;
  
  constructor() {
    this.users = new Map();
    this.roommates = new Map();
    this.listings = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    
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
      preferences: [],
      isVerified: false,
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
    
    // Calculate compatibility scores (simplified version)
    return otherRoommates.map(roommate => {
      const commonPreferences = user.preferences?.filter(
        pref => roommate.preferences?.includes(pref)
      ).length || 0;
      
      const totalPreferences = new Set([
        ...(user.preferences || []),
        ...(roommate.preferences || [])
      ]).size;
      
      const score = totalPreferences > 0 
        ? Math.round((commonPreferences / totalPreferences) * 100) 
        : 50; // Default score
      
      return {
        ...roommate,
        compatibilityScore: score
      };
    })
    .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
    .slice(0, 6); // Return top 6 matches
  }
  
  // Listing methods
  async getListings(filters?: ListingFilters): Promise<Listing[]> {
    let listings = Array.from(this.listings.values());
    
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
  
  async getListingById(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }
  
  async getFeaturedListings(): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => listing.isFeatured)
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
      isFeatured: false,
      rating: 4.5, // Default rating
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
      rating: 4.8,
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
      rating: 4.6,
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
      rating: 4.9,
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

export const storage = new MemStorage();
