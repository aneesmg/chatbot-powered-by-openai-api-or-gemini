import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <h1 className="text-4xl font-bold text-white">Chatbot</h1>
      <p className="text-gray-400">AI Chatbot powered by OpenAI or Gemini</p>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-xl bg-accent-cyan px-6 py-3 font-semibold text-black transition-shadow hover:shadow-[0_0_20px_rgba(0,229,255,0.5)]"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="glass rounded-xl px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
