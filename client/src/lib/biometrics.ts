export const bufferToBase64URLString = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (const charCode of bytes) {
        str += String.fromCharCode(charCode);
    }
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

export const base64URLStringToBuffer = (base64URLString: string) => {
    const base64 = base64URLString.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const paddedBase64 = base64.padEnd(base64.length + padLen, '=');
    const binaryString = atob(paddedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

export const registerBiometric = async (username: string): Promise<string> => {
    if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn no está soportado en este navegador.');
    }

    // Generate random challenge (in production this should come from server)
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const publicKey: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
            name: 'eiGYM'
        },
        user: {
            id: userId,
            name: username,
            displayName: username
        },
        pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 } // RS256
        ],
        authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'discouraged', // Discourage resident keys to avoid Chrome's "Passkey" listing UI
            requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'none'
    };

    const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;

    // We use the Credential ID as the "Fingerprint ID"
    return credential.id;
};

export const verifyBiometric = async (allowedCredentialIds?: string[]): Promise<string> => {
    if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn no está soportado en este navegador.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKey: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        // If we have a list of allowed IDs (e.g., from DB), we can pass them. 
        // If empty, we allow any (though for 1:N this is tricky without resident keys).
        // For now, let's assume we scan first or use resident keys if supported.
        allowCredentials: allowedCredentialIds?.map(id => ({
            id: base64URLStringToBuffer(id),
            type: 'public-key'
        })),
        // Add authenticatorSelection or similar if needed, but for .get, 
        // the platform choice is usually inherited or handled by allowCredentials.
        // However, some browsers benefit from hints.
    };

    const credential = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;

    return credential.id;
};
