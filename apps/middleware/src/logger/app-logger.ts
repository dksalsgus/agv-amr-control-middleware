import { ConsoleLogger, Injectable, Scope } from "@nestjs/common";

/** Nest 기본 로거를 감싼 앱 로거. 주입받는 class마다 인스턴스가 따로 생겨 setContext로 출처를 단다. */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends ConsoleLogger {}
