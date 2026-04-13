import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        if (!process.env.MONGODB_URI) {
            console.log("No MONGODB_URI found! Starting in-memory MongoDB for local development...");
            
            // Spin up a MongoDB server in-memory automatically so the app just works!
            cached.promise = MongoMemoryServer.create().then(async (mongo) => {
                const uri = mongo.getUri();
                console.log("Mongoose connected to transient in-memory database at:", uri);
                return mongoose.connect(uri, opts).then((mongooseInstance) => {
                    return mongooseInstance;
                });
            });
        } else {
            cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
                return mongooseInstance;
            });
        }
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
