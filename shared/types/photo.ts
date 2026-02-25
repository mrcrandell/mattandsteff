import type { User } from "./user";

export interface Photo {
  id: string;
  pathname: string;
  size?: number; // Optional as it might be 0
  uploadedAt: Date | string; // Date from prisma might be string on client
  contentType?: string;
  urls: {
    original: string;
    large: string;
    thumbnail: string;
  };
  user: Pick<User, "name"> | null;
  post: {
    id: string;
    text: string | null;
    userId: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    user?: Pick<User, "name"> | null;
  } | null;
}
