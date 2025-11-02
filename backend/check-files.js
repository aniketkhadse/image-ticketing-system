const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'server.js',
  'config/db.js',
  'config/email.js',
  'models/User.js',
  'models/Ticket.js',
  'routes/auth.js',
  'routes/tickets.js',
  'middleware/auth.js',
  '.env'
];

console.log('Checking required files...\n');

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n' + (allFilesExist ? '✅ All files exist!' : '❌ Some files are missing. Please create them.'));