import {
  DEFAULT_PUBLIC_PAYMENT_OPTIONS,
  PAYMENT_MODE_BOTH,
  type PublicAgencyPaymentOptions,
} from './paymentSettings';

type EmbeddedPriceOption = {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
  isBase?: boolean;
};

type EmbeddedTourPackage = {
  id: string;
  title: string;
  description: string;
  priceOptions: EmbeddedPriceOption[];
};

type EmbeddedAvailability = {
  id: number;
  date: string;
  maxPeople: number;
  timeSlots: string[];
};

type EmbeddedTour = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  minPeople: number;
  images: string[];
  status: 'ACTIVO' | 'NO_ACTIVO' | 'BORRADOR';
  isDeleted: boolean;
  country: string;
  zone: string;
  durationDays: number;
  activityType: string;
  difficulty: string;
  featured: boolean;
  category: { id: number; name: string };
  agency: { slug: string; name: string };
  availabilityConfig: {
    mode: 'SPECIFIC' | 'OPEN';
    openSchedule: {
      maxPeople: number;
      startTime: string;
      endTime: string;
      intervalMinutes: number;
      useCustomTimes: boolean;
      customTimesText: string;
    };
    dateSchedules: Record<string, string[]>;
  };
  availability: EmbeddedAvailability[];
  tourPackages: EmbeddedTourPackage[];
  includedItems: string[];
  recommendations: string[];
  faqs: Array<{ question: string; answer: string }>;
};

const EMBEDDED_PAYMENT_OPTIONS: PublicAgencyPaymentOptions = {
  ...DEFAULT_PUBLIC_PAYMENT_OPTIONS,
  paymentMode: PAYMENT_MODE_BOTH,
  allowsGateway: true,
  allowsManual: true,
  gatewayProvider: null,
  manualPaymentInstructions: 'Demo: envia comprobante o usa tarjeta de prueba.',
  bankAccountName: 'Demo Tours Agency',
  bankAccountNumber: '001-222-333',
  bankAccountIban: 'CR050015000100222333',
  sinpeMobile: '+506 7000-0000',
};

const EMBEDDED_CATEGORIES = [
  { id: 1, name: 'Naturaleza' },
  { id: 2, name: 'Aventura' },
  { id: 3, name: 'Playa' },
  { id: 4, name: 'Cultural' },
] as const;

