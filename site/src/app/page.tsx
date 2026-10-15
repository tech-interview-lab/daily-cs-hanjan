import { renderHome } from "@/presentation/controllers";
import { getContainer } from "@/main/container";

export default function Home() {
  return renderHome(getContainer());
}
