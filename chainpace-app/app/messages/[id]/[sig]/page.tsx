"use client";

import { useParams } from "next/navigation";
import MessagesView from "@/components/MessagesView";

export default function SignedThreadPage() {
  const params = useParams<{ id: string; sig: string }>();
  return <MessagesView signedId={params.id} signedSig={params.sig} />;
}
