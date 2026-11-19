export class PostLoginResponseDto {
  accessToken!: string;
  expiresIn!: number;
  username!: string;
  roles!: string[];
}
