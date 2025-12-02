import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['typeorm', 'better-sqlite3'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.optimization.minimize = false;
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        'react-native-sqlite-storage': false,
        'mysql': false,
        'pg': false,
        'oracledb': false,
        'mssql': false,
        'sql.js': false,
        'mongod': false
      };
    }
    return config;
  },
};

export default nextConfig;
