import type { Metadata } from "next";
import LegalDocumentEmbed, { buildLegalMetadata } from "../../components/LegalDocumentEmbed";

const SOURCE_URL = String(process.env.LEGAL_AVISO_URL ?? "").trim()
  || `${String(process.env.LEGAL_SOURCE_BASE_URL ?? "https://example.com").trim().replace(/\/+$/, "")}/es/conditions/legal/`;

export const metadata: Metadata = buildLegalMetadata({
  title: "Aviso legal",
  sourceUrl: SOURCE_URL,
});

export default function AvisoLegalPage() {
  return (
    <LegalDocumentEmbed
      title="Aviso legal"
      sourceUrl={SOURCE_URL}
      type="legal"
      description="Contenido oficial de aviso legal publicado por esta agencia."
    />
  );
}
