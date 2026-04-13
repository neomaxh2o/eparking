export async function apiClient<T>(
input: string,
init?: RequestInit
): Promise<T> {
const res = await fetch(input, {
...init,
headers: {
'Content-Type': 'application/json',
...(init?.headers || {}),
},
cache: 'no-store',
});

if (!res.ok) {
const text = await res.text();
throw new Error(text || `HTTP ${res.status}`);
}

return res.json() as Promise<T>;
}
