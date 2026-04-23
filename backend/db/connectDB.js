import mongoose from "mongoose";

const cleanEnvValue = (value) => {
	if (typeof value !== "string") {
		return "";
	}

	return value.trim().replace(/^['\"]|['\"]$/g, "");
};

export const connectDB = async () => {
	try {
		const mongoUri = cleanEnvValue(process.env.MONGO_URI);

		if (!mongoUri) {
			throw new Error("MONGO_URI is missing");
		}

		console.log("mongo_uri is configured");
		const conn = await mongoose.connect(mongoUri);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.log("Error connection to MongoDB: ", error.message);
		process.exit(1); // 1 is failure, 0 status code is success
	}
};