const path = require('path');
let bcrypt;

try {
  bcrypt = require('bcrypt');
} catch (e) {
  try {
    bcrypt = require('../backend/node_modules/bcrypt');
  } catch (e2) {
    console.error("Could not find bcrypt. Please run this script from the backend directory or install bcrypt in the root.");
    process.exit(1);
  }
}

const password = process.argv[2];

if (!password) {
  console.log("Please provide a password as an argument");
  console.log("Usage: node hash.js <your_password>");
  process.exit(1);
}

const hashPassword = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log("Password:", password);
    console.log("Hashed Password:", hash);
  } catch (error) {
    console.error("Error hashing password:", error);
  }
};

hashPassword();
