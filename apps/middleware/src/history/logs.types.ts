import { logs } from "@prisma/client";

export type LogRow = logs;

export type LogPageQuery = {
  type?: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
};
