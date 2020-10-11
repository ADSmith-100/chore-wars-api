module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_URL:
    process.env.DB_URL || "postgresql://dunder_mifflin@localhost/blogful-auth", //this will change!
  JWT_SECRET: process.env.JWT_SECRET || "whoof-arted", //does this matter?
  JWT_EXPIRY: process.env.JWT_EXPIRY || "3h",
};
