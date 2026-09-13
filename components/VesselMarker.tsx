import L from "leaflet";
import type { Vessel } from "../types/vessel";

export function createVesselIcon(vessel: Vessel): L.DivIcon {
  const iconType = vessel.courseDeg === null ? "neutral" : "course";
  const rotation = vessel.courseDeg === null ? "" : ` transform: rotate(${vessel.courseDeg}deg);`;
  const shape = vessel.courseDeg === null ? "neutral-vessel-icon" : "vessel-icon";

  return L.divIcon({
    className: "vessel-marker",
    html: `<span data-vessel-id="${vessel.id}" data-icon="${iconType}" class="${shape}" style="${rotation}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}
