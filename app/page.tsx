import Map from "./map-client";

export default function Home() {
  return (
    <main className="sea-radar">
      <div className="map-panel">
        <Map />
        <p className="source-label">Демонстрационные данные</p>
      </div>
    </main>
  );
}
