import { SignInButton } from "@/components/sign-in-button";
import { WrappedHomeButton } from "@/components/wrapped-home-button";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const plexServer = await prisma.plexServer.findFirst({
    where: { isActive: true },
  });
  const currentYear = new Date().getFullYear();
  const serverName = plexServer?.name || "Plex";
  const heroTitle = `${serverName} ${currentYear} Wrapped`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
          {session ? (
            <WrappedHomeButton userId={session.user.id} serverName={serverName} />
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {heroTitle}
              </h1>
              <p className="text-sm text-slate-400 text-center max-w-xl mb-8">
                Your personalized year-end summary of movies and shows you watched
              </p>
              <SignInButton />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

