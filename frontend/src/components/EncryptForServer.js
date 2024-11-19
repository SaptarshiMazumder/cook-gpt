import React, { useState } from 'react';
import { encryptForServer } from '../utils/api';

function EncryptForServer() {
    const [text, setText] = useState('');
    const [response, setResponse] = useState(null);

    const handleEncrypt = async () => {
        try {
            const res = await encryptForServer(text);
            setResponse(res.data);
        } catch (error) {
            console.error('Error encrypting for server:', error.message);
        }
    };

    return (
        <div>
            <h2>Encrypt for Server</h2>
            <input
                type="text"
                placeholder="Enter text to encrypt"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button onClick={handleEncrypt}>Encrypt</button>
            {response && (
                <div>
                    <h3>Response:</h3>
                    <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

export default EncryptForServer;
