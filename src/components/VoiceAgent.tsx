import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Loader2, Volume2, Waves } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

// Audio Constants
const SAMPLE_RATE = 16000;
const LOOKBACK_WINDOW = 0.5; // seconds to look back for interruption

const VoiceAgent: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const playQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      // We don't necessarily want to close the CTX if we plan to restart,
      // but cleaning up is good.
    }
    setIsActive(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setTranscription('');
  }, []);

  const handleAudioOutput = useCallback((base64Data: string) => {
    // Decode base64 to PCM (Int16)
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    
    // Convert Int16 to Float32
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
    }
    
    playQueueRef.current.push(float32);
    if (!isPlayingRef.current) {
        playNextInQueue();
    }
  }, []);

  const playNextInQueue = () => {
    if (playQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        setIsSpeaking(false);
        return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const chunk = playQueueRef.current.shift()!;
    
    if (!audioContextRef.current) return;

    const buffer = audioContextRef.current.createBuffer(1, chunk.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(chunk);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
        playNextInQueue();
    };
    source.start();
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: SAMPLE_RATE
        });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Microphone access is not supported in this browser context (requires HTTPS).");
        }

        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
      } catch (micErr: any) {
        console.error("Microphone Error:", micErr);
        if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
          throw new Error("Microphone access denied. Please check your browser's site permissions for this URL.");
        }
        throw new Error(`Microphone error: ${micErr.message || "Failed to access microphone"}`);
      }

      // Safe access to API Key for both local dev, AI Studio preview, and external deployments (like Netlify)
      // Note: process.env.GEMINI_API_KEY is standard for AI Studio's free tier.
      // process.env.API_KEY is used if the user has selected a key via the AI Studio Select Key dialog.
      const apiKey = (typeof process !== 'undefined') 
        ? (process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY)
        : (import.meta as any).env?.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("API Key missing. If you're the developer, please ensure GEMINI_API_KEY is configured in your project secrets.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Additional check for mobile Safari/iPhone
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            if (!audioContextRef.current || !streamRef.current) return;

            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
            // On mobile, ScriptProcessor 4096 can be laggy; 0 or 2048 is sometimes safer, but 4096 is often standard.
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              const base64Data = arrayBufferToBase64(int16.buffer);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: `audio/pcm;rate=${audioContextRef.current?.sampleRate || SAMPLE_RATE}` }
                });
              }).catch(err => {
                console.error("Session input error:", err);
              });
            };
          },
          onmessage: (message) => {
            if (message.serverContent?.modelTurn?.parts) {
              const audioPart = message.serverContent.modelTurn.parts.find(p => p.inlineData);
              if (audioPart?.inlineData?.data) {
                handleAudioOutput(audioPart.inlineData.data);
              }
            }
            
            if (message.serverContent?.interrupted) {
              playQueueRef.current = [];
              setIsSpeaking(false);
              isPlayingRef.current = false;
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("The voice agent encountered an error. Please try again.");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are the voice of SMN (Strategy Made New). You are professional, insightful, and concise. Your goal is to help leaders align their people, systems, and story. You believe strategy must be lived, not just documented. Speak with clarity and authority, but stay humble and helpful.",
        }
      });

      // Store session for cleanup
      sessionRef.current = (await sessionPromise);

    } catch (err) {
      console.error("Failed to start voice session:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsConnecting(false);
      stopSession();
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[100] transition-all duration-500">
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[calc(100vw-3rem)] sm:w-80 bg-brand-slate border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-brand-gold animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">SMN Living Voice</span>
              </div>
              <button 
                onClick={stopSession}
                className="text-slate-500 hover:text-white transition-colors"
                id="close-voice-agent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-32 flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center gap-2 h-12">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: isSpeaking ? [8, 32, 12, 24, 8] : [8, 12, 8],
                      opacity: isSpeaking ? [0.4, 1, 0.4] : 0.3
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                    className="w-1.5 bg-brand-gold rounded-full"
                  />
                ))}
              </div>
              <p className="text-center text-sm text-slate-400 font-light italic">
                {isSpeaking ? "SMN is speaking..." : "Listening to you..."}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <Volume2 size={12} />
                <span>Low Latency / High Clarity</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        id="voice-toggle-btn"
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 group
          ${isActive ? 'bg-brand-gold text-brand-slate scale-110' : 'bg-brand-slate border border-brand-gold/30 text-brand-gold hover:border-brand-gold'}
        `}
      >
        {isConnecting ? (
          <Loader2 className="animate-spin" size={24} />
        ) : isActive ? (
          <Mic size={24} />
        ) : (
          <div className="relative">
             <Waves className="group-hover:scale-110 transition-transform" size={24} />
             <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-gold rounded-full animate-ping"></div>
          </div>
        )}
        
        {!isActive && !isConnecting && (
          <div className="absolute -top-12 right-0 bg-brand-slate border border-white/10 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap">
            <span className="text-[10px] uppercase tracking-widest font-bold">Talk to the Strategy Agent</span>
          </div>
        )}
      </button>

      {error && (
        <div className="absolute top-20 right-0 w-80 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-3 rounded-lg text-center uppercase tracking-widest font-bold">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceAgent;
