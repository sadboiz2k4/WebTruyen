import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Guess gender from voice name — covers Microsoft & Google Vietnamese voices
function guessGender(name = '') {
  const n = name.toLowerCase();
  // Known female keywords
  if (/hoahoa|hoài|lan|linh|mai|nữ|female|woman|girl|f\b/.test(n)) return 'female';
  // Known male keywords
  if (/namminh|minh|nam|male|man|boy|m\b/.test(n)) return 'male';
  // Google voices: "Google tiếng Việt" — only one voice, treat as female (higher pitched)
  if (/google/.test(n)) return 'female';
  return 'unknown';
}

export function useTTS(paragraphs = []) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPara, setCurrentPara] = useState(-1);
  const [currentWord, setCurrentWord] = useState(null);
  const [rate, setRate] = useState(() => Number(localStorage.getItem('tts_rate') || 1));
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('tts_voice') || '');
  const [genderFilter, setGenderFilter] = useState(() => localStorage.getItem('tts_gender') || 'all');

  const utteranceRef = useRef(null);
  const paraIndexRef = useRef(0);
  const cancelledRef = useRef(false);
  const rateRef = useRef(rate);
  const selectedVoiceRef = useRef(selectedVoice);

  useEffect(() => { rateRef.current = rate; }, [rate]);
  useEffect(() => { selectedVoiceRef.current = selectedVoice; }, [selectedVoice]);

  // Attach gender to each voice object
  const voicesWithGender = useMemo(() =>
    voices.map((v) => ({ voice: v, gender: guessGender(v.name) })),
    [voices]
  );

  // Voices visible in the dropdown after gender filter
  const filteredVoices = useMemo(() => {
    if (genderFilter === 'all') return voicesWithGender;
    return voicesWithGender.filter((v) => v.gender === genderFilter);
  }, [voicesWithGender, genderFilter]);

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      const vi = all.filter((v) => v.lang.startsWith('vi'));
      const list = vi.length > 0 ? vi : all;
      setVoices(list);

      // Auto-select first female voice if no preference saved
      if (!localStorage.getItem('tts_voice')) {
        const firstFemale = list.find((v) => guessGender(v.name) === 'female');
        const first = firstFemale ?? list[0];
        if (first) {
          setSelectedVoice(first.name);
          selectedVoiceRef.current = first.name;
        }
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPara(-1);
    setCurrentWord(null);
    paraIndexRef.current = 0;
  }, []);

  useEffect(() => { stop(); }, [paragraphs, stop]);

  const speakFrom = useCallback((startIndex) => {
    if (!isSupported || paragraphs.length === 0) return;

    cancelledRef.current = false;
    paraIndexRef.current = startIndex;
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentWord(null);

    const speakNext = () => {
      if (cancelledRef.current) return;
      const idx = paraIndexRef.current;

      if (idx >= paragraphs.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentPara(-1);
        setCurrentWord(null);
        return;
      }

      setCurrentPara(idx);
      setCurrentWord(null);

      const utterance = new SpeechSynthesisUtterance(paragraphs[idx]);
      utterance.rate = rateRef.current;
      utterance.lang = 'vi-VN';

      const voice = window.speechSynthesis.getVoices().find((v) => v.name === selectedVoiceRef.current);
      if (voice) utterance.voice = voice;

      utterance.onboundary = (e) => {
        if (cancelledRef.current) return;
        if (e.name === 'word') {
          setCurrentWord({ charIndex: e.charIndex, charLength: e.charLength ?? 0 });
        }
      };

      utterance.onend = () => {
        if (cancelledRef.current) return;
        setCurrentWord(null);
        paraIndexRef.current += 1;
        speakNext();
      };

      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentPara(-1);
        setCurrentWord(null);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  }, [paragraphs]);

  const play = useCallback(() => {
    if (!isSupported) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      speakFrom(0);
    }
  }, [isPaused, speakFrom]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const changeRate = useCallback((newRate) => {
    const r = Number(newRate);
    rateRef.current = r;
    setRate(r);
    localStorage.setItem('tts_rate', r);
    if (isPlaying || isPaused) {
      const resumeIdx = paraIndexRef.current;
      cancelledRef.current = true;
      window.speechSynthesis.cancel();
      setTimeout(() => { speakFrom(resumeIdx); }, 80);
    }
  }, [isPlaying, isPaused, speakFrom]);

  const changeVoice = useCallback((name) => {
    selectedVoiceRef.current = name;
    setSelectedVoice(name);
    localStorage.setItem('tts_voice', name);
    if (isPlaying || isPaused) {
      const resumeIdx = paraIndexRef.current;
      cancelledRef.current = true;
      window.speechSynthesis.cancel();
      setTimeout(() => { speakFrom(resumeIdx); }, 80);
    }
  }, [isPlaying, isPaused, speakFrom]);

  const changeGenderFilter = useCallback((gender) => {
    setGenderFilter(gender);
    localStorage.setItem('tts_gender', gender);
    // Auto-pick the first voice of that gender
    const all = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('vi'));
    const candidates = gender === 'all' ? all : all.filter((v) => guessGender(v.name) === gender);
    if (candidates.length > 0) {
      changeVoice(candidates[0].name);
    }
  }, [changeVoice]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isSupported,
    isPlaying,
    isPaused,
    currentPara,
    currentWord,
    rate,
    voices,
    voicesWithGender,
    filteredVoices,
    selectedVoice,
    genderFilter,
    play,
    pause,
    stop,
    changeRate,
    changeVoice,
    changeGenderFilter,
    speakFrom,
  };
}
