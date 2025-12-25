import { Suspense } from "react";
import DailyClient from "./DailyClient";

export default function DailyPage() {
  return (
    <Suspense fallback={<div className="container-shell py-8">Loading…</div>}>
      <DailyClient />
    </Suspense>
  );
}
