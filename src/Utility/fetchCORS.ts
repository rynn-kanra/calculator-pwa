export function fetchCORS(input: string, init?: RequestInit) {
  return fetch(`https://cors-proxy.blackhaze879.workers.dev/${input}`, init);
}