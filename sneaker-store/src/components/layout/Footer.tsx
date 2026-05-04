export default function Footer() {
  return (
    <footer className="surface-low mt-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-brand text-xl font-black tracking-widest text-[#c8f135]">KICKLAB</p>
          <p className="mt-3 text-sm text-zinc-400">Luxury streetwear energy meets tech precision.</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-200">Links</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>Shop</p><p>Drops</p><p>Brands</p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-200">Help</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>Returns</p><p>Shipping</p><p>Support</p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-200">Newsletter</p>
          <div className="flex gap-2">
            <input className="surface-high w-full rounded-lg px-3 py-2 text-sm" placeholder="Email" />
            <button className="btn-primary px-4 py-2 text-xs">Join</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

