"use client";

import { RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui";
import { Image as ImageIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <>
      <RedirectToSignIn />
      <SignedIn>
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-16 text-center">
          <div className="border-muted bg-muted/20 mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed">
            <ImageIcon className="text-muted-foreground h-10 w-10" />
          </div>
          <Card className="w-full">
            <CardContent className="space-y-4 p-8">
              <h1 className="text-2xl font-bold">No saved projects</h1>
              <p className="text-muted-foreground">
                Images are displayed temporarily and are not stored in the cloud or in your account.
              </p>
              <Button onClick={() => router.push("/dashboard/create")} className="gap-2">
                <Plus className="h-4 w-4" />
                Generate an Image
              </Button>
            </CardContent>
          </Card>
        </div>
      </SignedIn>
    </>
  );
}
