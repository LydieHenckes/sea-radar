"use client";

import dynamic from "next/dynamic";

const ClientMap = dynamic(() => import("./map"), { ssr: false });

export default function MapClient() {
  return <ClientMap />;
}
