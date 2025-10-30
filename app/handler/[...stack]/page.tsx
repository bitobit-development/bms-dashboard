import { StackHandler } from "@stackframe/stack"
import { stackServerApp } from "@/app/stack"

export default async function Handler(props: any) {
  return <StackHandler fullPage {...props} />
}
