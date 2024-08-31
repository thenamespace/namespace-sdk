export type Mode = "production" | "staging"

export const BackendAPI: Record<Mode, string> = {
    production: "https://api.namespace.ninja",
    staging: "https://api-test.namespace.ninja"
}