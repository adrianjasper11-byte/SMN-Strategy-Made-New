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

      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
        } 
      });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set. Please add it to your environment variables.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      sessionRef.current = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            // Set up microphone capture
            const source = audioContextRef.current!.createMediaStreamSource(streamRef.current!);
            processorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current!.destination);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Convert Float32 to Int16
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                  int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
              
              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: `audio/pcm;rate=${SAMPLE_RATE}` }
                });
              }
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

            if (message.serverContent?.modelTurn?.parts[0]?.text) {
                // Handle transcription if enabled (but we'll just focus on audio for now)
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Something went wrong with the voice agent.");
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

    } catch (err) {
      console.error("Failed to start voice session:", err);
      setError("Mircophone access denied or API error.");
      setIsConnecting(false);
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
