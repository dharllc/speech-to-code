declare module '*/config.json' {
  interface Config {
    frontend: {
      port: number;
    };
    backend: {
      port: number;
    };
  }
  const config: Config;
  export default config;
}