import type { ReactNode } from "react";
import { RecruiterLayoutWrapper } from "@/modules/recruiter";
import RecruiterAuthGuard from "@/components/auth/RecruiterAuthGuard";

export default function TransactionHistoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RecruiterAuthGuard>
      <RecruiterLayoutWrapper>{children}</RecruiterLayoutWrapper>
    </RecruiterAuthGuard>
  );
}
