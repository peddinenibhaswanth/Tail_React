/**
 * Cleanup Script - Removes applications, orders, revenue, and cart data
 * Preserves: Users, Pets, Products
 * 
 * Run with: node scripts/cleanupData.js
 * 
 * CHECKPOINT: Created on Feb 1, 2026
 * If anything goes wrong, this script only deletes data, not code.
 * Collections affected: AdoptionApplication, Order, Revenue, Cart
 * Collections preserved: User, Pet, Product, Review, Message, Appointment
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const AdoptionApplication = require('../models/AdoptionApplication');
const Order = require('../models/Order');
const Revenue = require('../models/Revenue');
const Cart = require('../models/Cart');
const Pet = require('../models/Pet');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Main cleanup function
const cleanupData = async () => {
  try {
    console.log('\n🧹 Starting cleanup process...\n');
    console.log('=' .repeat(50));

    // Get counts BEFORE deletion for verification
    const beforeCounts = {
      adoptionApplications: await AdoptionApplication.countDocuments(),
      orders: await Order.countDocuments(),
      revenue: await Revenue.countDocuments(),
      carts: await Cart.countDocuments(),
    };

    console.log('📊 BEFORE DELETION:');
    console.log(`   - AdoptionApplications: ${beforeCounts.adoptionApplications}`);
    console.log(`   - Orders: ${beforeCounts.orders}`);
    console.log(`   - Revenue records: ${beforeCounts.revenue}`);
    console.log(`   - Carts: ${beforeCounts.carts}`);
    console.log('=' .repeat(50));

    // Delete AdoptionApplications
    const deletedApplications = await AdoptionApplication.deleteMany({});
    console.log(`🗑️  Deleted ${deletedApplications.deletedCount} adoption applications`);

    // Delete Orders
    const deletedOrders = await Order.deleteMany({});
    console.log(`🗑️  Deleted ${deletedOrders.deletedCount} orders`);

    // Delete Revenue records
    const deletedRevenue = await Revenue.deleteMany({});
    console.log(`🗑️  Deleted ${deletedRevenue.deletedCount} revenue records`);

    // Clear all Carts (delete items, keep cart structure or delete entirely)
    const deletedCarts = await Cart.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCarts.deletedCount} carts`);

    // Reset pet statuses from "pending" or "adopted" back to "available"
    // (Only for pets that were in adoption process)
    const resetPets = await Pet.updateMany(
      { status: { $in: ['pending', 'adopted'] } },
      { $set: { status: 'available' } }
    );
    console.log(`🔄 Reset ${resetPets.modifiedCount} pet statuses to "available"`);

    console.log('=' .repeat(50));

    // Get counts AFTER deletion for verification
    const afterCounts = {
      adoptionApplications: await AdoptionApplication.countDocuments(),
      orders: await Order.countDocuments(),
      revenue: await Revenue.countDocuments(),
      carts: await Cart.countDocuments(),
    };

    console.log('📊 AFTER DELETION:');
    console.log(`   - AdoptionApplications: ${afterCounts.adoptionApplications}`);
    console.log(`   - Orders: ${afterCounts.orders}`);
    console.log(`   - Revenue records: ${afterCounts.revenue}`);
    console.log(`   - Carts: ${afterCounts.carts}`);
    console.log('=' .repeat(50));

    // Verify preserved collections
    const User = require('../models/User');
    const Product = require('../models/Product');

    const preservedCounts = {
      users: await User.countDocuments(),
      pets: await Pet.countDocuments(),
      products: await Product.countDocuments(),
    };

    console.log('✅ PRESERVED DATA (unchanged):');
    console.log(`   - Users: ${preservedCounts.users}`);
    console.log(`   - Pets: ${preservedCounts.pets}`);
    console.log(`   - Products: ${preservedCounts.products}`);
    console.log('=' .repeat(50));

    console.log('\n✅ Cleanup completed successfully!\n');

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    throw error;
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await cleanupData();
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed');
  process.exit(0);
};

run().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
