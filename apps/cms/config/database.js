"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
exports.default = ({ env }) => {
    const client = env("DATABASE_CLIENT", "postgres");
    if (client === "sqlite") {
        return {
            connection: {
                client: "sqlite",
                connection: { filename: path_1.default.join(__dirname, "..", env("DATABASE_FILENAME", ".tmp/data.db")) },
                useNullAsDefault: true,
            },
        };
    }
    return {
        connection: {
            client: "postgres",
            connection: {
                connectionString: env("DATABASE_URL"),
                ssl: env.bool("DATABASE_SSL", false)
                    ? { rejectUnauthorized: env.bool("DATABASE_SSL_REJECT_UNAUTHORIZED", true) }
                    : false,
            },
            pool: { min: env.int("DATABASE_POOL_MIN", 2), max: env.int("DATABASE_POOL_MAX", 10) },
        },
    };
};
