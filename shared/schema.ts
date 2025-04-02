import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Type for user badges (stored in jsonb column)
export type UserBadge = {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  awardedAt: Date;
};

// Badge Schema
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  criteria: text("criteria").notNull(),
  category: text("category").notNull(), // profile, engagement, verification, etc.
  requiredPoints: integer("required_points").notNull().default(1),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true
});

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  age: integer("age"),
  gender: text("gender"),
  occupation: text("occupation"),
  location: text("location"),
  bio: text("bio"),
  preferences: text("preferences").array(),
  profileImage: text("profile_image"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  profileCompletion: integer("profile_completion").default(0), // 0-100%
  userBadges: jsonb("user_badges").$type<UserBadge[]>().default([]), // array of badges earned
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const updateUserProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  age: z.number().min(18).optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  preferences: z.array(z.string()).optional(),
  profileImage: z.string().optional(),
  profileCompletion: z.number().min(0).max(100).optional(),
  userBadges: z.array(z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    category: z.string(),
    awardedAt: z.date()
  })).optional(),
});

// Roommate Schema (extends user data)
export const roommates = pgTable("roommates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  budget: integer("budget"),
  moveInDate: text("move_in_date"),
  duration: text("duration"),
  isLookingForRoom: boolean("is_looking_for_room").default(true),
  compatibilityScore: integer("compatibility_score")
});

export const insertRoommateSchema = createInsertSchema(roommates).omit({
  id: true
});

// Listing Schema
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  price: integer("price").notNull(),
  roomType: text("room_type").notNull(),
  roommates: integer("roommates").default(0),
  availableFrom: text("available_from").notNull(),
  amenities: text("amenities").array(),
  images: text("images").array(),
  isFeatured: boolean("is_featured").default(false),
  isPublic: boolean("is_public").default(true),
  rating: integer("rating").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  userId: true,
  isFeatured: true,
  rating: true,
  createdAt: true
});

// Message Schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true
});

// Conversation Schema (for keeping track of conversations between users)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  lastMessageId: integer("last_message_id").references(() => messages.id),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Type definitions
export type Badge = typeof badges.$inferSelect;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export type CompatibilityDetails = {
  lifestyleScore: number;
  locationScore: number;
  scheduleScore: number;
  overallScore: number;
  commonInterests: string[];
};

export type Roommate = User & {
  id: number;
  budget?: number;
  moveInDate?: string;
  duration?: string;
  isLookingForRoom: boolean;
  compatibilityScore?: number;
  compatibilityDetails?: CompatibilityDetails;
  preferences: string[];
};

export type Listing = typeof listings.$inferSelect & {
  userId: number;
  userName?: string;
};

export type Message = typeof messages.$inferSelect & {
  senderName?: string;
};

export type Conversation = {
  userId: number;
  name: string;
  profileImage?: string;
  lastMessage: string;
  lastMessageTime: Date;
  read: boolean;
};
