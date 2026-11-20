interface ListingMapProps {
  latitude: number;
  longitude: number;
  label: string;
}

export function ListingMap({ latitude, longitude, label }: ListingMapProps) {
  const delta = 0.012;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const link = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <section id="where" className="scroll-mt-24 space-y-2">
      <h2 className="text-base font-bold text-brand">Where it is</h2>
      <iframe
        title={`Map of ${label}`}
        src={src}
        className="h-56 w-full rounded-2xl border border-border"
      />
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-medium text-primary"
      >
        Open in OpenStreetMap
      </a>
    </section>
  );
}
