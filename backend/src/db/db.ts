import { Sequelize } from "sequelize";


export const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: "postgres",
  logging: false, 
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected Successfully");
  } catch (error) {
    console.error("❌ PostgreSQL Connection Error:", error);
    process.exit(1);
  }
};