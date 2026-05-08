import type { Metadata } from "next";
import LegalDocumentEmbed, { buildLegalMetadata } from "../../components/LegalDocumentEmbed";

const SOURCE_URL = String(process.env.LEGAL_COOKIES_URL ?? "").trim()
  || `${String(process.env.LEGAL_SOURCE_BASE_URL ?? "https://example.com").trim().replace(/\/+$/, "")}/es/conditions/cookies/`;

export const metadata: Metadata = buildLegalMetadata({
  title: "Información de cookies",
  sourceUrl: SOURCE_URL,
});

export default function InformacionCookiesPage() {
  return (
    <LegalDocumentEmbed
      title="Información de cookies"
      sourceUrl={SOURCE_URL}
      type="cookies"
      description="Contenido oficial de información de cookies publicado por esta agencia."
    />
  );
}
