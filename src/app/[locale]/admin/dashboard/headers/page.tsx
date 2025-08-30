"use client";

import { HeaderContainer } from "@/domains/header";
import { useEffect } from "react";

export default function HeadersPage() {
  useEffect(() => {
    console.log("🔍 HeadersPage: Component mounted");
    return () => {
      console.log("🔍 HeadersPage: Component unmounted");
    };
  }, []);

  return <HeaderContainer />;
}
