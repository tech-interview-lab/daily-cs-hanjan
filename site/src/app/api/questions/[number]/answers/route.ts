import { answersResponse } from "@/presentation/controllers";
import { getContainer } from "@/main/container";

export async function GET(_request: Request, { params }: { params: Promise<{ number: string }> }) {
  return answersResponse(getContainer(), (await params).number);
}
