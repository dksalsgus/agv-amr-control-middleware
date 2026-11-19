/**
 * 연결 설정이 DB에서 바뀌었다(추가, 수정, 삭제). 수집 모듈이 받아 바로 다시 맞춘다.
 * 설정 모듈은 수집 모듈을 직접 부르지 않고 이 이벤트만 낸다.
 */
export const CONNECTION_CHANGED_EVENT = "connection.changed";

export type ConnectionChangedEvent = {
  connectionId: string;
};
