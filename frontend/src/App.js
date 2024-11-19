import { useEffect, useState } from 'react';
import EncryptForServer from './components/EncryptForServer';

function App() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('http://localhost:4000')
            .then((res) => res.json())
            .then((data) => setMessage(data.message));
    }, []);

    return (
        <div>
            <h1>React Frontend</h1>
            <h1>Encryption/Decryption Demo</h1>
            <EncryptForServer />
        </div>
    );
}

export default App;
