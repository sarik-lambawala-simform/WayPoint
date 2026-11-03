import { isExternalUrl, openExternalUrl } from "@/lib/external-link";
import { resolveMarkdownLink } from "./lib/markdownLinks"; // fork
import type { ComponentProps, MouseEventHandler } from "react";

export type MarkdownLinkProps = ComponentProps<"a"> & {
  node?: unknown;
  onSettled?: () => void;
  /** fork: the file holding this link, to resolve relative `.md` hrefs. */
  currentPath?: string;
  /** fork: opens a resolved `.md` target in a markdown tab. */
  onOpenMarkdown?: (path: string) => void;
};

export function MarkdownLink({
  children,
  href,
  node: _node,
  onClick,
  onSettled,
  currentPath, // fork
  onOpenMarkdown, // fork
  ...props
}: MarkdownLinkProps) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event);
    // fork: relative `.md` links open in a markdown tab.
    const mdTarget =
      currentPath && onOpenMarkdown
        ? resolveMarkdownLink(href, currentPath)
        : null;
    if (!event.defaultPrevented && mdTarget) {
      event.preventDefault();
      onOpenMarkdown?.(mdTarget);
      return;
    }
    if (event.defaultPrevented || !href || !isExternalUrl(href)) return;

    event.preventDefault();
    void openExternalUrl(href, onSettled);
  };

  return (
    <a
      {...props}
      href={href}
      onClick={handleClick}
      rel="noreferrer"
      target={isExternalUrl(href ?? "") ? "_blank" : undefined} // fork
    >
      {children}
    </a>
  );
}
