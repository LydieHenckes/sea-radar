import type { Vessel } from "../types/vessel";

function formatValue(value: string | number | null): string {
  return value === null ? "Нет данных" : String(value);
}

function formatSpeed(speedKnots: number | null): string {
  if (speedKnots === null) {
    return "Нет данных";
  }

  return `${Number(speedKnots.toFixed(1))} уз`;
}

function formatCourse(courseDeg: number | null): string {
  if (courseDeg === null) {
    return "Нет данных";
  }

  return `${Math.round(courseDeg) % 360}°`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Нет данных";
  }

  return `${date.toISOString().slice(11, 19)} UTC`;
}

function formatSource(source: Vessel["source"]): string {
  return source === "demo" ? "Демонстрационные данные" : "AISStream";
}

export function VesselCard({ vessel }: { vessel: Vessel }) {
  return (
    <article className="vessel-card" aria-label={`Судно ${vessel.id}`}>
      <h2>Судно</h2>
      <dl>
        <div>
          <dt>Идентификатор</dt>
          <dd>{vessel.id}</dd>
        </div>
        <div>
          <dt>Название</dt>
          <dd>{formatValue(vessel.name)}</dd>
        </div>
        <div>
          <dt>Координаты</dt>
          <dd>{`${vessel.lat.toFixed(5)}, ${vessel.lon.toFixed(5)}`}</dd>
        </div>
        <div>
          <dt>Скорость</dt>
          <dd>{formatSpeed(vessel.speedKnots)}</dd>
        </div>
        <div>
          <dt>Курс</dt>
          <dd>{formatCourse(vessel.courseDeg)}</dd>
        </div>
        <div>
          <dt>Время</dt>
          <dd>{formatTimestamp(vessel.timestamp)}</dd>
        </div>
        <div>
          <dt>Источник</dt>
          <dd>{formatSource(vessel.source)}</dd>
        </div>
      </dl>
    </article>
  );
}
