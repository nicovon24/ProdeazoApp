"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TournamentInitializer } from "@/components/TournamentInitializer";
import { pageTransition } from "@/lib/animations";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, fetchMe } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    fetchMe().finally(() => setAuthReady(true));
  }, [fetchMe]);

  useEffect(() => {
    if (authReady && !loading && !user) {
      router.replace("/login");
    }
  }, [authReady, loading, user, router]);

  if (!authReady || loading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <TournamentInitializer />
      <Sidebar />
      <div className="main-content" style={{ display: "flex", flexDirection: "column" }}>
        <motion.div
          key={pathname}
          variants={pageTransition}
          initial="hidden"
          animate="visible"
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}
