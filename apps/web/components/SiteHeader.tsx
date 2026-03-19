import Link from "next/link";

const nav = [
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/petitions", label: "Petitions" },
  { href: "/gallery", label: "Gallery" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-800 bg-elevated/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight text-white no-underline">
          Hayling Bike Night
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-x-6 gap-y-2 text-sm uppercase tracking-wide">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-zinc-300 no-underline hover:text-accent">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
