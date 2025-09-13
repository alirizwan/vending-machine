// Key names in localStorage
const TECH_KEY = 'vm-tech-token';
const MACHINE_KEY = 'vm-machine-token';

function safeGet(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(key) ?? undefined;
}
function safeSet(key: string, val: string | undefined) {
  if (typeof window === 'undefined') return;
  if (!val) localStorage.removeItem(key);
  else localStorage.setItem(key, val);
}

export const auth = {
  // technician token (cleared on logout)
  get technician(): string | undefined { return safeGet(TECH_KEY); },
  set technician(t: string | undefined) { safeSet(TECH_KEY, t); },

  // machine token (persists until explicitly cleared)
  get machine(): string | undefined { return safeGet(MACHINE_KEY); },
  set machine(t: string | undefined) { safeSet(MACHINE_KEY, t); },

  clearTechnician() { safeSet(TECH_KEY, undefined); },
  clearMachine() { safeSet(MACHINE_KEY, undefined); },
};
