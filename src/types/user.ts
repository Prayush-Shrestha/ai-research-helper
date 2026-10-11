export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: "bearer";
}

/** POST /auth/login + POST /auth/register response shape (FastAPI). */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
