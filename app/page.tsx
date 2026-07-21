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
      <h1 className="text-4xl font-bold text-text-primary">Chatbot</h1>
      <p className="text-text-secondary">AI Chatbot powered by OpenAI or Gemini</p>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-xl bg-accent-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="rounded-xl border border-border bg-surface px-6 py-3 font-semibold text-text-primary transition-colors hover:bg-surface-hover"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
