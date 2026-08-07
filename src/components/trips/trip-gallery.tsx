import { SmartImage } from "@/components/ui/smart-image";

export function TripGallery({
  heroImage,
  gallery,
  title,
}: {
  heroImage: string;
  gallery: string[];
  title: string;
}) {
  const thumbs = gallery.slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-3xl sm:grid-cols-[2fr_1fr]">
      <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[26rem]">
        <SmartImage
          src={heroImage}
          alt={title}
          fill
          sizes="(min-width: 640px) 60vw, 100vw"
          priority
          className="object-cover"
          fallbackLabel={title}
        />
      </div>

      {thumbs.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-rows-2">
          {thumbs.map((src, index) => (
            <div key={`${src}-${index}`} className="relative aspect-square sm:aspect-auto">
              <SmartImage
                src={src}
                alt={`${title} — photo ${index + 1}`}
                fill
                sizes="(min-width: 640px) 20vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
