export type DemoTour = {
  id: number;
  slug: string;
  title: string;
  category: string;
  country: string;
  zone: string;
  durationDays: number;
  difficulty: "Facil" | "Moderado" | "Intermedio";
  featured: boolean;
  priceFrom: number;
  image: string;
  description: string;
  includes: string[];
  dates: string[];
};

export const DEMO_TOURS: DemoTour[] = [
  {
    id: 1,
    slug: "catarata-escondida",
    title: "Tour Catarata Escondida",
    category: "Naturaleza",
    country: "Costa Rica",
    zone: "Arenal",
    durationDays: 1,
    difficulty: "Facil",
    featured: true,
    priceFrom: 89,
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    description: "Caminata guiada a una catarata privada con tiempo para nadar y almuerzo tipico.",
    includes: ["Transporte", "Guia local", "Entrada", "Almuerzo"],
    dates: ["2026-05-14", "2026-05-18", "2026-05-23", "2026-05-29"],
  },
  {
    id: 2,
    slug: "volcan-termales",
    title: "Volcan + Aguas Termales",
    category: "Aventura",
    country: "Costa Rica",
    zone: "La Fortuna",
    durationDays: 2,
    difficulty: "Moderado",
    featured: true,
    priceFrom: 249,
    image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80",
    description: "Experiencia de volcan, senderismo y noche en hotel con termales.",
    includes: ["Hospedaje", "Desayuno", "Traslados", "Seguro basico"],
    dates: ["2026-05-16", "2026-05-24", "2026-06-02"],
  },
  {
    id: 3,
    slug: "isla-paraiso-catamaran",
    title: "Isla Paraiso en Catamaran",
    category: "Playa",
    country: "Costa Rica",
    zone: "Pacifico Norte",
    durationDays: 1,
    difficulty: "Facil",
    featured: false,
    priceFrom: 139,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    description: "Navegacion en catamaran con snorkel, snacks y bebidas frente a isla paradisiaca.",
    includes: ["Catamaran", "Snorkel", "Snacks", "Bebidas"],
    dates: ["2026-05-12", "2026-05-19", "2026-05-26", "2026-06-01"],
  },
  {
    id: 4,
    slug: "city-tour-cultural",
    title: "City Tour Cultural",
    category: "Cultural",
    country: "Peru",
    zone: "Cusco",
    durationDays: 1,
    difficulty: "Facil",
    featured: false,
    priceFrom: 75,
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80",
    description: "Recorrido por centros historicos, mercados locales y gastronomia regional.",
    includes: ["Guia bilingue", "Entradas", "Degustacion"],
    dates: ["2026-05-13", "2026-05-17", "2026-05-21", "2026-05-30"],
  },
  {
    id: 5,
    slug: "selva-aventura-4x4",
    title: "Selva Aventura 4x4",
    category: "Aventura",
    country: "Colombia",
    zone: "Amazonas",
    durationDays: 3,
    difficulty: "Intermedio",
    featured: true,
    priceFrom: 329,
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
    description: "Ruta 4x4 por selva con campamento premium y actividades de aventura.",
    includes: ["Transporte 4x4", "Equipo", "2 noches", "Guia experto"],
    dates: ["2026-05-22", "2026-06-05", "2026-06-14"],
  },
  {
    id: 6,
    slug: "ruta-vinedos",
    title: "Ruta de Vinedos y Sabores",
    category: "Gastronomico",
    country: "Chile",
    zone: "Valle Central",
    durationDays: 2,
    difficulty: "Facil",
    featured: false,
    priceFrom: 189,
    image: "https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?auto=format&fit=crop&w=1200&q=80",
    description: "Experiencia en vinedos boutique con catas y maridaje de cocina local.",
    includes: ["Transporte", "Cata", "Cena maridaje", "Hospedaje"],
    dates: ["2026-05-20", "2026-05-28", "2026-06-10"],
  },
];

export function getDemoTourBySlug(slug: string): DemoTour | null {
  const normalized = String(slug ?? "").trim().toLowerCase();
  if (!normalized) return null;
  return DEMO_TOURS.find((tour) => tour.slug === normalized) ?? null;
}
