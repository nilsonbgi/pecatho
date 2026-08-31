type Props = { latitude: number | null; longitude: number | null; label?: string };

export default function ApproximateLocationMap({ latitude, longitude, label = "Localização aproximada" }: Props) {
  if (latitude == null || longitude == null) {
    return <div className="mapPlaceholder"><strong>Mapa indisponível</strong><span>A localização deste anúncio ainda não foi geocodificada.</span></div>;
  }
  const delta = 0.035;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
  return <div className="mapCard"><div className="mapHeader"><div><strong>{label}</strong><span>O ponto exibido é aproximado para preservar a privacidade.</span></div><a href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`} target="_blank" rel="noreferrer">Abrir mapa</a></div><iframe title={label} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="mapFrame" /></div>;
}
