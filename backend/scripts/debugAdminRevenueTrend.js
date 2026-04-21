/*
  Debug script: compute the same revenue-trend data used by Admin dashboard.
  Usage:
    node scripts/debugAdminRevenueTrend.js 30
*/

require("dotenv").config();
const connectDB = require("../config/db");
const Order = require("../models/Order");
const Appointment = require("../models/Appointment");

const toDayKey = (date) => new Date(date).toISOString().slice(0, 10);

async function main() {
  const days = Number(process.argv[2] || 30);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  await connectDB();

  const deliveredOrders = await Order.find({
    status: "delivered",
    createdAt: { $gte: startDate },
  })
    .select("subtotal total tax shipping createdAt updatedAt")
    .lean();

  let gmv = 0;
  let platformCommission = 0;
  for (const order of deliveredOrders) {
    gmv += order.total || 0;
    platformCommission += (order.subtotal || 0) * 0.1;
  }

  const trendMap = new Map();
  for (const order of deliveredOrders) {
    const dayKey = toDayKey(order.createdAt || order.updatedAt);
    const orderRevenue = (order.subtotal || 0) * 0.1;
    const existing = trendMap.get(dayKey);
    if (!existing) {
      trendMap.set(dayKey, {
        _id: dayKey,
        orderRevenue,
        appointmentRevenue: 0,
        revenue: orderRevenue,
      });
    } else {
      existing.orderRevenue += orderRevenue;
      existing.revenue = existing.orderRevenue + existing.appointmentRevenue;
    }
  }

  const appointmentRevenueByDay = await Appointment.aggregate([
    {
      $addFields: {
        trendDate: { $ifNull: ["$updatedAt", "$createdAt"] },
      },
    },
    {
      $match: {
        paymentStatus: "paid",
        status: "completed",
        trendDate: { $gte: startDate },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "veterinary",
        foreignField: "_id",
        as: "vetDetails",
      },
    },
    { $unwind: { path: "$vetDetails", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        commissionRate: {
          $ifNull: ["$vetDetails.vetInfo.commissionRate", 10],
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$trendDate" },
        },
        commission: {
          $sum: {
            $multiply: [
              "$consultationFee",
              { $divide: ["$commissionRate", 100] },
            ],
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  let appointmentCommission = 0;
  for (const row of appointmentRevenueByDay) {
    const key = row._id;
    const value = row.commission || 0;
    appointmentCommission += value;

    const existing = trendMap.get(key);
    if (!existing) {
      trendMap.set(key, {
        _id: key,
        orderRevenue: 0,
        appointmentRevenue: value,
        revenue: value,
      });
    } else {
      existing.appointmentRevenue = value;
      existing.revenue = (existing.orderRevenue || 0) + (existing.appointmentRevenue || 0);
    }
  }

  const revenueTrend = Array.from(trendMap.values()).sort((a, b) =>
    String(a._id).localeCompare(String(b._id))
  );

  const totalPlatformRevenue = platformCommission + appointmentCommission;

  console.log("--- Admin Revenue Trend Debug ---");
  console.log(`Period: last ${days} days (from ${startDate.toISOString()})`);
  console.log(`Delivered orders in period: ${deliveredOrders.length}`);
  console.log(`GMV (delivered): ₹${Math.round(gmv).toLocaleString()}`);
  console.log(`Seller commission (10%): ₹${Math.round(platformCommission).toLocaleString()}`);
  console.log(`Appointment commission: ₹${Math.round(appointmentCommission).toLocaleString()}`);
  console.log(`Total platform revenue: ₹${Math.round(totalPlatformRevenue).toLocaleString()}`);
  console.log(`Trend points: ${revenueTrend.length}`);
  console.log("Sample points:");
  console.log(revenueTrend.slice(0, 7));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
