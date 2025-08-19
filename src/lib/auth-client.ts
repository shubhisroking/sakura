import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
})

export const { signIn, signUp, useSession } = authClient

export const signInWithSlack = async () => {
  const data = await authClient.signIn.social({ 
    provider: "slack",
    callbackURL: "/dashboard", // Redirect to dashboard after login
  });
  return data;
};