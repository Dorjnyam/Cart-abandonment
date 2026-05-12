export default function VaultBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(212, 254, 66, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(212, 254, 66, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(circle, transparent 20%, #000000 100%)",
        }}
      />
    </>
  );
}