const EMBEDDED_TOURS: EmbeddedTour[] = [
  {
    id: 101,
    title: 'Tour Catarata Escondida',
    slug: 'catarata-escondida',
    description: 'Caminata guiada por senderos de bosque y visita a catarata privada con tiempo para nadar.',
    price: 89,
    minPeople: 1,
    images: [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1800&q=80',
    ],
    status: 'ACTIVO',
    isDeleted: false,
    country: 'Costa Rica',
    zone: 'Arenal',
    durationDays: 1,
    activityType: 'Senderismo',
    difficulty: 'Facil',
    featured: true,
    category: { id: 1, name: 'Naturaleza' },
    agency: { slug: 'demo-agency', name: 'Demo Agency Tours' },
    availabilityConfig: {
      mode: 'SPECIFIC',
      openSchedule: {
        maxPeople: 12,
        startTime: '07:00',
        endTime: '16:00',
        intervalMinutes: 60,
        useCustomTimes: true,
        customTimesText: '08:00, 10:00, 13:00',
      },
      dateSchedules: {
        '2026-05-14': ['08:00', '10:00'],
        '2026-05-18': ['09:00', '14:00'],
      },
    },
    availability: [
      { id: 5001, date: '2026-05-14T00:00:00.000Z', maxPeople: 10, timeSlots: ['08:00', '10:00'] },
      { id: 5002, date: '2026-05-18T00:00:00.000Z', maxPeople: 8, timeSlots: ['09:00', '14:00'] },
      { id: 5003, date: '2026-05-23T00:00:00.000Z', maxPeople: 12, timeSlots: ['08:30', '12:30'] },
    ],
    tourPackages: [
      {
        id: 'cat-main',
        title: 'Paquete principal',
        description: 'Incluye transporte y almuerzo.',
        priceOptions: [
          { id: 'adulto', name: 'Adulto', price: 89, isFree: false, isBase: true },
          { id: 'nino', name: 'Nino', price: 59, isFree: false },
        ],
      },
    ],
    includedItems: ['Transporte', 'Guia local', 'Entrada', 'Almuerzo'],
    recommendations: ['Llevar ropa comoda', 'Bloqueador solar', 'Botella de agua'],
    faqs: [
      { question: 'Incluye transporte?', answer: 'Si, desde punto de salida definido en la reserva.' },
      { question: 'Hay descuento para ninos?', answer: 'Si, la opcion Nino aplica tarifa reducida.' },
    ],
  },
  {
    id: 102,
    title: 'Aventura Volcan + Termales',
    slug: 'aventura-volcan-termales',
    description: 'Ruta de aventura con caminata volcanica y cierre en aguas termales premium.',
    price: 249,
    minPeople: 1,
    images: [
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=80',
    ],
    status: 'ACTIVO',
    isDeleted: false,
    country: 'Costa Rica',
    zone: 'La Fortuna',
    durationDays: 2,
    activityType: 'Aventura',
    difficulty: 'Moderado',
    featured: true,
    category: { id: 2, name: 'Aventura' },
    agency: { slug: 'demo-agency', name: 'Demo Agency Tours' },
    availabilityConfig: {
      mode: 'SPECIFIC',
      openSchedule: {
        maxPeople: 10,
        startTime: '07:00',
        endTime: '17:00',
        intervalMinutes: 60,
        useCustomTimes: false,
        customTimesText: '',
      },
      dateSchedules: {},
    },
    availability: [
      { id: 5101, date: '2026-05-16T00:00:00.000Z', maxPeople: 6, timeSlots: ['07:30'] },
      { id: 5102, date: '2026-05-24T00:00:00.000Z', maxPeople: 10, timeSlots: ['08:00'] },
      { id: 5103, date: '2026-06-02T00:00:00.000Z', maxPeople: 10, timeSlots: ['08:00'] },
    ],
    tourPackages: [
      {
        id: 'std',
        title: 'Estandar',
        description: 'Incluye transporte y acceso termales.',
        priceOptions: [{ id: 'adulto-std', name: 'Adulto', price: 249, isFree: false, isBase: true }],
      },
      {
        id: 'vip',
        title: 'VIP',
        description: 'Incluye hotel boutique y cena.',
        priceOptions: [{ id: 'adulto-vip', name: 'Adulto VIP', price: 329, isFree: false, isBase: true }],
      },
    ],
    includedItems: ['Transporte', 'Guia', 'Entrada termales'],
    recommendations: ['Chaqueta liviana', 'Ropa de cambio'],
    faqs: [{ question: 'Incluye hospedaje?', answer: 'Solo en la version VIP.' }],
  },
  {
    id: 103,
    title: 'Isla Paraiso en Catamaran',
    slug: 'isla-paraiso-catamaran',
    description: 'Navegacion en catamaran con snorkel y bebidas frente a una isla paradisiaca.',
    price: 139,
    minPeople: 1,
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1800&q=80',
    ],
    status: 'ACTIVO',
    isDeleted: false,
    country: 'Costa Rica',
    zone: 'Pacifico Norte',
    durationDays: 1,
    activityType: 'Nautico',
    difficulty: 'Facil',
    featured: true,
    category: { id: 3, name: 'Playa' },
    agency: { slug: 'demo-agency', name: 'Demo Agency Tours' },
    availabilityConfig: {
      mode: 'OPEN',
      openSchedule: {
        maxPeople: 20,
        startTime: '08:00',
        endTime: '15:00',
        intervalMinutes: 120,
        useCustomTimes: false,
        customTimesText: '',
      },
      dateSchedules: {},
    },
    availability: [],
    tourPackages: [
      {
        id: 'cat-day',
        title: 'Day Pass',
        description: 'Pase completo para todo el dia.',
        priceOptions: [
          { id: 'adulto-day', name: 'Adulto', price: 139, isFree: false, isBase: true },
          { id: 'nino-day', name: 'Nino', price: 99, isFree: false },
        ],
      },
    ],
    includedItems: ['Catamaran', 'Snorkel', 'Snacks', 'Bebidas'],
    recommendations: ['Llevar traje de bano', 'Toalla', 'Protector solar'],
    faqs: [{ question: 'Es apto para ninos?', answer: 'Si, con supervision de adultos.' }],
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isEmbeddedToursModeEnabled(): boolean {
  const forceMode = String(process.env.NEXT_PUBLIC_EMBEDDED_TOURS_MODE ?? '').trim().toLowerCase();
  if (forceMode === '1' || forceMode === 'true' || forceMode === 'yes') return true;
  return !String(process.env.DATABASE_URL ?? '').trim();
}

export function getEmbeddedCategories() {
  return clone(EMBEDDED_CATEGORIES);
}

export function getEmbeddedTours() {
  return clone(EMBEDDED_TOURS);
}

export function getEmbeddedTourByIdOrSlug(input: { id?: number; slug?: string }) {
  const slug = String(input.slug ?? '').trim().toLowerCase();
  const id = Number(input.id);

  const found = EMBEDDED_TOURS.find((tour) => {
    if (slug) return tour.slug === slug;
    if (Number.isFinite(id) && id > 0) return tour.id === id;
    return false;
  });

  if (!found) return null;
  return clone(found);
}

export function getEmbeddedAvailabilityByTourId(tourId: number) {
  const found = EMBEDDED_TOURS.find((tour) => tour.id === tourId);
  return clone(found?.availability ?? []);
}

export function getEmbeddedPublicPaymentOptions(): PublicAgencyPaymentOptions {
  return clone(EMBEDDED_PAYMENT_OPTIONS);
}
