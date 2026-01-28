"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication status immediately without delay
    const checkAuth = () => {
      if (typeof window === "undefined") return;
      
      const token = localStorage.getItem("authToken");
      
      if (token) {
        // User is authenticated, redirect to feed
        router.replace("/feed");
      } else {
        // User is not authenticated, redirect to landing
        router.replace("/landing");
      }
    };

    // Check immediately
    checkAuth();
  }, [router]);

  // Show minimal loading to prevent flash
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-[#0BC0DF]"></div>
    </div>
  );
}