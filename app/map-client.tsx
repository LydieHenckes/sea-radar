"use client";

import dynamic from "next/dynamic";
import type { Dispatch, SetStateAction } from "react";
import type { Vessel } from "../types/vessel";

const ClientMap = dynamic(() => import("./map"), { ssr: false });

type MapClientProps = {
  onSelectVessel: Dispatch<SetStateAction<Vessel | null>>;
};

export default function MapClient({ onSelectVessel }: MapClientProps) {
  return <ClientMap onSelectVessel={onSelectVessel} />;
}
