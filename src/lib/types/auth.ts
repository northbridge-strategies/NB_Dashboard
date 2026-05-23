export type Role = "Admin" | "Staff" | "Client";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface StoredUser extends SessionUser {
  passwordHash: string;
}
