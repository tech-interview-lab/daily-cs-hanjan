import type { NavItemVM } from "../viewmodels";
import styles from "./nav.module.css";
import { NavLink } from "./NavLink";

export function CategoryNav({ items, headingId }: { readonly items: readonly NavItemVM[]; readonly headingId: string }) {
  return (
    <nav aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>카테고리</h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <NavLink href={item.href} className={styles.link}>
              <span>{item.label}</span>
              <span className={styles.count} aria-hidden="true">{item.countText}</span>
              <span className="visually-hidden">{item.countLabel}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function CategoryChips({ items }: { readonly items: readonly NavItemVM[] }) {
  return (
    <section aria-labelledby="category-chips-title" className={styles.mobileOnly}>
      <h2 id="category-chips-title" className={styles.heading}>카테고리</h2>
      <ul className={styles.chips}>
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href} className={styles.chip}>
              {item.label}
              <span className={styles.count} aria-hidden="true">{item.countText}</span>
              <span className="visually-hidden">{item.countLabel}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
