export type AdminRole = "ADMIN" | "MODERATOR";

export interface Admin {
  id: string;
  email: string;
  name?: string | null;
  role: AdminRole;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

