import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PANEL_REGISTRY } from '@/components/panels';
import { addressableDossiers, getAddressableDossier } from '@/lib/dossiers';

// Each dossier has a conventional, statically generated document page for
// sharing and indexing. The home experience can still open it as an overlay.
export function generateStaticParams() {
  return addressableDossiers.map((section) => ({ id: section.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dossier = getAddressableDossier(id);
  if (!dossier) return {};

  const path = `/dossiers/${dossier.id}`;
  return {
    title: dossier.label,
    description: dossier.tagline,
    alternates: { canonical: path },
    openGraph: {
      title: dossier.label,
      description: dossier.tagline,
      url: path,
    },
  };
}

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dossier = getAddressableDossier(id);
  const PanelComponent = dossier ? PANEL_REGISTRY[dossier.id] : null;
  if (!dossier || !PanelComponent) notFound();

  return (
    <main className="dossier-route">
      <div className="dossier-route__grain" aria-hidden="true" />
      <article className="dossier-route__inner">
        <p className="dossier-route__eyebrow">
          TRANSMISSION {String(dossier.index + 1).padStart(2, '0')}
        </p>
        <h1 className="dossier-route__title">{dossier.label}</h1>
        <p className="dossier-route__tagline">{dossier.tagline}</p>
        <div className="dossier-route__rule" aria-hidden="true" />

        <PanelComponent />

        <nav className="dossier-route__nav" aria-label="Dossier navigation">
          <Link href={`/?dossier=${dossier.id}`}>OPEN IN DESCENT →</Link>
          <Link href="/">← RETURN TO DESCENT</Link>
        </nav>
      </article>
    </main>
  );
}
