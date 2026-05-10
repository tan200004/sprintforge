const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SprintforgeUser = require('../models/User');

const addFakeUsers = async () => {
  try {
    const howManyUsers = await SprintforgeUser.countDocuments();
    if (howManyUsers === 0) {
      await SprintforgeUser.create([
        { fullName: 'Admin User', email: 'admin@sprintforge.io', passwordHash: 'Admin@1234', role: 'admin', emailVerified: true, accountStatus: 'active' },
        { fullName: 'Project Manager', email: 'pm@sprintforge.io', passwordHash: 'Manager@1234', role: 'project_manager', emailVerified: true, accountStatus: 'active' },
        { fullName: 'Team Member', email: 'dev@sprintforge.io', passwordHash: 'Member@1234', role: 'member', emailVerified: true, accountStatus: 'active' },
      ]);
      console.log('🌱 Fake users added!');
    }
  } catch (error) {
    console.error('Oops, could not add fake users:', error.message);
  }
};

const startMyDatabase = async () => {
  try {
    const myDbConnection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Database working! Connected to: ${myDbConnection.connection.host}`);
    await addFakeUsers();

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Database disconnected... trying again...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ Database came back online');
    });
  } catch (err) {
    console.warn(`⚠️  Real database failed: ${err.message}`);
    console.warn(`🚀 Using fake memory database instead...`);
    
    try {
      const memoryDb = await MongoMemoryServer.create();
      const dbUrl = memoryDb.getUri();
      
      await mongoose.connect(dbUrl);
      console.log(`✅ Fake Memory Database running at: ${dbUrl}`);
      await addFakeUsers();
    } catch (memoryErr) {
      console.error(`❌ Fake DB failed too: ${memoryErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = startMyDatabase;
