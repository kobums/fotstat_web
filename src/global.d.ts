// 빌드 시점에 Vite define으로 주입되는 전역 상수.
// 값은 vite.config.ts / vitest.config.ts에서 package.json version으로 정의된다.
declare const __APP_VERSION__: string;
