import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-heading text-2xl">That page is not the cloud.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        There is only the listening-history cover cloud.
      </p>
      <Button className="mt-6" render={<Link href="/" />}>
        Back
      </Button>
    </div>
  );
}
