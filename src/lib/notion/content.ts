import "server-only";
import { notion } from "./client";
import { DB } from "./ids";
import { cached, TAG } from "./cache";
import {
  getDate,
  getRichText,
  getSelect,
  getTitle,
  getUrl,
  isFullPage,
  type Page,
} from "./parsers";

export type ContentStatus = "Draft" | "Ready to Publish" | "Published" | "Archived";
export type ContentType = "LinkedIn Post" | "Substack Article" | "Video Script" | "Ad Copy";
export type ContentPlatform = "LinkedIn" | "Substack" | "YouTube" | "Other";

export interface ContentItem {
  id: string;
  title: string;
  topic: string;
  contentType: ContentType | null;
  status: ContentStatus | null;
  publishDate: string | null;
  platform: ContentPlatform | null;
  utmLink: string | null;
  engagementNotes: string;
  lastEditedTime: string;
}

export function parseContent(page: Page): ContentItem {
  return {
    id: page.id,
    title: getTitle(page, "Title"),
    topic: getRichText(page, "Topic"),
    contentType: getSelect(page, "Content Type") as ContentType | null,
    status: getSelect(page, "Status") as ContentStatus | null,
    publishDate: getDate(page, "Publish Date"),
    platform: getSelect(page, "Platform") as ContentPlatform | null,
    utmLink: getUrl(page, "UTM Link"),
    engagementNotes: getRichText(page, "Engagement Notes"),
    lastEditedTime: page.last_edited_time,
  };
}

export const listContent = cached(
  async (): Promise<ContentItem[]> => {
    const res = await notion.databases.query({
      database_id: DB.content,
      page_size: 100,
      sorts: [{ property: "Publish Date", direction: "descending" }],
    });
    return res.results.filter(isFullPage).map(parseContent);
  },
  ["content:all"],
  { tags: [TAG.content] },
);

export interface CreateContentInput {
  title: string;
  topic?: string;
  contentType?: ContentType;
  status?: ContentStatus;
  publishDate?: string | null;
  platform?: ContentPlatform;
  utmLink?: string | null;
}

export async function createContent(input: CreateContentInput): Promise<string> {
  const properties: Record<string, unknown> = {
    Title: { title: [{ type: "text", text: { content: input.title } }] },
  };
  if (input.topic) {
    properties.Topic = {
      rich_text: [{ type: "text", text: { content: input.topic } }],
    };
  }
  if (input.contentType) {
    properties["Content Type"] = { select: { name: input.contentType } };
  }
  if (input.status) {
    properties.Status = { select: { name: input.status } };
  }
  if (input.publishDate) {
    properties["Publish Date"] = { date: { start: input.publishDate } };
  }
  if (input.platform) {
    properties.Platform = { select: { name: input.platform } };
  }
  if (input.utmLink) {
    properties["UTM Link"] = { url: input.utmLink };
  }
  const res = await notion.pages.create({
    parent: { database_id: DB.content },
    properties: properties as never,
  });
  return res.id;
}
