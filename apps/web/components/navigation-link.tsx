"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

export function NavigationLink(props: ComponentProps<typeof Link>) {
  const pathname = usePathname();
  const href = typeof props.href === "string" ? props.href : props.href.pathname;
  const active = pathname === href || (href !== "/memory" && href && pathname.startsWith(`${href}/`));
  return <Link {...props} aria-current={active ? "page" : undefined} />;
}
