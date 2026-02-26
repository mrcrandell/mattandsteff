// auth.d.ts
import { type User as SharedUser } from "../shared/types/user";
import { type Admin } from "../shared/types/admin";

declare module "#auth-utils" {
  interface User extends Omit<SharedUser, "createdAt" | "updatedAt"> {
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }

  interface UserSession {
    // Add your own session properties here
    loggedIn: boolean;
    admin?: Pick<Admin, "id" | "name" | "role">;
  }
}

export {};
