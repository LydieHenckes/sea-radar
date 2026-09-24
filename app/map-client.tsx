"use client";

import dynamic from "next/dynamic";
import type { Vessel } from "../types/vessel";

const ClientMap = dynamic(() => import("./map"), { ssr: false });

type MapClientProps = {
  vessels: readonly Vessel[];
  onSelectVessel: (id: string) => void;
  resetViewKey: number;
};

export default function MapClient({
  vessels,
  onSelectVessel,
  resetViewKey,
}: MapClientProps) {
  return (
    <ClientMap
      vessels={vessels}
      onSelectVessel={onSelectVessel}
      resetViewKey={resetViewKey}
    />
  );
}
