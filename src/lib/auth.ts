const AUTH_PREFIX = "Bearer ";

function timingSafeEqual(a: string, b: string): boolean {
	const enc = new TextEncoder();
	const bufA = enc.encode(a);
	const bufB = enc.encode(b);
	if (bufA.length !== bufB.length) return false;
	let diff = 0;
	for (let i = 0; i < bufA.length; i++) {
		diff |= bufA[i] ^ bufB[i];
	}
	return diff === 0;
}

export interface AuthResult {
	valid: boolean;
	identity: string;
}

export function getExpectedToken(): string | undefined {
	const token = process.env.MCP_TOKEN;
	if (!token || typeof token !== "string" || token.trim() === "") {
		return undefined;
	}
	return token.trim();
}

export function validateAuth(request: Request): AuthResult {
	const expected = getExpectedToken();
	if (!expected) {
		return { valid: false, identity: "unconfigured" };
	}

	const header = request.headers.get("Authorization");
	if (!header?.startsWith(AUTH_PREFIX)) {
		return { valid: false, identity: "anonymous" };
	}

	const token = header.slice(AUTH_PREFIX.length).trim();
	if (!timingSafeEqual(token, expected)) {
		return { valid: false, identity: "anonymous" };
	}

	return { valid: true, identity: token };
}
