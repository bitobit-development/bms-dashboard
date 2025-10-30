'use client'

import { StackClientApp } from "@stackframe/stack"

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/login",
    afterSignIn: "/dashboard",
    afterSignOut: "/login",
    home: "/",
  },
})
