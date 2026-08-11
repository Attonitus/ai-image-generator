"use client";

import { RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui";
import { Image as ImageIcon, Settings, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>();
  const router = useRouter();

  useEffect(() => {
    const loadSession = async () => {
      try {
        const result = await authClient.getSession();
        setUserName(result.data?.user?.name);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSession();
  }, []);

  if (isLoading) {
    return <div className="flex min-h-[400px] items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <RedirectToSignIn />
      <SignedIn>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              Welcome back{userName ? `, ${userName}` : ""}!
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Generate images privately and download them when you are ready.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="h-4 w-4 text-purple-500" />
                  Image storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">None</div>
                <p className="text-muted-foreground text-xs">Images are not saved</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Temporary</div>
                <p className="text-muted-foreground text-xs">Browser memory only</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Settings className="h-4 w-4 text-green-500" />
                  Your control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Download</div>
                <p className="text-muted-foreground text-xs">Keep only what you want</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Start creating</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="border-muted bg-muted/20 mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed">
                <ImageIcon className="text-muted-foreground h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Nothing is stored</h3>
              <p className="text-muted-foreground mb-4 max-w-md text-sm">
                Generated images exist only in your browser until you close the page or download them.
              </p>
              <Button onClick={() => router.push("/dashboard/create")} className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Generate an Image
              </Button>
            </CardContent>
          </Card>
        </div>
      </SignedIn>
    </>
  );
}
