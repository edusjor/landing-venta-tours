This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# tours-sys" 

## Deploy En VPS Con Docker

### 1) Requisitos
- Docker y Docker Compose instalados en el VPS.
- Archivo `.env` con variables de produccion.

### 2) Configurar Base De Datos Externa
- Usa tu `DATABASE_URL` de Neon/RDS/etc en `.env`.
- El archivo `docker-compose.vps.yml` esta preparado para DB externa (no levanta Postgres local).

### 3) Levantar Servicios

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

La app queda publicada en `http://TU_IP:9342`.

### 4) Comandos Utiles

```bash
docker compose -f docker-compose.vps.yml logs -f app
docker compose -f docker-compose.vps.yml restart app
docker compose -f docker-compose.vps.yml down
```

### 5) Notas Importantes
- `docker/entrypoint.sh` ejecuta por defecto:
	- `prisma generate`
	- `prisma migrate deploy`
- `RUN_DB_PUSH` esta en `false` por defecto para evitar cambios no controlados en produccion.
- `uploads` se monta como volumen bind (`./uploads:/app/uploads`) para conservar archivos entre despliegues.

## Base Multiagencia

- La base ahora incluye `Agency`, `AgencyDomain`, `User` por agencia, `MediaAsset` por agencia y relaciones `agencyId` en categorías, tours y reservas.
- El storefront público ahora puede resolverse por `Host` usando `AgencyDomain.host`, con soporte para subdominios internos del sistema.
- Esa agencia se crea automáticamente con slug `default` durante la migración y puede personalizarse con `DEFAULT_AGENCY_SLUG` y `DEFAULT_AGENCY_NAME`.
- El helper backend de contexto autenticado está en `src/lib/adminContext.ts` y resuelve la agencia activa desde la sesión admin actual, con bootstrap automático del usuario legacy si aún no existe en base de datos.
- Existe un script idempotente para bootstrap inicial y backfill de media: `npm run db:seed:agency`.
- Define `PLATFORM_ROOT_DOMAIN` para generar subdominios internos en `AgencyDomain` con el formato `agencia.tu-dominio.com`.
- El middleware público excluye panel y framework, detecta host/subdominio y deja el contexto listo para páginas y APIs públicas.
- El runtime público ya no depende de una agencia implícita; si se desea fallback explícito por slug se puede usar `PUBLIC_FALLBACK_AGENCY_SLUG` o `DEFAULT_PUBLIC_AGENCY_SLUG`.
- El contexto admin intenta resolver agencia por host/sesión; como fallback explícito puede usarse `ADMIN_AGENCY_SLUG`.
- La configuración comercial de la agencia se administra desde `/admin/configuracion`.
- Después de actualizar el código, ejecuta las migraciones y luego el seed anterior para asociar los datos existentes, uploads históricos y subdominio inicial a la agencia base.
- `AgencyDomain` incluye estado de ciclo de vida para preparar dominios personalizados (`isActive`, `verificationStatus`, `tlsStatus`) sin requerir todavía DNS/SSL automáticos.

## Variables Opcionales Recomendadas

- `PUBLIC_FALLBACK_AGENCY_SLUG`: slug para fallback público controlado (sin asumir agencia única).
- `DEFAULT_PUBLIC_AGENCY_SLUG`: alias legacy del fallback público.
- `ADMIN_AGENCY_SLUG`: fallback explícito para login admin cuando no hay contexto por host.
- `PLATFORM_DEFAULT_AGENCY_NAME`, `PLATFORM_DEFAULT_AGENCY_DESCRIPTION`, `PLATFORM_DEFAULT_AGENCY_EMAIL`, `PLATFORM_DEFAULT_AGENCY_PHONE`, `PLATFORM_DEFAULT_AGENCY_WHATSAPP`: textos/contacto neutros cuando falta contexto de agencia.
- `PLATFORM_DEFAULT_SUPPORT_EMAIL`, `PLATFORM_DEFAULT_SUPPORT_PHONE`, `PLATFORM_DEFAULT_SUPPORT_WHATSAPP`, `PLATFORM_DEFAULT_SUPPORT_LOCATION`: fallback de soporte para correos de reserva.
- `LEGAL_SOURCE_BASE_URL`: base opcional para páginas legales.
- `LEGAL_AVISO_URL`, `LEGAL_TERMS_URL`, `LEGAL_PRIVACY_URL`, `LEGAL_COOKIES_URL`: URLs legales específicas por documento.
