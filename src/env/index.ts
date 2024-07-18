export type Mode = "production" | "staging"

export const BackendAPI: Record<Mode, string> = {
    production: "https://api.namespace.tech",
    staging: "https://api-test.namespace.tech"
}