"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRegistrationStatus } from "@/hooks/useRegistrationStatus";

export default function LandingPage() {
  const { allowRegistration, isClosedBeta, loading, message } = useRegistrationStatus();

  // Add landing page class to body to prevent mobile nav spacing
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.classList.add('landing-page');
      return () => {
        document.body.classList.remove('landing-page');
      };
    }
  }, []);

  return (
    <div className="App min-h-screen w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen w-full flex items-center justify-center px-4 md:px-6 lg:px-8">
        {/* Background Effects */}
        <div className="effect-circle-1"></div>
        <div className="effect-circle-2"></div>
        
        <div className="max-w-5xl w-full flex flex-col items-center justify-center text-center">
          {/* Top Badge */}
          <div className="mb-4 md:mb-6">
            <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-600 px-4 py-2 md:px-6 md:py-3 xl:px-8 xl:py-4 rounded-full text-sm md:text-base xl:text-lg 2xl:text-xl font-medium border border-cyan-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="hidden sm:inline">India's Premier Professional Network</span>
              <span className="sm:hidden">Premier Professional Network</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-7xl sm:text-8xl md:text-8xl lg:text-[5rem] xl:text-[6rem] 2xl:text-[7rem] font-extrabold mb-4 md:mb-6 text-gray-900 tracking-tight leading-tight lg:whitespace-nowrap">
            <span className="block sm:inline lg:inline">Connect. Grow.</span>{' '}
            <span className="text-cyan-500 block sm:inline lg:inline">Succeed.</span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-gray-600 mb-6 md:mb-8 xl:mb-10 2xl:mb-12 w-fit max-w-none leading-relaxed px-4">
            <span className="hidden lg:inline">
              Join India's fastest-growing professional network where students, <br />
              professionals, and companies come together to build the future of work.
            </span>
            <span className="lg:hidden">
              Join India's fastest-growing professional network where students, professionals, and companies come together to build the future of work.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="mb-8 md:mb-10 xl:mb-12 2xl:mb-16">
            <div className="flex flex-col sm:flex-row gap-4 xl:gap-6 2xl:gap-8 items-center justify-center w-full max-w-md xl:max-w-lg 2xl:max-w-xl mx-auto">
              {loading ? (
                <div className="w-full sm:w-auto">
                  <Button size="lg" disabled className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 xl:px-10 xl:py-5 2xl:px-12 2xl:py-6 text-lg xl:text-xl 2xl:text-2xl font-semibold rounded-lg">
                    Loading...
                  </Button>
                </div>
              ) : isClosedBeta ? (
                <div className="bg-yellow-50 text-yellow-800 px-6 py-4 xl:px-8 xl:py-5 2xl:px-10 2xl:py-6 rounded-lg border-2 border-yellow-200 text-center font-semibold w-full sm:w-auto text-base xl:text-lg 2xl:text-xl">
                  🚀 Closed Beta - Existing Users Only
                </div>
              ) : (
                <Button size="lg" asChild className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 xl:px-10 xl:py-5 2xl:px-12 2xl:py-6 text-lg xl:text-xl 2xl:text-2xl font-semibold rounded-lg transition-all duration-300 hover:scale-105">
                  <Link href="/auth/signup" className="flex items-center justify-center gap-2">
                    Get Started Free
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 px-8 py-4 xl:px-10 xl:py-5 2xl:px-12 2xl:py-6 text-lg xl:text-xl 2xl:text-2xl font-semibold rounded-lg transition-all duration-300">
                <Link href="/auth/login" className="flex items-center justify-center">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 xl:gap-10 2xl:gap-12 text-sm md:text-base xl:text-lg 2xl:text-xl text-gray-600">
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4 bg-cyan-500 rounded-full flex-shrink-0"></div>
              <span className="whitespace-nowrap">100% Free to Join</span>
            </div>
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="whitespace-nowrap">Verified Professionals</span>
            </div>
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span className="whitespace-nowrap">Secure Platform</span>
            </div>
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <span className="whitespace-nowrap">Made in India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4 md:mb-6">
              Everything you need to <span className="text-[#0BC0DF]">succeed</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Discover powerful features designed to accelerate your professional growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="group h-full">
              <div className="bg-gray-50 p-6 md:p-8 rounded-xl hover:bg-gray-100 transition-all duration-300 h-full flex flex-col">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0BC0DF] rounded-lg flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto md:mx-0">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-black mb-3 md:mb-4 text-center md:text-left">Interactive Feed</h3>
                <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed text-center md:text-left flex-grow">Stay updated with posts from your network. Like, comment, repost, and share industry insights.</p>
                
                <ul className="space-y-2 md:space-y-3 mt-auto">
                  <li className="flex items-center text-gray-600 text-sm md:text-base">
                    <div className="w-2 h-2 bg-[#0BC0DF] rounded-full mr-3 flex-shrink-0"></div>
                    People you may know
                  </li>
                  <li className="flex items-center text-gray-600 text-sm md:text-base">
                    <div className="w-2 h-2 bg-[#0BC0DF] rounded-full mr-3 flex-shrink-0"></div>
                    News & updates
                  </li>
                  <li className="flex items-center text-gray-600 text-sm md:text-base">
                    <div className="w-2 h-2 bg-[#0BC0DF] rounded-full mr-3 flex-shrink-0"></div>
                    Profile showcase
                  </li>
                </ul>
              </div>
            </div>

            <div className="group h-full">
              <div className="bg-gray-50 p-6 md:p-8 rounded-xl hover:bg-gray-100 transition-all duration-300 h-full flex flex-col">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0BC0DF] rounded-lg flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto md:mx-0">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-black mb-3 md:mb-4 text-center md:text-left">Job Board</h3>
                <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed text-center md:text-left flex-grow">Discover opportunities across 100+ domains. Advanced filters to find the perfect role.</p>
                
                <ul className="space-y-2 md:space-y-3 mt-auto">
                  <li className="flex items-center text-gray-600 text-sm md:text-base">
                    <div className="w-2 h-2 bg-[#0BC0DF] rounded-full mr-3 flex-shrink-0"></div>
                    Jobs & Internships
                  </li>
                  <li className="flex items-center text-gray-600 text-sm md:text-base">
                    <div className="w-2 h-2 bg-[#0BC0DF] rounded-full mr-3 flex-shrink-0"></div>
                    Company verification
                  </li>
                  <li className="flex items-center text-gray-600 text-sm md:text-base">
                    <div className="w-2 h-2 bg-[#0BC0DF] rounded-full mr-3 flex-shrink-0"></div>
                    Application tracking
                  </li>
                </ul>
              </div>
            </div>

            <div className="group h-full md:col-span-2 lg:col-span-1">
              <div className="bg-gray-50 p-6 md:p-8 rounded-xl hover:bg-gray-100 transition-all duration-300 h-full flex flex-col">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0BC0DF] rounded-lg flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto md:mx-0">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-black mb-3 md:mb-4 text-center md:text-left">Messaging & Network</h3>
                <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed text-center md:text-left flex-grow">Connect with professionals. Send requests, manage connections, and stay in touch.</p>
                
                <ul className="space-y-2 md:space-y-3 mt-auto">
                  <li className="flex items-center text-gray-600 text-sm md:text-base">
                    <div className="w-2 h-2 bg-[#0BC0DF] rounded-full mr-3 flex-shrink-0"></div>
                    Direct messaging
                  </li>
                  <li className="flex items-center text-gray-600 text-sm md:text-base">
                    <div className="w-2 h-2 bg-[#0BC0DF] rounded-full mr-3 flex-shrink-0"></div>
                    Connection requests
                  </li>
                  <li className="flex items-center text-gray-600 text-sm md:text-base">
                    <div className="w-2 h-2 bg-[#0BC0DF] rounded-full mr-3 flex-shrink-0"></div>
                    Notifications
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Features Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-3 md:mb-4">More Features</h2>
            <p className="text-lg md:text-xl text-gray-600 px-4">
              Exciting new capabilities coming your way
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 md:p-8 rounded-xl border-2 border-dashed border-gray-300 text-center hover:border-[#0BC0DF] transition-colors duration-300">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full mx-auto mb-4 md:mb-6 flex items-center justify-center">
                <div className="text-3xl md:text-4xl">🚀</div>
              </div>
              <div className="inline-block bg-[#0BC0DF] text-white px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-full mb-3 md:mb-4">
                REVEAL SOON
              </div>
              <p className="text-gray-600 font-medium text-sm md:text-base">Something amazing is in the works</p>
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-xl border-2 border-dashed border-gray-300 text-center hover:border-[#0BC0DF] transition-colors duration-300">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full mx-auto mb-4 md:mb-6 flex items-center justify-center">
                <div className="text-3xl md:text-4xl">⚡</div>
              </div>
              <div className="inline-block bg-[#0BC0DF] text-white px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-full mb-3 md:mb-4">
                REVEAL SOON
              </div>
              <p className="text-gray-600 font-medium text-sm md:text-base">Innovation meets excellence</p>
            </div>
          </div>

          <div className="text-center mt-8 md:mt-12">
            <div className="inline-flex items-center space-x-2 bg-white px-4 py-3 md:px-6 md:py-3 rounded-full shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-[#0BC0DF] rounded-full flex-shrink-0"></div>
              <span className="text-gray-600 font-medium text-sm md:text-base">Stay tuned for updates</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}