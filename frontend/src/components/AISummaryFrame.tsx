import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AISummaryFrameProps = PropsWithChildren<{
  className?: string;
  minHeight?: number;
}>;

/**
 * Renders children inside an isolated iframe, injecting fonts and scoped CSS.
 * Guarantees consistent typography independent of the host document.
 */
export function AISummaryFrame({ children, className, minHeight = 280 }: AISummaryFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeDocument, setIframeDocument] = useState<Document | null>(null);
  const [height, setHeight] = useState<number>(minHeight);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Inject fonts and CSS
      const head = doc.head;
      const fontLink = doc.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Manrope:wght@400;600;700&display=swap";
      head.appendChild(fontLink);

      const style = doc.createElement("style");
      style.textContent = `
        :root { --font-sans: Inter, Manrope, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
        html, body { margin: 0; padding: 0; font-family: var(--font-sans); color: #111827; background: transparent; }
        .container { padding: 4px 0; font-variant-numeric: tabular-nums; }
        h1, h2, h3 { line-height: 1.25; margin: 0.5rem 0 0.5rem; letter-spacing: -0.01em; }
        h2 { font-size: 1.25rem; font-weight: 800; }
        h3 { font-size: 1rem; font-weight: 700; }
        p { margin: 0.5rem 0; line-height: 1.6; }
        strong { font-weight: 600; }
        ul { margin: 0.25rem 0 0.25rem 1.125rem; padding: 0; }
        li { margin: 0.25rem 0; }
        table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
        thead { background: #f3f4f6; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; font-size: 0.95rem; vertical-align: middle; }
        th { text-align: left; font-weight: 600; }
        th:nth-child(2), td:nth-child(2), th:nth-child(3), td:nth-child(3) { text-align: right; }
        .muted { color: #6b7280; }
      `;
      head.appendChild(style);

      setIframeDocument(doc);

      // Auto-resize
      const updateHeight = () => {
        const body = doc.body;
        const newHeight = Math.max(minHeight, body.scrollHeight);
        setHeight(newHeight);
      };
      updateHeight();

      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(doc.body);

      const mutationObserver = new MutationObserver(updateHeight);
      mutationObserver.observe(doc.body, { childList: true, subtree: true, characterData: true });

      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    };

    // If iframe is already loaded, call immediately; else wait for load
    if (iframe.contentDocument?.readyState === "complete") {
      onLoad();
    } else {
      iframe.addEventListener("load", onLoad, { once: true });
      return () => iframe.removeEventListener("load", onLoad as any);
    }
  }, [minHeight]);

  const content = useMemo(() => {
    if (!iframeDocument) return null;
    const body = iframeDocument.body;
    // Ensure container exists
    let container = iframeDocument.querySelector<HTMLDivElement>(".container");
    if (!container) {
      container = iframeDocument.createElement("div");
      container.className = "container";
      body.innerHTML = "";
      body.appendChild(container);
    }
    return createPortal(children as any, container);
  }, [iframeDocument, children]);

  return (
    <iframe
      ref={iframeRef}
      title="ai-summary"
      style={{ width: "100%", height: `${height}px`, border: 0, display: "block" }}
      className={className}
    >
      {/* Content injected via portal */}
      {content}
    </iframe>
  );
}


