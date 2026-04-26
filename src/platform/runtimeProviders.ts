import { createHttpPlatformProviders, shouldUseHttpPlatformProviders } from "./httpProviders";
import { mockPlatformProviders } from "./mockProviders";

export const runtimePlatformProviders = shouldUseHttpPlatformProviders() ? createHttpPlatformProviders() : mockPlatformProviders;
