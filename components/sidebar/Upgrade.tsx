"use client"

import { authClient } from "@/lib/auth-client"
import { Button } from "../ui/button"
import { Crown, Sparkles } from "lucide-react"

export default function Upgrade() {

    const upgrade = async () => {
        await authClient.checkout({
            products: [
                "b9e8d62b-c8eb-41dc-8c95-6c72e7ecc98b",
                "bb12647d-ce81-4d6f-8a8a-e3a92e983104",
                "21455578-b105-4970-b463-3ceaffe075e9"
            ]
        })
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="group relative ml-2 overflow-hidden border-orange-400/50 bg-gradient-to-r from-orange-400/10 to-pink-500/10 text-orange-400 transition-all duration-300 hover:border-orange-500/70 hover:bg-gradient-to-r hover:from-orange-500 hover:to-pink-600 hover:text-white hover:shadow-lg hover:shadow-orange-500/25"
            onClick={upgrade}
        >
            <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span className="font-medium">Upgrade</span>
                <Sparkles className="h-3 w-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>

            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-orange-400/20 to-pink-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Button>
    )
}
