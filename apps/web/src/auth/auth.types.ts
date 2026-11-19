export type LoginSession = {
  accessToken: string;
  username: string;
  role: string;
  /** 만료 시각(ms) */
  expiresAt: number;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
  username: string;
  role: string;
};
