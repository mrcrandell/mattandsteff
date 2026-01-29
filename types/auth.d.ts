// auth.d.ts
import { type User as SharedUser } from "../shared/types/user";

declare module "#auth-utils" {
  interface User extends Omit<SharedUser, "createdAt" | "updatedAt"> {
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }

  interface UserSession {
    // Add your own session properties here
    loggedIn: boolean;
  }
}

export {};
