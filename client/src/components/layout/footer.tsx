import { Home } from "lucide-react";
import { Link } from "wouter";
import { 
  FaFacebookF, 
  FaInstagram, 
  FaTwitter, 
  FaLinkedinIn 
} from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-neutral-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center">
              <Home className="h-6 w-6 text-primary mr-2" />
              <span className="font-heading font-bold text-xl text-white">RoomMatch</span>
            </div>
            <p className="text-neutral-300 text-base">
              Making roommate matching simple, safe, and stress-free since 2023.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-neutral-400 hover:text-neutral-300">
                <span className="sr-only">Facebook</span>
                <FaFacebookF className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-neutral-300">
                <span className="sr-only">Instagram</span>
                <FaInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-neutral-300">
                <span className="sr-only">Twitter</span>
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-neutral-300">
                <span className="sr-only">LinkedIn</span>
                <FaLinkedinIn className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-neutral-300 tracking-wider uppercase">
                  Features
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/find-roommates" className="text-base text-neutral-400 hover:text-neutral-300">
                      Find Roommates
                    </Link>
                  </li>
                  <li>
                    <Link href="/create-listing" className="text-base text-neutral-400 hover:text-neutral-300">
                      List a Room
                    </Link>
                  </li>
                  <li>
                    <Link href="/find-roommates" className="text-base text-neutral-400 hover:text-neutral-300">
                      Compatibility Matching
                    </Link>
                  </li>
                  <li>
                    <Link href="/messages" className="text-base text-neutral-400 hover:text-neutral-300">
                      Messaging
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-neutral-300 tracking-wider uppercase">
                  Support
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Safety Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Community Guidelines
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-neutral-300 tracking-wider uppercase">
                  Company
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Jobs
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Press
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-neutral-300 tracking-wider uppercase">
                  Legal
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-400 hover:text-neutral-300">
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-neutral-700 pt-8">
          <p className="text-base text-neutral-400 xl:text-center">
            &copy; {currentYear} RoomMatch, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
