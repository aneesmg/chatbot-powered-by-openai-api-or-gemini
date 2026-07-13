import SkeletonLoader from "@/components/SkeletonLoader";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="hidden w-64 animate-pulse border-r border-white/10 md:flex md:flex-col">
        <div className="border-b border-white/10 p-4">
          <div className="h-10 rounded-xl bg-white/5" />
        </div>
        <div className="flex-1 space-y-2 p-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
      <main className="flex flex-1 flex-col">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="h-5 w-16 rounded bg-white/5" />
        </div>
        <SkeletonLoader />
      </main>
    </div>
  );
}
