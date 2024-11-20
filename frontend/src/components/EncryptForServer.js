import React, { useState } from 'react';
// import { encryptForServer } from '../utils/api';
import { encryptForServer } from '../utils/encryptionUtils';
// import { privateKey } from '../utils/keys'; // Import RSA private key
import { decryptResponseForClient } from '../utils/encryptionUtils';


const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCPGCPao4UIQqv+
wC1XFjsHmA5EYcIFBOI1TzFvWyYgS42/weiikr8jtwlBRyQm3EuSjyguBAVhPBQI
m+jq1F3L0/24QnpEFiFhb7GuP0NLisD0dPzihvBE5tNo5ZvQBtFEv00qdK91qVGl
6foGrJYlt4SRVyukUqCoAtYiTrUhl+lbGDqEkcMOCsu0CogJ1qdUy/rGwWqfXSGc
wQvd8Bw4Yp+5k63qkTwhw52lCzH46O6g7PzNHz9WQyu9Z9EvOpb2FC9I7j18EoMe
+ydzcN+o6wgVkhuBuiEqYWtvsYFw5E8b5r7RFPpa/69CgQ343B6iNWteqh4keSBj
7kVqJ+fdAgMBAAECggEAIlgPZu7/Q3PJFywl1bSSt2hh6Dy0VgMNjfDzcwAj/vVT
ULZoMPjaomZQdNfvz9no04TDhoPVjLhgMI7HEPGmj4DScRKXiNbs7RdjRGiPrMZh
OGsJtQ7hBRCHpjIRuxSfzonBqhJ2eF2KqLEnHsn2gZfx2/ZZlad1Qs3nejV82NJi
wlRWncUjJUaty4ZEr8BAUVeOn/77ng0e9xBAzgFUIcRVkqTLyxhsU1IdARhwdyS/
nXHJz4DjbBKF9M+Re9gq5pmhjSliIR+4LWRGKfdQPKbpECx5qIc7t9kwBydPS6qW
Rnrd/ywXojDwwyig8KaRoIRaAhCNVbqasVpA9KIeAQKBgQC/oVPr7d8XPW0ueuj0
dLjA3h47RoAJHq3ZCnEZgvbTS4YFIFXmNjq7dhJXXqbHYQnqGR2c67XOvZSy50OY
ABnuj0Wm395gMpgFIvMi6Kbu2NVoqj5KjPua3wSgZ50TyRv2feQVgw8ElldMkst0
2XhaCsz93oKzAy6QKPvCsrYQ3QKBgQC/KRyXqY6EbByAkUSpi6VKyDggyOwUuV3/
OXyyhzUcLuxR9oQv+ynxSm7kGZAyD2aJY7rIRdF0nfSgJt2oXG9knHk7eRX+0mVJ
8WFJOj5UQSuCYgzJO8EmJcjg3gTxgDQOWkVZYo+ie88YwT9j3aNRYNRdN/sYQJ0g
5poqAKhDAQKBgFvZQ5Qtq2REOPSyTL3+xB8NV4gpvmygm8sPyi3kK9ISvOXwHbv9
+iCn8xqVb3LY/BuMdjkkcTvqej9VwXw1cDh7y3K0kq2hEmRD4C23PWv12jQUhU7O
TDpq8pi/kPZOymxW4t+8tZIJTUaShZo4MgtWafK0mAidWdAXFLS5W7KxAoGAUaCr
jfOgYNmNfjUJ/eAcsAc5OH6zmNHi2oZgwhdMTYGX9hPvNFHrAhcHrS1hTo8W+Nn2
O2jc3RBKEk0mX6tBAdRzTDsTcmHDUMTbBxrw3KeLfbyCuzdh7fk6gxMrRzi4gdx4
OogEz5xQvcBfYjSVdb2EUV4DQcLtlcwCzqbDMwECgYBXRxyIxVbPPElShtIuXwkG
x92xHQKbR3D+3QGffUdRo95un0Uuv2qb/rUDClw5mc7AR6D7ZtawqMzbfXQjPlmd
RFqttigg7kVukqz2lpODlaRtm4X9XIj3yFk/lu7c1DSbwGCynDgeIcyifNjrWD+n
aagbsIFiEE1IcUiDS7y19A==
-----END PRIVATE KEY-----`;
function EncryptForServer() {
    const [text, setText] = useState('');
    const [response, setResponse] = useState(null);

    const handleEncrypt = async () => {
        try {
            const res = await encryptForServer(text);
            console.log('Encrypted Payload:', res.decryptedPayload);

            const encryptedPayload = res.decryptedPayload;
            const result = decryptResponseForClient(
                encryptedPayload.encryptedAESKey, 
                encryptedPayload.encryptedIV, 
                encryptedPayload.payload, 
                privateKey
            );
            setResponse(result);
            // setResponse(res.data);
            // // setResponse(res.data.response.decryptedPayload);

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
