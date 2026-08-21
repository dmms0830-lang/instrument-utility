import { useCallback, useEffect, useState } from 'react';

const KEY = 'iu-theme';
export const THEME_BG = { light: '#f3f6fa', dark: '#020617' };

/** 저장된 테마를 읽는다. 없으면 라이트(햇빛 모드)가 기본. */
export function readTheme() {
    try {
        const saved = localStorage.getItem(KEY);
        return saved === 'dark' || saved === 'light' ? saved : 'light';
    } catch {
        return 'light';
    }
}

/** <html>에 dark 클래스와 브라우저 상단바 색을 반영한다. */
export function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    root.style.backgroundColor = THEME_BG[theme];
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_BG[theme]);
}

/** <html>의 dark 클래스를 구독한다. 캔버스(3D)처럼 CSS로 색을 못 주는 곳에서 사용. */
export function useIsDark() {
    const [dark, setDark] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const root = document.documentElement;
        const sync = () => setDark(root.classList.contains('dark'));
        sync();
        const mo = new MutationObserver(sync);
        mo.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);

    return dark;
}

export function useTheme() {
    const [theme, setTheme] = useState(readTheme);

    useEffect(() => {
        applyTheme(theme);
        try { localStorage.setItem(KEY, theme); } catch { /* 사파리 프라이빗 모드 등 */ }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(t => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    return { theme, toggleTheme };
}
