import Image from "next/image";

export function TripGallery({ heroImage, gallery, title }: { heroImage: string; gallery: string[]; title: string }) {
  const thumbs = gallery.slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-3xl sm:grid-cols-[2fr_1fr] sm:gap-2">
      <div className="relative aspect-[4/3] sm:aspect-auto">
        <Image src={heroImage} alt={title} fill sizes="60vw" priority className="object-cover" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-rows-2">
        {thumbs.map((src, i) => (
          <div key={src} className="relative aspect-square sm:aspect-auto">
            <Image src={src} alt={`${title} photo ${i + 1}`} fill sizes="20vw" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
