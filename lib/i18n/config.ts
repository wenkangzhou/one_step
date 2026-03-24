import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

// 基础配置
const initOptions = {
  resources,
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
};

// 如果还没初始化，就初始化
if (!i18n.isInitialized) {
  // 客户端添加语言检测
  if (typeof window !== 'undefined') {
    import('i18next-browser-languagedetector')
      .then((LanguageDetectorModule) => {
        const LanguageDetector = LanguageDetectorModule.default;
        i18n
          .use(LanguageDetector)
          .use(initReactI18next)
          .init({
            ...initOptions,
            detection: {
              order: ['localStorage', 'navigator'],
              caches: ['localStorage'],
            },
          });
      })
      .catch(() => {
        // 如果加载失败，使用基础配置
        i18n.use(initReactI18next).init(initOptions);
      });
  } else {
    // 服务端使用基础配置
    i18n.use(initReactI18next).init(initOptions);
  }
}

export default i18n;
