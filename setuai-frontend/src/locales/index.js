import en from './en.json';
import hi from './hi.json';
import ta from './ta.json';

export const languages = {
  en: { name: 'English', code: 'en', flag: '🇺🇸' },
  hi: { name: 'हिंदी', code: 'hi', flag: '🇮🇳' },
  ta: { name: 'தமிழ்', code: 'ta', flag: '🇮🇳' }
};

export const translations = {
  en,
  hi,
  ta
};

export const defaultLanguage = 'en'; 