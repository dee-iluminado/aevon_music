import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Copyright, DMCA and usage notes for AEVON Music, a non-commercial music streaming demo.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-fg">
          Disclaimer
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          A few things you should know about AEVON Music.
        </p>
      </div>

      <section className="space-y-3 text-sm leading-relaxed text-zinc-400">
        <h2 className="font-heading text-lg font-semibold text-fg">Educational demo</h2>
        <p>
          AEVON Music is a <strong>non-commercial, educational demo</strong> built
          to showcase a modern music-streaming web experience. It does not host,
          store, upload or distribute any music files itself.
        </p>
        <p>
          All music metadata, artwork, stream links and lyrics are fetched
          on-the-fly from the public JioSaavn/Saavn catalog through unofficial
          community-maintained APIs. All rights remain with their respective
          owners (JioSaavn, music labels, and artists).
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-zinc-400">
        <h2 className="font-heading text-lg font-semibold text-fg">Copyright &amp; DMCA</h2>
        <p>
          If you are a rights holder and believe content linked through this
          demo infringes your copyright, you may request removal of specific
          links. We cannot remove content hosted by third parties — please also
          reach out to the hosting platform directly.
        </p>
        <p>
          We take down requests seriously and will act on valid DMCA-style
          notices as quickly as possible.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-zinc-400">
        <h2 className="font-heading text-lg font-semibold text-fg">No warranty</h2>
        <p>
          The app is provided “as is” without warranties of any kind. Music
          availability depends entirely on third-party APIs and can change or
          disappear at any time. Downloading copyrighted music may be illegal in
          your jurisdiction — please respect the rights of artists and labels.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-zinc-400">
        <h2 className="font-heading text-lg font-semibold text-fg">Data source</h2>
        <p>
          Catalog data streams from public JioSaavn-based APIs (for example the{" "}
          <code className="text-zinc-300">shnwazdev</code> or{" "}
          <code className="text-zinc-300">saavn.dev</code> community projects).
          We are not affiliated with or endorsed by JioSaavn.
        </p>
      </section>

      <Link
        href="/"
        className="inline-flex text-sm font-medium text-accent transition hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
