import "server-only";
import { revalidateTag } from "next/cache";
import { TAG, type Tag } from "@/lib/notion/cache";

export { TAG };

export function bust(...tags: Tag[]) {
  for (const t of tags) revalidateTag(t);
}
