import type { Metadata } from "next";
import LegalDocumentEmbed, { buildLegalMetadata } from "../../components/LegalDocumentEmbed";

const SOURCE_URL = String(process.env.LEGAL_TERMS_URL ?? "").trim()
  || `${String(process.env.LEGAL_SOURCE_BASE_URL ?? "https://example.com").trim().replace(/\/+$/, "")}/es/conditions/all-general/`;

export const metadata: Metadata = buildLegalMetadata({
  title: "Términos y condiciones generales",
  sourceUrl: SOURCE_URL,
});

export default function TerminosCondicionesPage() {
  return (
    <LegalDocumentEmbed
      title="Términos y condiciones generales"
      sourceUrl={SOURCE_URL}
      type="general"
      description="Contenido oficial de términos y condiciones generales publicado por esta agencia."
    />
  );
}
