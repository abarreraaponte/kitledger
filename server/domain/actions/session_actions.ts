import { db } from "../../services/database/db.ts";
import { sessions } from "../../services/database/schema.ts";
import { sessionConfig } from "../../config.ts";
import { hashString } from "../utils/crypto.ts";

export async function startSession(userId: string): Promise<string> {
    const rawBytes = new Uint8Array(32);
    crypto.getRandomValues(rawBytes);
    const randomHex = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const rawToken = `sess_${randomHex}`;
    
    const tokenHash = await hashString(rawToken);

    await db.insert(sessions).values({
        hash: tokenHash,
        user_id: userId,
        expires_at: new Date(Date.now() + (sessionConfig.ttl * 1000)),
        created_at: new Date(),
    });

    return rawToken;
}
