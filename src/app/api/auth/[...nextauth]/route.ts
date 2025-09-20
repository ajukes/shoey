import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient, PlayerRole } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Let NextAuth create the user naturally
            return true;
          }

          // Try to find an existing player with this email
          const existingPlayer = await prisma.player.findUnique({
            where: { email: user.email },
          });

          if (existingPlayer && !existingPlayer.userId) {
            // Link the user to the existing player
            await prisma.player.update({
              where: { id: existingPlayer.id },
              data: { userId: existingUser.id },
            });
          }
        } catch (error) {
          console.error('Error linking user to player:', error);
        }
      }
      return true;
    },
    async session({ session, user }) {
      // Add user ID to session
      session.user.id = user.id;

      // Get linked player information
      try {
        const player = await prisma.player.findUnique({
          where: { userId: user.id },
          include: {
            club: true,
            team: true,
          },
        });

        if (player) {
          // Auto-assign ADMIN role for juk3sie@gmail.com
          if (user.email === 'juk3sie@gmail.com' && player.role !== 'ADMIN') {
            await prisma.player.update({
              where: { id: player.id },
              data: { role: 'ADMIN' },
            });
            player.role = 'ADMIN';
          }

          session.user.player = {
            id: player.id,
            fullName: player.fullName,
            role: player.role,
            clubId: player.clubId,
            teamId: player.teamId || undefined,
            club: player.club,
            team: player.team,
          };
        }
      } catch (error) {
        console.error('Error fetching player data:', error);
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign-in
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Always redirect to dashboard for sign-in
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'database',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };