import { DatabaseHelper } from "../config/databaseHelper";

// TEKNIK c: Parameterization / Generics — interface User dipakai sebagai generic type param
export interface User {
  id_user?: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "admin" | "user";
  created_at?: string;
}

export class UserModel {
  static async findAll(): Promise<User[]> {
    return await DatabaseHelper.eksekusiQuery<User>(
      "SELECT id_user, name, email, phone, role, created_at FROM users ORDER BY id_user DESC"
    );
  }

  static async findById(id: number): Promise<User | null> {
    return await DatabaseHelper.eksekusiQuerySatu<User>(
      "SELECT * FROM users WHERE id_user = ?", [id]
    );
  }

  static async findByEmail(email: string): Promise<User | null> {
    return await DatabaseHelper.eksekusiQuerySatu<User>(
      "SELECT * FROM users WHERE email = ?", [email]
    );
  }

  static async create(data: Omit<User, "id_user" | "created_at">): Promise<any> {
    return await DatabaseHelper.eksekusiQuery(
      "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)",
      [data.name, data.email, data.password, data.phone || null, data.role]
    );
  }
}
