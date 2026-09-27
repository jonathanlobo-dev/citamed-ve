import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechDictation - Hook de reconocimiento de voz (Web Speech API)
 * Idioma: Español de Venezuela ('es-VE')
 * Agrega el texto dictado al final del contenido existente.
 *
 * @param {Function} onTranscript - Callback llamado con el texto reconocido
 */
export default function useSpeechDictation(onTranscript) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const SpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const isSupported = Boolean(SpeechRecognition);

  useEffect(() => {
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-VE';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim() && onTranscriptRef.current) {
          onTranscriptRef.current(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('[useSpeechDictation] recognition error:', event.error);
          setError(event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('[useSpeechDictation] Init error:', e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorar error al abortar
        }
      }
    };
  }, [SpeechRecognition]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.warn('[useSpeechDictation] start error:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.warn('[useSpeechDictation] stop error:', err);
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
    toggleListening
  };
}
