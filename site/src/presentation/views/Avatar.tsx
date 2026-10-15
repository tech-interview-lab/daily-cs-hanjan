import styles from "./avatar.module.css";
import { UserIcon } from "./icons";

type Props = {
  readonly src: string | null;
  readonly name: string | null;
  readonly large?: boolean;
};

// 옆에 이름이 항상 함께 나오므로 이미지는 장식(alt="")으로 둔다. 이미지가 없으면 이니셜, 탈퇴 계정은 사람 모양
export function Avatar({ src, name, large = false }: Props) {
  const className = `${styles.avatar} ${large ? styles.large : ""}`;
  if (src) {
    const size = large ? 96 : 40;
    return <img className={className} src={src} alt="" width={size} height={size} loading="lazy" decoding="async" referrerPolicy="no-referrer" />;
  }
  return (
    <span className={`${className} ${styles.fallback}`} aria-hidden="true">
      {name ? name.slice(0, 1).toUpperCase() : <UserIcon size={14} />}
    </span>
  );
}
