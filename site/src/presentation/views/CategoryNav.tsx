import type { NavItemVM } from "../viewmodels";
import { Avatar } from "./Avatar";
import styles from "./nav.module.css";
import { NavLink } from "./NavLink";

type NavListProps = { readonly items: readonly NavItemVM[]; readonly headingId: string; readonly title: string };

function NavList({ items, headingId, title }: NavListProps) {
  return (
    <section aria-labelledby={headingId} className={styles.group}>
      <h2 id={headingId} className={styles.heading}>{title}</h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <NavLink href={item.href} className={styles.link}>
              <span className={styles.label}>
                {item.avatarUrl !== undefined && <Avatar src={item.avatarUrl} name={item.label} />}
                {item.label}
              </span>
              <span className={styles.count} aria-hidden="true">{item.countText}</span>
              <span className="visually-hidden">{item.countLabel}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

type SiteNavProps = { readonly categories: readonly NavItemVM[]; readonly authors: readonly NavItemVM[]; readonly idPrefix: string };

export function SiteNav({ categories, authors, idPrefix }: SiteNavProps) {
  return (
    <nav aria-label="사이트 메뉴">
      <NavList items={categories} headingId={`${idPrefix}-categories`} title="카테고리" />
      {authors.length > 0 && <NavList items={authors} headingId={`${idPrefix}-authors`} title="작성자" />}
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
