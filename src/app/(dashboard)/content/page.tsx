import { listContent } from "@/lib/notion/content";
import { ErrorState } from "@/components/ui/states";
import { ContentTabs } from "./_ContentTabs";

export const revalidate = 30;

export default async function ContentPage() {
  const r = await Promise.allSettled([listContent()]);
  if (r[0].status === "rejected") {
    return (
      <ErrorState
        title="Content Calendar failed to load"
        description={(r[0].reason as Error)?.message}
      />
    );
  }
  return <ContentTabs items={r[0].value} />;
}
