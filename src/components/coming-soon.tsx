import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Construction className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-display text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </div>
  );
}
