export default {
  testEnvironment: "node",
  transform: {},
  setupFiles: ["dotenv/config"],
  testTimeout: 30000, // MongoMemoryServer puede tardar en el primer arranque (descarga binarios)
};
