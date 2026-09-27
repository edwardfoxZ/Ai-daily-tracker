"use client";

import MessagesView from "@/components/MessagesView";

export default function MessagesPage() {
  return (
    <div className="relative flex min-h-screen flex-col gap-5 bg-background px-5 py-10 dark:bg-background-dark">
      <MessagesView />
    </div>
  );
}
