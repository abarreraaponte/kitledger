import { db } from "../../services/database/db.ts";
import { api_tokens } from "../../services/database/schema.ts";
import { hashString } from "../utils/crypto.ts";

export async function createToken(userId: string, name?: string | null): Promise<string> {
    const rawBytes = new Uint8Array(32);
    crypto.getRandomValues(rawBytes);
    const randomHex = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const rawToken = `api_${randomHex}`;
    
    const tokenHash = await hashString(rawToken);

    await db.insert(api_tokens).values({
        hash: tokenHash,
        user_id: userId,
        name: name ?? "API Token",
        revoked_at: null,
    });

    return rawToken;
}