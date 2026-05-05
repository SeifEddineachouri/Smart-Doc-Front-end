export interface SignInRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignUpRequest {
  fullName: string;
  workEmail: string;
  password: string;
  acceptedTerms: boolean;
}

export interface AuthUserProfile {
  id: string;
  fullName: string;
  email: string;
  language: 'en' | 'fr';
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUserProfile;
}

export interface RefreshTokenRequest {
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
