import Link from "next/link";
import TaxonomyClient from "./TaxonomyClient";

export default async function AdminTaxonomyPage() {
  return (
    <div className="vault-admin-main mx-auto max-w-5xl px-4 py-8 pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-headline text-2xl font-black uppercase tracking-tight text-white">
          Catalog taxonomy
        </h1>
        <Link href="/admin" className="rounded-lg bg-[#262626] px-3 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#2c2c2c]">
          Dashboard
        </Link>
      </div>
      <TaxonomyClient />
    </div>
  );
}
