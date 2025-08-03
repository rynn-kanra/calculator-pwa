export async function loadModule(module: string, option?: ImportCallOptions) {
  const d = await import(module, option);
  return d;
}
export async function loadDefault(module: string, option?: ImportCallOptions) {
  const d = await loadModule(module, option);
  return d.default;
}