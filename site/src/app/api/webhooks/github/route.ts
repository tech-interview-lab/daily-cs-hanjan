import { webhookResponse } from "@/presentation/controllers";
import { getWebhookContainer } from "@/main/container";

export async function POST(request: Request) {
  return webhookResponse(getWebhookContainer(), request);
}
