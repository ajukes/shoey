import { PlayerRole } from '@prisma/client';
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      player?: {
        id: string;
        fullName: string;
        role: PlayerRole;
        clubId: string;
        teamId?: string;
        club: {
          id: string;
          name: string;
        };
        team?: {
          id: string;
          name: string;
        };
      };
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
  }
}