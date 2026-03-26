import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./lib/prisma";

import { Polar } from '@polar-sh/sdk';
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";

const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: "sandbox"
})

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "b9e8d62b-c8eb-41dc-8c95-6c72e7ecc98b",
                            slug: "small"
                        },
                        {
                            productId: "bb12647d-ce81-4d6f-8a8a-e3a92e983104",
                            slug: "medium"
                        },
                        {
                            productId: "21455578-b105-4970-b463-3ceaffe075e9",
                            slug: "large"
                        },

                    ],
                    successUrl: "/dashboard",
                    authenticatedUsersOnly: true
                }),
                portal(),
                usage(),
                webhooks({
                    secret: process.env.POLAR_WEBHOOK_SECRET!,
                    onOrderPaid: async (order) => {
                        const externalCustomerId = order.data.customer.externalId;

                        if(!externalCustomerId){
                            console.error("No external customer ID found");
                            throw new Error("No external customer ID found");
                        }

                        const productId = order.data.productId;

                        let creditsToAdd = 0;

                        switch (productId){
                            case "b9e8d62b-c8eb-41dc-8c95-6c72e7ecc98b":
                                creditsToAdd = 50;
                                break;
                            case "bb12647d-ce81-4d6f-8a8a-e3a92e983104":
                                creditsToAdd = 200;
                                break;
                            case "21455578-b105-4970-b463-3ceaffe075e9":
                                creditsToAdd = 400;
                                break;
                        }

                        await prisma.user.update({
                            where: {id: externalCustomerId},
                            data: {
                                credits: {
                                    increment: creditsToAdd
                                }
                            }
                        });

                    }
                })
            ],
        })
    ]
});