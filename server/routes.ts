import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, updateUserProfileSchema, insertListingSchema, insertMessageSchema } from "@shared/schema";
import session from "express-session";
import memorystore from "memorystore";
import crypto from "crypto";
import * as z from "zod";
import { fromZodError } from "zod-validation-error";

// Create a session store using memory store
const MemoryStore = memorystore(session);

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 },
  store: new MemoryStore({ checkPeriod: 86400000 }) // prune expired entries every 24h
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply session middleware
  app.use(session(sessionConfig));
  
  // Auth middleware to check if user is logged in
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };
  
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(data);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error('Registration error:', error);
        res.status(500).json({ 
          message: 'An error occurred during registration', 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Check password (simplified for in-memory storage)
      // In a real app, use a proper password comparison like bcrypt.compare
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: 'An error occurred during login', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        // Clear invalid session
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  // User profile routes
  app.get('/api/users/profile', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.put('/api/users/profile', requireAuth, async (req, res) => {
    try {
      const data = updateUserProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUserProfile(req.session.userId!, data);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: 'An error occurred updating profile' });
      }
    }
  });
  
  // Roommate routes
  app.get('/api/roommates', requireAuth, async (req, res) => {
    try {
      // Extract filter params from query
      const filters = {
        location: req.query.location as string | undefined,
        minAge: req.query.minAge ? parseInt(req.query.minAge as string) : undefined,
        maxAge: req.query.maxAge ? parseInt(req.query.maxAge as string) : undefined,
        gender: req.query.gender as string | undefined,
        lifestyle: req.query.lifestyle ? (req.query.lifestyle as string).split(',') : undefined,
        isVerified: req.query.isVerified === 'true'
      };
      
      const roommates = await storage.getRoommates(filters);
      
      // Remove sensitive information from roommates
      const sanitizedRoommates = roommates.map(roommate => {
        const { password, ...roommateWithoutPassword } = roommate;
        return roommateWithoutPassword;
      });
      
      res.status(200).json(sanitizedRoommates);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.get('/api/roommates/top-matches', requireAuth, async (req, res) => {
    try {
      const matches = await storage.getTopMatches(req.session.userId!);
      
      // Remove sensitive information from matches
      const sanitizedMatches = matches.map(match => {
        const { password, ...matchWithoutPassword } = match;
        return matchWithoutPassword;
      });
      
      res.status(200).json(sanitizedMatches);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  // Get compatibility details between logged-in user and specific roommate
  app.get('/api/roommates/compatibility/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const roommateId = parseInt(req.params.id);
      
      if (isNaN(roommateId)) {
        return res.status(400).json({ message: 'Invalid roommate ID' });
      }
      
      if (userId === roommateId) {
        return res.status(400).json({ message: 'Cannot calculate compatibility with yourself' });
      }
      
      const user = await storage.getUser(userId);
      const roommate = await storage.getUser(roommateId);
      
      if (!user || !roommate) {
        return res.status(404).json({ message: 'User or roommate not found' });
      }
      
      // Calculate compatibility scores with detailed breakdown
      const topMatches = await storage.getTopMatches(userId);
      const matchDetails = topMatches.find(r => r.id === roommateId);
      
      if (!matchDetails) {
        return res.status(404).json({ message: 'Compatibility details not available' });
      }
      
      // Return only compatibility-related information
      res.json({
        id: roommateId,
        compatibilityScore: matchDetails.compatibilityScore,
        compatibilityDetails: matchDetails.compatibilityDetails
      });
    } catch (error) {
      res.status(500).json({ message: 'Error calculating compatibility' });
    }
  });
  
  // Get specific roommate by ID
  app.get('/api/roommates/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid roommate ID' });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: 'Roommate not found' });
      }
      
      const roommates = await storage.getRoommates({ /* no filters */ });
      const roommate = roommates.find(r => r.id === id);
      
      if (!roommate) {
        return res.status(404).json({ message: 'Roommate not found' });
      }
      
      // Don't expose sensitive information like password
      const { password, ...roommateWithoutPassword } = roommate;
      
      res.json(roommateWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching roommate profile' });
    }
  });
  
  // Listing routes
  app.get('/api/listings', async (req, res) => {
    try {
      // Extract filter params from query
      const filters = {
        location: req.query.location as string | undefined,
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
        roomType: req.query.roomType as string | undefined,
        amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
        availableNow: req.query.availableNow === 'true'
      };
      
      const listings = await storage.getListings(filters);
      res.status(200).json(listings);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.get('/api/listings/featured', async (req, res) => {
    try {
      const featuredListings = await storage.getFeaturedListings();
      res.status(200).json(featuredListings);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.get('/api/listings/my-listings', requireAuth, async (req, res) => {
    try {
      const listings = await storage.getUserListings(req.session.userId!);
      res.status(200).json(listings);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.get('/api/listings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      const listing = await storage.getListingById(id);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      res.status(200).json(listing);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.post('/api/listings', requireAuth, async (req, res) => {
    try {
      const data = insertListingSchema.parse(req.body);
      // Add defaults for isFeatured and rating to match the required type
      const listingData = {
        ...data,
        // Ensure arrays are properly initialized
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        images: Array.isArray(data.images) ? data.images : [],
        // Set roommates to 0 if not provided
        roommates: data.roommates ?? 0,
        // Set default fields
        isFeatured: false,
        rating: 0
      };
      const listing = await storage.createListing(req.session.userId!, listingData);
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error('Error creating listing:', error);
        res.status(500).json({ message: 'An error occurred creating listing' });
      }
    }
  });
  
  // Message routes
  app.get('/api/messages/conversations', requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getConversations(req.session.userId!);
      res.status(200).json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.get('/api/messages/conversation/:userId', requireAuth, async (req, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const messages = await storage.getMessages(req.session.userId!, otherUserId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.post('/api/messages', requireAuth, async (req, res) => {
    try {
      const data = insertMessageSchema.parse({
        ...req.body,
        senderId: req.session.userId!,
        // Ensure read is properly set (false for new messages by default)
        read: req.body.read ?? false
      });
      
      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: 'An error occurred sending message' });
      }
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
