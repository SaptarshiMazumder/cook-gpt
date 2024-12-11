import React, { useState, useRef } from 'react';

const AudioGenerator = () => {
    const [text, setText] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);

    const cleanup = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }

        if (mediaSourceRef.current) {
            const mediaSource = mediaSourceRef.current;
            if (mediaSource.readyState === 'open') {
                try {
                    if (sourceBufferRef.current) {
                        mediaSource.removeSourceBuffer(sourceBufferRef.current);
                        sourceBufferRef.current = null;
                    }
                    mediaSource.endOfStream();
                } catch (e) {
                    console.warn('Error during MediaSource cleanup:', e);
                }
            }
            mediaSourceRef.current = null;
        }
    };

    const handleStreamAudio = async () => {
        if (isPlaying) return;

        setIsPlaying(true);
        cleanup(); // Cleanup previous playback session

        try {
            const mediaSource = new MediaSource();
            mediaSourceRef.current = mediaSource;

            const audio = new Audio();
            audioRef.current = audio;
            audio.src = URL.createObjectURL(mediaSource);
            audio.play();

            mediaSource.addEventListener('sourceopen', async () => {
                const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
                sourceBufferRef.current = sourceBuffer;

                const response = await fetch('http://localhost:4000/cooking/audio', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch audio stream');
                }

                const reader = response.body.getReader();

                const appendChunk = async (chunk) => {
                    return new Promise((resolve, reject) => {
                        const onUpdateEnd = () => {
                            sourceBuffer.removeEventListener('updateend', onUpdateEnd);
                            resolve();
                        };

                        const onError = (e) => {
                            sourceBuffer.removeEventListener('error', onError);
                            reject(e);
                        };

                        sourceBuffer.addEventListener('updateend', onUpdateEnd);
                        sourceBuffer.addEventListener('error', onError);

                        sourceBuffer.appendBuffer(chunk);
                    });
                };

                // Process and append audio chunks
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        // Ensure all buffers are processed before ending the stream
                        await new Promise((resolve) => {
                            if (!sourceBuffer.updating) {
                                resolve();
                            } else {
                                sourceBuffer.addEventListener('updateend', resolve, { once: true });
                            }
                        });

                        mediaSource.endOfStream();
                        break;
                    }
                    await appendChunk(value);
                }
            });
        } catch (error) {
            console.error('Error streaming audio:', error);
            setIsPlaying(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Audio Generator</h1>
            <textarea
                rows="5"
                cols="50"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text here..."
                style={{ marginBottom: '10px' }}
            />
            <br />
            <button onClick={handleStreamAudio} disabled={isPlaying}>
                {isPlaying ? 'Playing...' : 'Generate Audio'}
            </button>
        </div>
    );
};

export default AudioGenerator;
