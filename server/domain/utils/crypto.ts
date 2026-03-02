import { hash, verify } from "@node-rs/argon2";

export function hashPassword(input: string): Promise<string> {
	const hashOptions = {
		type: 2, // argon2id
		memoryCost: 65536, // 64 MiB
		timeCost: 5, // 5 iterations
		parallelism: 1,
	};

	return hash(input, hashOptions);
}

export function verifyPassword(hashStr: string, input: string): Promise<boolean> {
	return verify(hashStr, input);
}

export async function hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyHashedString(input: string, storedHash: string): Promise<boolean> {
    const inputHash = await hashString(input);
    return inputHash === storedHash;
}
