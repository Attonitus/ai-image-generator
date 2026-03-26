import { auth } from "@/auth"
import CustomerPortal from "@/components/sidebar/CustomerPortal"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function CustomerPortalPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) redirect("/auth/sign-in")

    return <CustomerPortal />
}
