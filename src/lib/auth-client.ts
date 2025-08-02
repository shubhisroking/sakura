import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:3000",
})

export const { signIn, signUp, useSession } = authClient

export const signInWithSlack = async () => {
  const data = await authClient.signIn.social({ provider: "slack" });
  return data;
};