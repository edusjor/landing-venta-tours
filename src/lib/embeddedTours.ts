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
  { id: 5, name: 'Gastronomico' },
  { id: 6, name: 'Bienestar' },
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
  {
    id: 104,
    title: 'Glaciares y Lagos del Sur',
    slug: 'glaciares-lagos-del-sur',
    description: 'Expedicion por lagos glaciares, miradores panoramicos y navegacion en embarcacion turistica.',
    price: 549,
    minPeople: 1,
    images: [
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80',
    ],
    status: 'ACTIVO',
    isDeleted: false,
    country: 'Argentina',
    zone: 'Patagonia',
    durationDays: 4,
    activityType: 'Expedicion',
    difficulty: 'Moderado',
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
        useCustomTimes: false,
        customTimesText: '',
      },
      dateSchedules: {},
    },
    availability: [
      { id: 5201, date: '2026-06-06T00:00:00.000Z', maxPeople: 10, timeSlots: ['07:30'] },
      { id: 5202, date: '2026-06-18T00:00:00.000Z', maxPeople: 12, timeSlots: ['08:00'] },
      { id: 5203, date: '2026-07-03T00:00:00.000Z', maxPeople: 12, timeSlots: ['08:00'] },
    ],
    tourPackages: [
      {
        id: 'patagonia-main',
        title: 'Paquete Patagonia',
        description: 'Incluye navegacion y alojamiento.',
        priceOptions: [
          { id: 'adulto-pat', name: 'Adulto', price: 549, isFree: false, isBase: true },
          { id: 'nino-pat', name: 'Nino', price: 429, isFree: false },
        ],
      },
    ],
    includedItems: ['Traslados', '3 noches de hotel', 'Navegacion', 'Guia local', 'Desayunos'],
    recommendations: ['Abrigo impermeable', 'Calzado trekking', 'Documento de identidad'],
    faqs: [{ question: 'Hay opcion privada?', answer: 'Si, bajo solicitud y segun disponibilidad.' }],
  },
  {
    id: 105,
    title: 'Desierto y Noche de Estrellas',
    slug: 'desierto-estrellas',
    description: 'Tour por dunas, lagunas altiplanicas y observacion astronomica con guia experto.',
    price: 399,
    minPeople: 1,
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=80',
    ],
    status: 'ACTIVO',
    isDeleted: false,
    country: 'Chile',
    zone: 'Atacama',
    durationDays: 3,
    activityType: 'Aventura',
    difficulty: 'Intermedio',
    featured: false,
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
      { id: 5301, date: '2026-06-09T00:00:00.000Z', maxPeople: 8, timeSlots: ['07:00'] },
      { id: 5302, date: '2026-06-25T00:00:00.000Z', maxPeople: 10, timeSlots: ['07:30'] },
      { id: 5303, date: '2026-07-09T00:00:00.000Z', maxPeople: 10, timeSlots: ['07:30'] },
    ],
    tourPackages: [
      {
        id: 'desierto-std',
        title: 'Aventura Estelar',
        description: 'Paquete de 3 dias con observacion astronomica.',
        priceOptions: [
          { id: 'adulto-des', name: 'Adulto', price: 399, isFree: false, isBase: true },
          { id: 'junior-des', name: 'Junior', price: 319, isFree: false },
        ],
      },
    ],
    includedItems: ['2 noches', 'Traslados', 'Guia astronomico', 'Snacks', 'Seguro basico'],
    recommendations: ['Chaqueta para noche fria', 'Gafas de sol', 'Botella reutilizable'],
    faqs: [{ question: 'Se necesita experiencia previa?', answer: 'No, es apto para principiantes.' }],
  },
  {
    id: 106,
    title: 'Caribe Islas y Colores',
    slug: 'caribe-islas-colores',
    description: 'Escape al Caribe con lancha rapida, playa privada y actividades acuaticas para grupos.',
    price: 279,
    minPeople: 1,
    images: [
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80',
    ],
    status: 'ACTIVO',
    isDeleted: false,
    country: 'Colombia',
    zone: 'Cartagena',
    durationDays: 2,
    activityType: 'Playa',
    difficulty: 'Facil',
    featured: true,
    category: { id: 3, name: 'Playa' },
    agency: { slug: 'demo-agency', name: 'Demo Agency Tours' },
    availabilityConfig: {
      mode: 'OPEN',
      openSchedule: {
        maxPeople: 24,
        startTime: '08:00',
        endTime: '16:00',
        intervalMinutes: 120,
        useCustomTimes: false,
        customTimesText: '',
      },
      dateSchedules: {},
    },
    availability: [],
    tourPackages: [
      {
        id: 'caribe-day',
        title: 'Caribe Day Experience',
        description: 'Plan completo de playa y navegacion.',
        priceOptions: [
          { id: 'adulto-car', name: 'Adulto', price: 279, isFree: false, isBase: true },
          { id: 'nino-car', name: 'Nino', price: 199, isFree: false },
        ],
      },
    ],
    includedItems: ['Lancha rapida', 'Almuerzo', 'Kit de playa', 'Asistencia en destino'],
    recommendations: ['Ropa ligera', 'Sombrero', 'Protector solar'],
    faqs: [{ question: 'Incluye equipo de snorkel?', answer: 'Si, para quienes elijan esa actividad.' }],
  },
  {
    id: 107,
    title: 'Pueblos Magicos Ruta Andina',
    slug: 'pueblos-magicos-ruta-andina',
    description: 'Recorrido por mercados artesanales, plazas historicas y talleres locales con guia cultural.',
    price: 215,
    minPeople: 1,
    images: [
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1800&q=80',
    ],
    status: 'ACTIVO',
    isDeleted: false,
    country: 'Ecuador',
    zone: 'Sierra Norte',
    durationDays: 3,
    activityType: 'Cultural',
    difficulty: 'Facil',
    featured: false,
    category: { id: 4, name: 'Cultural' },
    agency: { slug: 'demo-agency', name: 'Demo Agency Tours' },
    availabilityConfig: {
      mode: 'SPECIFIC',
      openSchedule: {
        maxPeople: 16,
        startTime: '08:00',
        endTime: '17:00',
        intervalMinutes: 60,
        useCustomTimes: false,
        customTimesText: '',
      },
      dateSchedules: {},
    },
    availability: [
      { id: 5401, date: '2026-06-11T00:00:00.000Z', maxPeople: 12, timeSlots: ['08:00'] },
      { id: 5402, date: '2026-06-22T00:00:00.000Z', maxPeople: 16, timeSlots: ['08:30'] },
      { id: 5403, date: '2026-07-05T00:00:00.000Z', maxPeople: 16, timeSlots: ['08:30'] },
    ],
    tourPackages: [
      {
        id: 'andina-std',
        title: 'Ruta Cultural',
        description: 'Version clasica de 3 dias.',
        priceOptions: [
          { id: 'adulto-and', name: 'Adulto', price: 215, isFree: false, isBase: true },
          { id: 'estudiante-and', name: 'Estudiante', price: 179, isFree: false },
        ],
      },
    ],
    includedItems: ['Transporte interno', '2 noches', 'Guia bilingue', 'Entradas culturales'],
    recommendations: ['Camara', 'Calzado comodo', 'Abrigo ligero'],
    faqs: [{ question: 'Incluye comidas?', answer: 'Incluye desayunos y una degustacion local.' }],
  },
  {
    id: 108,
    title: 'Safari Fotografico de Humedales',
    slug: 'safari-fotografico-humedales',
    description: 'Experiencia de fauna y fotografia con salidas al amanecer y guias de avistamiento.',
    price: 620,
    minPeople: 1,
    images: [
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1800&q=80',
    ],
    status: 'ACTIVO',
    isDeleted: false,
    country: 'Brasil',
    zone: 'Pantanal',
    durationDays: 4,
    activityType: 'Naturaleza',
    difficulty: 'Intermedio',
    featured: false,
    category: { id: 1, name: 'Naturaleza' },
    agency: { slug: 'demo-agency', name: 'Demo Agency Tours' },
    availabilityConfig: {
      mode: 'SPECIFIC',
      openSchedule: {
        maxPeople: 10,
        startTime: '05:30',
        endTime: '18:00',
        intervalMinutes: 60,
        useCustomTimes: true,
        customTimesText: '05:30, 15:30',
      },
      dateSchedules: {},
    },
    availability: [
      { id: 5501, date: '2026-06-15T00:00:00.000Z', maxPeople: 8, timeSlots: ['05:30'] },
      { id: 5502, date: '2026-07-01T00:00:00.000Z', maxPeople: 10, timeSlots: ['05:30'] },
      { id: 5503, date: '2026-07-18T00:00:00.000Z', maxPeople: 10, timeSlots: ['05:30'] },
    ],
    tourPackages: [
      {
        id: 'safari-pro',
        title: 'Safari Pro',
        description: 'Enfocado en observacion y fotografia.',
        priceOptions: [
          { id: 'adulto-saf', name: 'Adulto', price: 620, isFree: false, isBase: true },
          { id: 'pro-saf', name: 'Con mentor fotografico', price: 740, isFree: false },
        ],
      },
    ],
    includedItems: ['3 noches lodge', 'Salidas guiadas', 'Paseo en bote', 'Desayunos y cenas'],
    recommendations: ['Teleobjetivo', 'Repelente', 'Ropa neutra'],
    faqs: [{ question: 'Se presta equipo?', answer: 'No, recomendamos llevar equipo propio.' }],
  },
  {
    id: 109,
    title: 'Escapada de Bienestar en Montana',
    slug: 'escapada-bienestar-montana',
    description: 'Plan relax con sendero suave, sesion de spa y gastronomia local en un entorno premium.',
    price: 265,
    minPeople: 1,
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80',
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1800&q=80',
    ],
    status: 'ACTIVO',
    isDeleted: false,
    country: 'Mexico',
    zone: 'Valle de Bravo',
    durationDays: 2,
    activityType: 'Bienestar',
    difficulty: 'Facil',
    featured: true,
    category: { id: 6, name: 'Bienestar' },
    agency: { slug: 'demo-agency', name: 'Demo Agency Tours' },
    availabilityConfig: {
      mode: 'OPEN',
      openSchedule: {
        maxPeople: 14,
        startTime: '09:00',
        endTime: '18:00',
        intervalMinutes: 120,
        useCustomTimes: false,
        customTimesText: '',
      },
      dateSchedules: {},
    },
    availability: [],
    tourPackages: [
      {
        id: 'wellness-classic',
        title: 'Wellness Classic',
        description: 'Escapada de 2 dias.',
        priceOptions: [
          { id: 'adulto-wel', name: 'Adulto', price: 265, isFree: false, isBase: true },
        ],
      },
      {
        id: 'wellness-plus',
        title: 'Wellness Plus',
        description: 'Incluye ritual completo de spa.',
        priceOptions: [
          { id: 'adulto-wel-plus', name: 'Adulto Plus', price: 329, isFree: false, isBase: true },
        ],
      },
    ],
    includedItems: ['1 noche boutique', 'Sesion spa', 'Cena de autor', 'Late checkout'],
    recommendations: ['Ropa comoda', 'Traje de bano', 'Bloqueador solar'],
    faqs: [{ question: 'Es apto para parejas?', answer: 'Si, es uno de los formatos mas solicitados para parejas.' }],
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
