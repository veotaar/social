import { type Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Value } from "@sinclair/typebox/value";

const LogLevelSchema = Type.Union([
  Type.Literal("fatal"),
  Type.Literal("error"),
  Type.Literal("warn"),
  Type.Literal("info"),
  Type.Literal("debug"),
  Type.Literal("trace"),
]);

const EnvSchema = Type.Object({
  NODE_ENV: Type.String({ default: "development" }),
  PORT: Type.Number({ default: 3000 }),
  LOG_LEVEL: LogLevelSchema,
  BETTER_AUTH_SECRET: Type.String(),
  BETTER_AUTH_URL: Type.String(),
  DATABASE_URL: Type.String(),
  S3_ACCESS_KEY_ID: Type.String(),
  S3_SECRET_ACCESS_KEY: Type.String(),
  S3_BUCKET_NAME: Type.String(),
  S3_ENDPOINT: Type.String(),
  REDIS_URL: Type.String(),
  CORS_ORIGIN: Type.String({ default: "http://localhost:3001" }),
  TRUSTED_ORIGINS: Type.String({
    default: "http://localhost:3001,http://localhost:3000",
  }),
});

export type Env = Static<typeof EnvSchema>;

const compiler = TypeCompiler.Compile(EnvSchema);

function loadEnv(): Env {
  const converted = Value.Convert(EnvSchema, process.env);
  const withDefaults = Value.Default(EnvSchema, converted);

  if (!compiler.Check(withDefaults)) {
    const issues = [...compiler.Errors(withDefaults)];
    console.error("Invalid ENV:");

    for (const i of issues) {
      console.error(`${i.path}: ${i.message}`);
    }
    process.exit(1);
  }

  return withDefaults;
}

const env: Env = loadEnv();

export default env;
