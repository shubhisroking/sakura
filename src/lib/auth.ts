import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "../generated/prisma";
 
const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    
    emailAndPassword: {
        enabled: true,
    },
    
    socialProviders: {
        slack: { 
            clientId: process.env.SLACK_CLIENT_ID as string, 
            clientSecret: process.env.SLACK_CLIENT_SECRET as string,
        },
    },
    
    baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:3000",
    
    secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-development-only",
});