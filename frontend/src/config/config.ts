export interface Config {
  frontend: {
    port: number;
  };
  backend: {
    port: number;
  };
}

const config: Config = {
  frontend: {
    port: 3000
  },
  backend: {
    port: 8000
  }
};

export default config;