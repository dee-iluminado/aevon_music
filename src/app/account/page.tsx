import type { Metadata } from "next";
import { AccountClient } from "@/components/account-client";

export const metadata: Metadata = {
  title: "Your account",
  description: "Your local AEVON Music account and listening stats.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountClient />;
}
