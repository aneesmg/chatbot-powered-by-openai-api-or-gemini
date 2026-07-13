export default function SkeletonLoader() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex items-start gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}
        >
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/5" />
          <div
            className={`h-20 w-3/5 animate-pulse rounded-2xl bg-white/5 ${
              i % 2 === 0 ? "rounded-tr-md" : "rounded-tl-md"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
