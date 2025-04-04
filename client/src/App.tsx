import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./lib/auth.tsx";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import FindRoommates from "@/pages/find-roommates";
import Listings from "@/pages/listings";
import ListingDetail from "@/pages/listing-detail";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import RoommateProfile from "@/pages/roommate-profile";
import Login from "@/pages/login";
import Register from "@/pages/register";
import CreateListing from "@/pages/create-listing";

function Router() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/find-roommates" component={FindRoommates} />
      <Route path="/listings/:id" component={ListingDetail} />
      <Route path="/listings" component={Listings} />
      <Route path="/messages/:id" component={Messages} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route path="/roommate/:id" component={RoommateProfile} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/create-listing" component={CreateListing} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
