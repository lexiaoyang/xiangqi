import { useEffect, useRef } from "react";
import { DEFAULT_REMOTE_CONFIG } from "./config";
import type { PlatformProviders } from "./providers";
import { runtimePlatformProviders } from "./runtimeProviders";
import { safeAnalyticsData } from "./liveops";
import type { AnalyticsEvent, RemoteConfig, UserSession } from "./types";

type PageAnalyticsContext = {
  screen: string;
  session: UserSession | null;
  config: RemoteConfig;
  providers?: PlatformProviders;
};

const TRACKABLE_SELECTOR = "button,a,input,select,textarea,[role='button'],[data-analytics-id]";
const INPUT_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

function truncate(value: string | null | undefined, max = 80): string | undefined {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function pagePath(): string {
  if (typeof window === "undefined") return "unknown";
  return `${window.location.pathname}${window.location.hash}`;
}

export function describeAnalyticsTarget(target: EventTarget | null): AnalyticsEvent["data"] | null {
  if (!(target instanceof Element)) return null;
  const element = target.closest(TRACKABLE_SELECTOR);
  if (!(element instanceof HTMLElement)) return null;

  const input = element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement ? element : null;
  return {
    tag: element.tagName.toLowerCase(),
    role: element.getAttribute("role"),
    analytics_id: element.dataset.analyticsId,
    label: truncate(element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent),
    input_type: input ? input.type || element.tagName.toLowerCase() : undefined,
    name: input ? truncate(input.name || input.id) : truncate(element.id),
    checked: input instanceof HTMLInputElement && ["checkbox", "radio"].includes(input.type) ? input.checked : undefined,
    disabled: "disabled" in element ? Boolean((element as HTMLButtonElement).disabled) : undefined
  };
}

export function usePageAnalytics({ screen, session, config = DEFAULT_REMOTE_CONFIG, providers = runtimePlatformProviders }: PageAnalyticsContext) {
  const contextRef = useRef({ screen, session, config, providers });
  contextRef.current = { screen, session, config, providers };

  useEffect(() => {
    const emit = (name: string, data: Record<string, unknown>) => {
      const current = contextRef.current;
      const payload = { page: pagePath(), screen: current.screen, ...data };
      void current.providers.analytics.track({
        name,
        source: "page",
        userId: current.session?.profile.userId,
        deviceId: current.session?.device.deviceId,
        configVersion: current.config.version,
        page: pagePath(),
        data: safeAnalyticsData(payload),
        createdAt: new Date().toISOString()
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = describeAnalyticsTarget(event.target);
      if (!target) return;
      emit("page_click", target);
    };

    const onChange = (event: Event) => {
      if (!(event.target instanceof Element) || !INPUT_TAGS.has(event.target.tagName)) return;
      const target = describeAnalyticsTarget(event.target);
      if (!target) return;
      emit("page_input_change", target);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);
    const seen = new WeakSet<Element>();
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting || seen.has(entry.target)) continue;
                const target = describeAnalyticsTarget(entry.target);
                if (!target) continue;
                seen.add(entry.target);
                emit("page_impression", target);
              }
            },
            { threshold: 0.45 }
          );
    const observeTrackableElements = () => {
      if (!observer) return;
      document.querySelectorAll(TRACKABLE_SELECTOR).forEach((element) => observer.observe(element));
    };
    observeTrackableElements();
    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => {
            observeTrackableElements();
          });
    mutationObserver?.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    const current = contextRef.current;
    const data = { page: pagePath(), screen: current.screen };
    void current.providers.analytics.track({
      name: "page_view",
      source: "page",
      userId: current.session?.profile.userId,
      deviceId: current.session?.device.deviceId,
      configVersion: current.config.version,
      page: pagePath(),
      data: safeAnalyticsData(data),
      createdAt: new Date().toISOString()
    });
    void current.providers.analytics.flush();
  }, [screen]);
}
