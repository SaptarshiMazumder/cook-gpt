import React, { useState } from 'react';

const AudioGenerator = () => {
    const [text, setText] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);

    const handleGenerateAudio = async () => {
        try {
            // Send POST request to the backend
            const response = await fetch('http://localhost:4000/cooking/audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate audio');
            }

            // Convert response to Blob and create URL
            const audioBlob = await response.blob();
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);

            // Auto-play the audio
            const audio = new Audio(url);
            audio.play();
        } catch (error) {
            console.error('Error generating audio:', error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Test</h1>
            <textarea
                rows="5"
                cols="50"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text here..."
                style={{ marginBottom: '10px' }}
            />
            <br />
            <button onClick={handleGenerateAudio}>Generate Audio</button>
            {audioUrl && (
                <div>
                    <h3>Generated Audio:</h3>
                    <audio controls>
                        <source src={audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
    );
};

export default AudioGenerator;
