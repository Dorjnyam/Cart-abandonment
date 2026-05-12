import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdminUser } from "@/lib/admin";
import VaultBackdrop from "@/components/layout/VaultBackdrop";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const admin = await requireAdminUser();
  if (!admin) redirect("/");

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <VaultBackdrop />
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-col border-r border-[#494847]/20 bg-[#0e0e0e]/95 py-8 pl-6 pr-4 backdrop-blur-md lg:flex">
        <div className="px-2">
          <span className="font-headline text-lg font-black tracking-tighter text-[#C8F135]">THE_VAULT_ADMIN</span>
          <p className="mt-1 font-headline text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]">VAULT_CORE</p>
        </div>
        <nav className="mt-10 flex flex-col gap-1 text-sm font-headline font-bold uppercase tracking-widest">
          <Link href="/admin" className="rounded-lg px-3 py-2 text-zinc-400 hover:bg-[#131313] hover:text-[#d4fe42]">
            Overview
          </Link>
          <Link href="/admin/products" className="rounded-lg px-3 py-2 text-zinc-400 hover:bg-[#131313] hover:text-[#d4fe42]">
            Products
          </Link>
          <Link href="/admin/products/new" className="rounded-lg px-3 py-2 text-zinc-400 hover:bg-[#131313] hover:text-[#d4fe42]">
            Add product
          </Link>
          <Link href="/admin/taxonomy" className="rounded-lg px-3 py-2 text-zinc-400 hover:bg-[#131313] hover:text-[#d4fe42]">
            Taxonomy
          </Link>
          <Link href="/admin/orders" className="rounded-lg px-3 py-2 text-zinc-400 hover:bg-[#131313] hover:text-[#d4fe42]">
            Orders
          </Link>
          <Link href="/admin/coupons" className="rounded-lg px-3 py-2 text-zinc-400 hover:bg-[#131313] hover:text-[#d4fe42]">
            Coupons
          </Link>
          <Link href="/admin/analytics" className="rounded-lg px-3 py-2 text-zinc-400 hover:bg-[#131313] hover:text-[#d4fe42]">
            Analytics
          </Link>
        </nav>
        <div className="mt-auto px-2">
          <Link href="/" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-[#d4fe42]">
            Storefront
          </Link>
        </div>
      </aside>
      <div className="lg:ml-64">{children}</div>
    </div>
  );
}
