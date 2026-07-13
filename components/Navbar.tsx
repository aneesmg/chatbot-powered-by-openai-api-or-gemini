import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="glass fixed top-0 z-50 flex w-full items-center justify-between px-6 py-3">
      <span className="text-lg font-semibold text-white">Chatbot</span>
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: "h-9 w-9",
            userButtonPopoverCard: "glass border-gray-700",
            userButtonPopoverActionButton:
              "text-white hover:bg-white/10",
            userButtonPopoverActionButtonText: "text-white",
          },
        }}
      />
    </nav>
  );
}
