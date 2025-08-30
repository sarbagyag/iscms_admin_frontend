"use client";

import { NavigationContainer } from "@/domains/navigation";
import { useEffect } from "react";

export default function NavigationPage() {
  useEffect(() => {
    console.log("🔍 NavigationPage: Component mounted");
    return () => {
      console.log("🔍 NavigationPage: Component unmounted");
    };
  }, []);

  return <NavigationContainer />;
}
