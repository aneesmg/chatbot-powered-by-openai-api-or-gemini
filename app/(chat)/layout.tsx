import Navbar from "@/components/Navbar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pt-16">
      <Navbar />
      {children}
    </div>
  );
}
