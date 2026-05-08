import type { Metadata } from "next";
import LegalDocumentEmbed, { buildLegalMetadata } from "../../components/LegalDocumentEmbed";

const SOURCE_URL = String(process.env.LEGAL_PRIVACY_URL ?? "").trim()
  || `${String(process.env.LEGAL_SOURCE_BASE_URL ?? "https://example.com").trim().replace(/\/+$/, "")}/es/conditions/privacy-policy/`;

export const metadata: Metadata = buildLegalMetadata({
  title: "Política de privacidad",
  sourceUrl: SOURCE_URL,
});

export default function PoliticaPrivacidadPage() {
  return (
    <LegalDocumentEmbed
      title="Política de privacidad"
      sourceUrl={SOURCE_URL}
      type="privacy"
      description="Contenido oficial de la política de privacidad publicada por esta agencia."
    />
  );
}
