import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth.tsx";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, AlertTriangle } from "lucide-react";
import { type Message, type Conversation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(
    params.id ? parseInt(params.id) : null
  );
  const [newMessage, setNewMessage] = useState("");
  
  const { 
    data: conversations = [], 
    isLoading: conversationsLoading,
    error: conversationsError
  } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    refetchInterval: 5000, // Poll for new conversations every 5 seconds
  });
  
  const { 
    data: messages = [], 
    isLoading: messagesLoading,
    error: messagesError
  } = useQuery<Message[]>({
    queryKey: [`/api/messages/conversation/${selectedConversation}`],
    enabled: selectedConversation !== null,
    refetchInterval: 3000, // Poll for new messages every 3 seconds
  });
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      await apiRequest("POST", "/api/messages", {
        receiverId: selectedConversation,
        content: newMessage
      });
      
      setNewMessage("");
      
      // Refetch both messages and conversations
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [`/api/messages/conversation/${selectedConversation}`]
        }),
        queryClient.invalidateQueries({
          queryKey: ["/api/messages/conversations"]
        })
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error sending message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Please log in to view your messages</h2>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-neutral-900 font-heading mb-8">Messages</h1>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex h-[70vh]">
              {/* Conversation List */}
              <div className="w-1/3 border-r overflow-y-auto">
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Conversations</h2>
                </div>
                
                {conversationsLoading ? (
                  <div className="p-4">Loading conversations...</div>
                ) : conversationsError ? (
                  <div className="p-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500 font-medium mb-2">Error loading conversations</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["/api/messages/conversations"]
                        });
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                ) : conversations?.length ? (
                  <div>
                    {conversations.map((conversation) => (
                      <div 
                        key={conversation.userId}
                        className={`p-4 border-b flex items-center cursor-pointer hover:bg-neutral-50 ${
                          selectedConversation === conversation.userId ? 'bg-neutral-100' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation.userId)}
                      >
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={conversation.profileImage} />
                          <AvatarFallback>
                            {conversation.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <p className="font-medium truncate">{conversation.name}</p>
                            <p className="text-xs text-neutral-400">
                              {new Date(conversation.lastMessageTime).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-neutral-500 truncate">
                            {conversation.lastMessage}
                          </p>
                        </div>
                        {!conversation.read && (
                          <div className="ml-2 h-2 w-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-neutral-500">
                    No conversations yet
                  </div>
                )}
              </div>
              
              {/* Message Content */}
              <div className="w-2/3 flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b">
                      {conversations?.find(c => c.userId === selectedConversation)?.name && (
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage 
                              src={conversations.find(c => c.userId === selectedConversation)?.profileImage} 
                            />
                            <AvatarFallback>
                              {conversations.find(c => c.userId === selectedConversation)?.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <h2 className="font-semibold">
                            {conversations.find(c => c.userId === selectedConversation)?.name}
                          </h2>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messagesLoading ? (
                        <div className="text-center">Loading messages...</div>
                      ) : messagesError ? (
                        <div className="text-center p-4">
                          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                          <p className="text-red-500">Error loading messages</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => {
                              queryClient.invalidateQueries({
                                queryKey: [`/api/messages/conversation/${selectedConversation}`]
                              });
                            }}
                          >
                            Try Again
                          </Button>
                        </div>
                      ) : messages?.length ? (
                        messages.map((message: Message) => (
                          <div 
                            key={message.id}
                            className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                                message.senderId === user.id
                                  ? 'bg-primary text-white rounded-tr-none'
                                  : 'bg-neutral-100 rounded-tl-none'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className={`text-xs ${
                                message.senderId === user.id ? 'text-primary-foreground/70' : 'text-neutral-400'
                              } text-right mt-1`}>
                                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-neutral-500">
                          No messages yet. Start the conversation!
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t">
                      <form 
                        className="flex items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage();
                        }}
                      >
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 mr-2"
                        />
                        <Button type="submit" size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-neutral-500">
                      <p>Select a conversation to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
