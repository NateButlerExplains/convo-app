import type { MoveMapData } from "../types/move-map";
import { MoveCountdown } from "../components/MoveCountdown";

const photos = [
  { city: "Barcelona", title: "Sagrada Família", src: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=80" },
  { city: "Barcelona", title: "Park Güell", src: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1200&q=80" },
  { city: "Barcelona", title: "Mediterranean coast", src: "https://images.unsplash.com/photo-1464790719320-516ecd75af6c?auto=format&fit=crop&w=1200&q=80" },
  { city: "Barcelona", title: "City rooftops", src: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=1200&q=80" },
  { city: "Madrid", title: "City avenues", src: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80" },
  { city: "Madrid", title: "Historic center", src: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80" },
  { city: "Madrid", title: "Golden hour streets", src: "https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&w=1200&q=80" },
  { city: "Barcelona", title: "Modernisme details", src: "https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?auto=format&fit=crop&w=1200&q=80" },
  { city: "Madrid", title: "Evening glow", src: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=1200&q=80" },
  { city: "Barcelona", title: "Harbor light", src: "https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&w=1100&q=75" },
  { city: "Madrid", title: "Plaza energy", src: "https://images.unsplash.com/photo-1464790719320-516ecd75af6c?auto=format&fit=crop&w=1100&q=75" },
  { city: "Barcelona", title: "Old town alleys", src: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80" },
  { city: "Madrid", title: "Architecture lines", src: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1100&q=75" },
  { city: "Barcelona", title: "Seafront walk", src: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=1100&q=75" },
  { city: "Madrid", title: "Cafe terraces", src: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=1100&q=75" },
];

export function BigTripView({ data }: { data: MoveMapData }) {
  const destination = `${data.plan.destination} - ${data.plan.target_move_date || "2027-01"}`;

  return (
    <div className="view big-trip-view">
      <section className="big-trip-stage" aria-label="Spain collage with move countdown">
        <div className="big-trip-collage">
          {photos.map((photo, index) => (
            <figure key={`${photo.city}-${photo.title}-${index}`} className={`big-trip-tile tile-${index + 1}`}>
              <img src={photo.src} alt={`${photo.title} in ${photo.city}`} loading={index < 6 ? "eager" : "lazy"} />
              <figcaption>
                <strong>{photo.title}</strong>
                <span>{photo.city}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="big-trip-countdown-overlay">
          <MoveCountdown destinationLabel={destination} className="big-trip-countdown" />
        </div>
      </section>
    </div>
  );
}
