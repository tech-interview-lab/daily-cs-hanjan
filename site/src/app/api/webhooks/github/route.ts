import { webhookResponse } from "@/presentation/controllers";
import { getWebhookContainer } from "@/main/container";

// 응답 뒤에 실행되는 캐시 미리 채우기(after)가 끝까지 돌 시간. GitHub 조회가 늦은 변경은 재시도하므로 기본값(10초)보다 길게 둔다
export const maxDuration = 30;

export async function POST(request: Request) {
  return webhookResponse(getWebhookContainer(), request);
}
