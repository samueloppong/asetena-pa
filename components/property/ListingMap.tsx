interface ListingMapProps {
  latitude: number;
  longitude: number;
  label: string;
  verified?: boolean;
}

function formatCoord(value: number, digits = 6): string {
  return value.toFixed(digits);
}

export function ListingMap({
  latitude,
  longitude,
  label,
  verified = false,
}: ListingMapProps) {
  const delta = 0.012;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
  const googleLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const latText = formatCoord(latitude);
  const lngText = formatCoord(longitude);
  const coordPair = `${latText}, ${lngText}`;

  return (
    <section id="where" className="scroll-mt-24 space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-brand">Where it is</h2>
        <p className="text-sm text-muted-foreground">
          GPS pin from the listing{verified ? " (verified on-site)" : ""}. Open
          the coordinates in a maps app to check the exact spot.
        </p>
      </div>

      <div className="space-y-2 border border-border bg-white px-4 py-3 [border-radius:unset]">
        <p className="text-[10px] font-bold tracking-[0.14em] text-gold-ink uppercase">
          GPS coordinates
        </p>
        <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
          {coordPair}
        </p>
        <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <dt className="font-medium text-foreground/70">Latitude</dt>
            <dd className="font-mono text-foreground">{latText}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground/70">Longitude</dt>
            <dd className="font-mono text-foreground">{lngText}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
          <a
            href={googleLink}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            Open in Google Maps
          </a>
          <a
            href={osmLink}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            Open in OpenStreetMap
          </a>
        </div>
      </div>

      <iframe
        title={`Map of ${label}`}
        src={src}
        className="h-56 w-full rounded-2xl border border-border"
      />
    </section>
  );
}
