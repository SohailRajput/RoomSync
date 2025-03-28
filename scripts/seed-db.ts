import { db } from "../server/db";
import { users, roommates, listings, messages, conversations } from "../shared/schema";
import * as crypto from "crypto";

// Helper function to hash passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedDatabase() {
  console.log("Seeding database...");
  
  // Check for existing users
  const existingUsers = await db.select().from(users);
  let user1Id: number, user2Id: number, user3Id: number;
  
  // Use existing users if available, otherwise create new ones
  if (existingUsers.length > 0) {
    console.log("Users already exist, using existing users");
    user1Id = existingUsers[0].id;
    user2Id = existingUsers[1].id;
    user3Id = existingUsers[2].id;
  } else {
    // Create users
    const user1 = await db.insert(users).values({
      username: "sarah_j",
      password: hashPassword("password123"),
      firstName: "Sarah",
      lastName: "Johnson",
      age: 28,
      gender: "female",
      occupation: "Marketing Manager",
      location: "Downtown, New York",
      bio: "I'm a tidy, social professional looking for a compatible roommate. I enjoy cooking and quiet evenings during the week, but I'm social on weekends.",
      preferences: ["Non-smoker", "Early bird", "Clean", "Pet-friendly"],
      profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      isVerified: true
    }).returning();
    
    const user2 = await db.insert(users).values({
      username: "alex_dev",
      password: hashPassword("password123"),
      firstName: "Alex",
      lastName: "Chen",
      age: 26,
      gender: "male",
      occupation: "Software Developer",
      location: "Williamsburg, Brooklyn",
      bio: "Software developer who works from home most days. I'm quiet, clean, and respect personal space. Looking for a roommate with similar values.",
      preferences: ["Non-smoker", "Night owl", "Organized", "Quiet"],
      profileImage: "https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      isVerified: true
    }).returning();
    
    const user3 = await db.insert(users).values({
      username: "jamie_g",
      password: hashPassword("password123"),
      firstName: "Jamie",
      lastName: "Garcia",
      age: 24,
      gender: "non-binary",
      occupation: "Graphic Designer",
      location: "Chelsea, New York",
      bio: "Creative soul who enjoys art, music, and good conversation. Looking for a roommate who appreciates a vibrant living space with character.",
      preferences: ["Non-smoker", "Flexible schedule", "Creative", "Social"],
      profileImage: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      isVerified: true
    }).returning();
    
    user1Id = user1[0].id;
    user2Id = user2[0].id;
    user3Id = user3[0].id;
    console.log("Created users:", user1Id, user2Id, user3Id);
    
    // Create roommate profiles
    await db.insert(roommates).values({
      userId: user1Id,
      isLookingForRoom: true,
      budget: 1200,
      moveInDate: "2023-09-01",
      duration: "1 year",
      compatibilityScore: 89
    });
    
    await db.insert(roommates).values({
      userId: user2Id,
      isLookingForRoom: true,
      budget: 1350,
      moveInDate: "2023-08-15",
      duration: "6+ months",
      compatibilityScore: 85
    });
    
    await db.insert(roommates).values({
      userId: user3Id,
      isLookingForRoom: true,
      budget: 1100,
      moveInDate: "2023-10-01",
      duration: "1+ year",
      compatibilityScore: 82
    });
    
    console.log("Created roommate profiles");
  }
  
  // Check for existing listings
  const existingListings = await db.select().from(listings);
  if (existingListings.length === 0) {
    // Create listings
    const listing1 = await db.insert(listings).values({
      userId: user1Id,
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
      rating: 5
    }).returning();
    
    const listing2 = await db.insert(listings).values({
      userId: user2Id,
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
      rating: 5
    }).returning();
    
    const listing3 = await db.insert(listings).values({
      userId: user3Id,
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
      rating: 5
    }).returning();
    
    console.log("Created listings");
  } else {
    console.log("Listings already exist, skipping listings creation");
  }
  
  // Check for existing messages
  const existingMessages = await db.select().from(messages);
  if (existingMessages.length === 0) {
    // Create messages
    const message1 = await db.insert(messages).values({
      senderId: user1Id,
      receiverId: user2Id,
      content: "Hi! I saw your profile and think we might be compatible roommates. Are you still looking?",
      read: true,
      timestamp: new Date(Date.now() - 86400000 * 3) // 3 days ago
    }).returning();
    
    const message2 = await db.insert(messages).values({
      senderId: user2Id,
      receiverId: user1Id,
      content: "Hey Sarah! Yes, I'm still looking. Your profile looks great. Would you like to chat more about our preferences?",
      read: true,
      timestamp: new Date(Date.now() - 86400000 * 2) // 2 days ago
    }).returning();
    
    const message3 = await db.insert(messages).values({
      senderId: user1Id,
      receiverId: user2Id,
      content: "Definitely! I noticed we both prefer a clean living space. What are your typical work hours like?",
      read: false,
      timestamp: new Date(Date.now() - 86400000) // 1 day ago
    }).returning();
    
    console.log("Created messages");
    
    // Check for existing conversations
    const existingConversations = await db.select().from(conversations);
    if (existingConversations.length === 0) {
      // Create conversation records
      await db.insert(conversations).values({
        user1Id: user1Id,
        user2Id: user2Id,
        lastMessageId: message3[0].id,
        updatedAt: message3[0].timestamp
      });
      
      console.log("Created conversations");
    } else {
      console.log("Conversations already exist, skipping conversation creation");
    }
  } else {
    console.log("Messages already exist, skipping messages and conversations creation");
  }
  
  console.log("Database seeding completed successfully!");
}

// Run the seeding function
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });