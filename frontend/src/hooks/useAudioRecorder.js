/**
 * useAudioRecorder.js - CITAMED.VE
 * M03 / Semana 7 - Bloque D: Hook para grabación de audio en el navegador
 *
 * Graba audio del micrófono usando MediaRecorder con el mejor mimeType soportado.
 * Limita automáticamente a 10 minutos y libera recursos en desmontaje.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg'
];

export function getSupportedMimeType() {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return '';
  }
  for (const candidate of MIME_CANDIDATES) {
    if (window.MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return '';
}

export default function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const resolveStopRef = useRef(null);
  const mimeTypeRef = useRef('');
  const secondsRef = useRef(0);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignorar
        }
      });
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanupStream();
        setIsRecording(false);
        resolve(null);
        return;
      }

      resolveStopRef.current = resolve;
      try {
        recorder.stop();
      } catch (err) {
        console.warn('[useAudioRecorder] Error al detener:', err);
        cleanupStream();
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [cleanupStream]);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // Ignorar
      }
    }
    cleanupStream();
    chunksRef.current = [];
    resolveStopRef.current = null;
    setIsRecording(false);
    setSeconds(0);
    secondsRef.current = 0;
  }, [cleanupStream]);

  const start = useCallback(async () => {
    setError(null);
    cancel();

    if (
      typeof window === 'undefined' ||
      !navigator?.mediaDevices?.getUserMedia ||
      typeof window.MediaRecorder === 'undefined'
    ) {
      const msg = 'Tu navegador no soporta la grabación de audio o no tiene permisos en esta conexión.';
      setError(msg);
      throw new Error(msg);
    }

    const mime = getSupportedMimeType();
    mimeTypeRef.current = mime;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (permErr) {
      let msg = 'No se pudo acceder al micrófono.';
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        msg = 'Permiso de micrófono denegado. Permite el acceso al micrófono en tu navegador para dictar.';
      } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
        msg = 'No se encontró ningún micrófono conectado en este equipo.';
      }
      setError(msg);
      throw new Error(msg);
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const options = mime ? { mimeType: mime } : undefined;
    let recorder;
    try {
      recorder = new window.MediaRecorder(stream, options);
    } catch {
      recorder = new window.MediaRecorder(stream);
      mimeTypeRef.current = recorder.mimeType || 'audio/webm';
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const finalMime = mimeTypeRef.current || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: finalMime });
      const durationSeconds = secondsRef.current;

      cleanupStream();
      setIsRecording(false);

      if (resolveStopRef.current) {
        resolveStopRef.current({
          blob,
          mimeType: finalMime,
          seconds: durationSeconds
        });
        resolveStopRef.current = null;
      }
    };

    recorder.onerror = (event) => {
      console.error('[useAudioRecorder] Error de grabación:', event.error);
      setError('Ocurrió un error durante la grabación de audio.');
      cancel();
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250); // Recolectar chunks cada 250ms

    setIsRecording(true);
    setSeconds(0);
    secondsRef.current = 0;

    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);

      // Corte automático a los 10 minutos (600 segundos)
      if (secondsRef.current >= 600) {
        stop();
      }
    }, 1000);
  }, [cancel, cleanupStream, stop]);

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    isRecording,
    seconds,
    error,
    start,
    stop,
    cancel,
    mimeType: mimeTypeRef.current
  };
}
