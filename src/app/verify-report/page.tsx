import { Suspense } from "react";
import { AppShell, LoadingState, Screen } from "@/components/ui";
import { VerifyReportContent } from "./VerifyReportContent";

// The magic link from the verification email lands here as:
//   {PUBLIC_APP_URL}/verify-report?token=...
// This route must exist under exactly this path (set by the backend).
export default function VerifyReportPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <Screen>
            <LoadingState label="Wczytywanie…" />
          </Screen>
        </AppShell>
      }
    >
      <VerifyReportContent />
    </Suspense>
  );
}
