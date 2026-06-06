import { pool } from '../db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
}

export async function createUser(
  username: string,
  password: string,
  displayName: string
): Promise<User> {
  // Check if username already taken
  const existing = await pool.query(
    'SELECT id FROM users WHERE username = $1', // $1 = parameterized (safe from SQL injection)
    [username]
  );
  if (existing.rows.length > 0) throw new Error('Username already taken');

  // Hash password before saving — never store plain text passwords
  const passwordHash = await bcrypt.hash(password, 10); // 10 = salt rounds (how complex the hash is)

  const { rows } = await pool.query<User>(
    `INSERT INTO users (id, username, password_hash, display_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, display_name, created_at`, // RETURNING sends back the created row
    [uuidv4(), username, passwordHash, displayName || username]
  );

  return rows[0];
}

export async function findUser(username: string, password: string): Promise<User> {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );

  // Don't say "user not found" — say "invalid credentials" (security best practice)
  if (rows.length === 0) throw new Error('Invalid username or password');

  // bcrypt.compare hashes the input and checks against stored hash
  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) throw new Error('Invalid username or password');

  return rows[0];
}