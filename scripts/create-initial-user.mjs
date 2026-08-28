import { Client } from "pg";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const deriveKey = promisify(scrypt);

function getArg(name) {
  const prefix = `${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length);
}

async function getPasswordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt, 64);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

const email = getArg("--email");
const password = getArg("--password");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

if (!email || !password) {
  throw new Error(
    "Usage: pnpm seed:user --email=gerente@example.com --password=change-me"
  );
}

const client = new Client({ connectionString: databaseUrl });

await client.connect();

try {
  const passwordHash = await getPasswordHash(password);

  await client.query(
    `
      insert into users (email, password_hash)
      values ($1, $2)
      on conflict (email)
      do update set password_hash = excluded.password_hash, updated_at = now()
    `,
    [email.trim().toLowerCase(), passwordHash]
  );

  console.log(`Initial user ready: ${email.trim().toLowerCase()}`);
} finally {
  await client.end();
}
