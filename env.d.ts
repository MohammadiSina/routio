declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      PORT: number;
      DB: string;
      NESHAN_API_KEY: string;
    }
  }
}

export {};
