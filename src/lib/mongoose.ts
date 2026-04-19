import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let cached = (global as any).mongoose;
// Store the in-memory server reference globally so it persists across hot-reloads
let memoryServer: MongoMemoryServer | null = (global as any).__mongoMemoryServer || null;
// Store the in-memory URI globally so we can reconnect to the SAME server
let memoryUri: string | null = (global as any).__mongoMemoryUri || null;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        // Verify the connection is still alive
        if (mongoose.connection.readyState === 1) {
            return cached.conn;
        }
        // Connection was lost — reset promise so we reconnect, but do NOT
        // destroy the in-memory server (that would wipe all user data)
        console.log("[DB] Connection lost (readyState:", mongoose.connection.readyState, "), reconnecting...");
        cached.conn = null;
        cached.promise = null;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        // Treat empty string "" the same as undefined — both mean "no URI configured"
        const mongoUri = process.env.MONGODB_URI?.trim() || "";

        if (!mongoUri) {
            // ⚠️ WARNING: In-memory DB — data will NOT persist across server restarts!
            // For persistent data, add MONGODB_URI to your .env.local file
            // Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aimock
            console.warn(
                "[DB] ⚠️  No MONGODB_URI found! Using in-memory MongoDB.",
                "\n[DB] ⚠️  Data will be LOST on server restart!",
                "\n[DB] ⚠️  Add MONGODB_URI to .env.local for persistent storage."
            );

            // Reuse existing memory server if available (survives hot-reloads)
            if (memoryServer) {
                const uri = memoryServer.getUri();
                console.log("[DB] Reusing existing in-memory MongoDB at:", uri);
                cached.promise = mongoose.connect(uri, opts).then((inst) => inst);
            } else if (memoryUri) {
                // The memoryServer reference was lost (HMR) but the URI was preserved
                // Try reconnecting to the same URI — the server process may still be alive
                console.log("[DB] Reconnecting to in-memory MongoDB at saved URI:", memoryUri);
                cached.promise = mongoose.connect(memoryUri, opts).then((inst) => inst).catch(async () => {
                    // Server process died — create a fresh one
                    console.log("[DB] Saved URI unreachable, creating new in-memory server...");
                    const mongo = await MongoMemoryServer.create();
                    memoryServer = mongo;
                    (global as any).__mongoMemoryServer = mongo;
                    const newUri = mongo.getUri();
                    memoryUri = newUri;
                    (global as any).__mongoMemoryUri = newUri;
                    console.log("[DB] Started new in-memory MongoDB at:", newUri);
                    return mongoose.connect(newUri, opts).then((inst) => inst);
                });
            } else {
                cached.promise = MongoMemoryServer.create().then(async (mongo) => {
                    memoryServer = mongo;
                    (global as any).__mongoMemoryServer = mongo; // Persist across hot-reloads
                    const uri = mongo.getUri();
                    memoryUri = uri;
                    (global as any).__mongoMemoryUri = uri; // Persist URI separately
                    console.log("[DB] Started new in-memory MongoDB at:", uri);
                    return mongoose.connect(uri, opts).then((inst) => inst);
                });
            }
        } else {
            console.log("[DB] Connecting to MongoDB Atlas/remote...");
            cached.promise = mongoose.connect(mongoUri, opts).then((inst) => {
                console.log("[DB] ✅ Connected to MongoDB successfully");
                return inst;
            });
        }
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("[DB] ❌ Connection failed:", e);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
