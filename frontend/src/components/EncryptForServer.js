import React, { useState, useCallback } from 'react';
// import { encryptForServer } from '../utils/api';
import { encryptForServer } from '../utils/encryptionUtils';
import { privateKey } from '../utils/keys'; // Import RSA private key
import { decryptServerResponse } from '../utils/encryptionUtils';
import './EncryptForServer.css'; // Import CSS styles



function EncryptForServer() {
    const [text, setText] = useState('');
    const [response, setResponse] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEncrypt = useCallback(async () => {
        if (!text.trim()) {
            setError('Please enter text to encrypt.');
            return;
        }

        setError('');
        setResponse(null);
        setLoading(true);

        try {
            const res = await encryptForServer(text); // Encrypt data for server
            console.log('Encrypted Payload:', res.decryptedPayload);

            const encryptedPayload = res.decryptedPayload;
            const result = decryptServerResponse(
                encryptedPayload.encryptedAESKey,
                encryptedPayload.encryptedIV,
                encryptedPayload.payload,
                privateKey
            );
            setResponse(result); // Decrypt response from the server
        } catch (error) {
            console.error('Error encrypting for server:', error.message);
            setError('An error occurred during encryption. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [text]);

    return (
        <div className="encrypt-container">
            <h2 className="encrypt-header">Encrypt for Server</h2>
            <input
                type="text"
                placeholder="Enter text to encrypt"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="encrypt-input"
            />
            <button onClick={handleEncrypt} className="encrypt-button" disabled={loading}>
                {loading ? 'Processing...' : 'Encrypt'}
            </button>
            {error && <p className="encrypt-error">{error}</p>}
            {response && (
                <div className="encrypt-response">
                    <h3>Decrypted Response:</h3>
                    <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

export default EncryptForServer;
