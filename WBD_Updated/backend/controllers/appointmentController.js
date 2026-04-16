const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { createNotification } = require("./notificationController");
const { geocodeAddress, reverseGeocode, buildFullAddress } = require("../services/geocodingService");
const { calculateDistances, haversineDistance } = require("../services/distanceService");
const { bumpNamespaceVersion } = require("../services/cacheService");

// @desc    Get all appointments with filters
// @route   GET /api/appointments
// @access  Private (Admin)
exports.getAllAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      veterinary,
      customer,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (veterinary) query.veterinary = veterinary;
    if (customer) query.customer = customer;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate("customer", "name email phoneNumber")
      .populate("veterinary", "name email phoneNumber vetInfo")
      .populate("cancelledBy", "name role")
      .sort("-date")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalAppointments: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message,
    });
  }
};

// @desc    Get appointments for logged in customer
// @route   GET /api/appointments/my-appointments
// @access  Private (Customer)
exports.getMyAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user._id };
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate("veterinary", "name email phoneNumber vetInfo profilePicture")
      .populate("cancelledBy", "name role")
      .sort("-date")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalAppointments: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message,
    });
  }
};

// @desc    Get appointments for logged in veterinary
// @route   GET /api/appointments/vet/my-appointments
// @access  Private (Veterinary)
exports.getVetAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;

    const query = { veterinary: req.user._id };
    if (status) query.status = status;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate("customer", "name email phoneNumber profilePicture")
      .populate("cancelledBy", "name role")
      .sort("date timeSlot")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalAppointments: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message,
    });
  }
};

// @desc    Get single appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("customer", "name email phoneNumber address profilePicture")
      .populate("veterinary", "name email phoneNumber vetInfo profilePicture")
      .populate("cancelledBy", "name role");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const isCustomer =
      appointment.customer._id.toString() === req.user._id.toString();
    const isVeterinary =
      appointment.veterinary._id.toString() === req.user._id.toString();
    const isAdmin = ["admin", "co-admin"].includes(req.user.role);

    if (!isCustomer && !isVeterinary && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this appointment",
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointment",
      error: error.message,
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (Customer)
exports.createAppointment = async (req, res) => {
  try {
    // Only customers can book appointments
    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can book appointments",
      });
    }

    const { veterinary, petName, petType, petAge, date, timeSlot, reason, consultationMode, customerAddress, isEmergency } =
      req.body;

    const vet = await User.findById(veterinary);
    if (!vet || vet.role !== "veterinary" || !vet.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Invalid or unapproved veterinary selected",
      });
    }

    // Parse timeSlot - can be string "09:00-10:00" or object {start, end}
    let timeSlotObj;
    if (typeof timeSlot === "string") {
      const [start, end] = timeSlot.split("-");
      timeSlotObj = {
        start: start.trim(),
        end: end ? end.trim() : start.trim(),
      };
    } else if (timeSlot && timeSlot.start) {
      timeSlotObj = timeSlot;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot format",
      });
    }

    const existingAppointment = await Appointment.findOne({
      veterinary,
      date: new Date(date),
      "timeSlot.start": timeSlotObj.start,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    // Normalize petType to lowercase
    const normalizedPetType = petType ? petType.toLowerCase() : "other";

    // Determine consultation fee based on mode
    const mode = consultationMode || "in-clinic";
    let consultationFee;
    if (vet.vetInfo?.consultationFees && vet.vetInfo.consultationFees[mode]) {
      consultationFee = vet.vetInfo.consultationFees[mode];
    } else {
      consultationFee = vet.vetInfo?.consultationFee || 500;
    }

    // Validate home-visit: check if customer is within radius
    if (mode === "home-visit" && customerAddress?.coordinates) {
      const vetCoords = vet.vetInfo?.coordinates?.coordinates;
      if (vetCoords && vetCoords[0] !== 0 && vetCoords[1] !== 0) {
        const dist = haversineDistance(
          customerAddress.coordinates[1],
          customerAddress.coordinates[0],
          vetCoords[1],
          vetCoords[0]
        );
        const maxRadius = vet.vetInfo?.homeVisitRadius || 10;
        if (dist > maxRadius) {
          return res.status(400).json({
            success: false,
            message: `You are ${dist.toFixed(1)} km away. This vet only provides home visits within ${maxRadius} km.`,
          });
        }
      }
    }

    const appointment = await Appointment.create({
      customer: req.user._id,
      veterinary,
      petName,
      petType: normalizedPetType,
      petAge: petAge || "",
      date: new Date(date),
      timeSlot: timeSlotObj,
      reason: reason || "General Checkup",
      consultationFee,
      consultationMode: mode,
      customerAddress: mode === "home-visit" ? customerAddress : undefined,
      isEmergency: isEmergency || false,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("customer", "name email phoneNumber")
      .populate("veterinary", "name email vetInfo");

    // Notify customer about appointment booking
    await createNotification({
      recipient: req.user._id,
      type: "appointment_booked",
      title: "Appointment Booked",
      message: `Your appointment for ${petName} with Dr. ${populatedAppointment.veterinary?.name || 'Vet'} on ${new Date(date).toLocaleDateString()} has been booked successfully`,
      relatedModel: "Appointment",
      relatedId: appointment._id,
      link: `/appointments/${appointment._id}`,
    });

    // Notify vet about new appointment
    await createNotification({
      recipient: veterinary,
      type: "appointment_booked",
      title: "New Appointment",
      message: `New appointment booked for ${petName} by ${req.user.name} on ${new Date(date).toLocaleDateString()}`,
      relatedModel: "Appointment",
      relatedId: appointment._id,
      link: `/vet/appointments`,
    });

    bumpNamespaceVersion("appointments").catch(() => {});
    bumpNamespaceVersion("dashboard").catch(() => {});

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: populatedAppointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating appointment",
      error: error.message,
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private (Customer)
exports.updateAppointment = async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this appointment",
      });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only update pending appointments",
      });
    }

    if (req.body.date || req.body.timeSlot) {
      const checkDate = req.body.date
        ? new Date(req.body.date)
        : appointment.date;
      const checkTimeSlot = req.body.timeSlot || appointment.timeSlot;

      const existingAppointment = await Appointment.findOne({
        _id: { $ne: req.params.id },
        veterinary: appointment.veterinary,
        date: checkDate,
        timeSlot: checkTimeSlot,
        status: { $in: ["pending", "confirmed"] },
      });

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: "This time slot is already booked",
        });
      }
    }

    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("veterinary", "name email vetInfo");

    bumpNamespaceVersion("appointments").catch(() => {});
    bumpNamespaceVersion("dashboard").catch(() => {});

    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating appointment",
      error: error.message,
    });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private (Veterinary only)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes, paymentStatus } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const isVeterinary =
      appointment.veterinary.toString() === req.user._id.toString();

    if (!isVeterinary) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned veterinarian can update appointment status",
      });
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "in-progress",
      "completed",
      "cancelled",
      "no-show",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    if (status) appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;

    // Notify customer about appointment status change
    if (status) {
      const statusMessages = {
        confirmed: `Your appointment has been confirmed`,
        "in-progress": `Your appointment is now in progress`,
        completed: `Your appointment has been completed`,
        cancelled: `Your appointment has been cancelled`,
        "no-show": `You were marked as no-show for your appointment`,
      };
      if (statusMessages[status]) {
        await createNotification({
          recipient: appointment.customer,
          type: status === "confirmed" ? "appointment_confirmed" : status === "completed" ? "appointment_completed" : status === "cancelled" ? "appointment_cancelled" : "appointment_status",
          title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: statusMessages[status],
          relatedModel: "Appointment",
          relatedId: appointment._id,
          link: `/appointments/${appointment._id}`,
        });
      }
    }

    // Update payment status if provided
    if (paymentStatus) {
      const validPaymentStatuses = ["pending", "paid", "refunded"];
      if (validPaymentStatuses.includes(paymentStatus)) {
        appointment.paymentStatus = paymentStatus;
      }
    }

    // Auto-mark as paid when completed
    if (status === "completed") {
      appointment.paymentStatus = "paid";
    }

    // Record revenue when payment becomes "paid" (whether from status=completed or manual payment update)
    const shouldRecordRevenue =
      appointment.paymentStatus === "paid" &&
      !appointment._revenueRecorded;

    // Check if revenue was already recorded for this appointment
    if (shouldRecordRevenue) {
      const Transaction = require("../models/Transaction");
      const Revenue = require("../models/Revenue");

      const existingTransaction = await Transaction.findOne({ appointment: appointment._id });
      if (!existingTransaction) {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const periodIdentifier = today.toISOString().split("T")[0];

          let revenueRecord = await Revenue.findOne({ periodType: "daily", periodIdentifier });
          if (!revenueRecord) {
            revenueRecord = new Revenue({
              date: today, periodType: "daily", periodIdentifier,
              summary: { totalRevenue: 0, totalTax: 0, totalCommission: 0, totalPayouts: 0, totalOrders: 0, totalTransactions: 0 }
            });
          }

          // Get Vet's commission rate
          const vet = await User.findById(appointment.veterinary);
          const commissionRate = vet?.vetInfo?.commissionRate || 10;
          const commission = appointment.consultationFee * (commissionRate / 100);
          const vetNet = appointment.consultationFee - commission;

          // 1. Update Vet Balance
          if (vet) {
            vet.balance = (vet.balance || 0) + vetNet;
            await vet.save();
          }

          // 2. Transaction Ledger entry for the Appointment
          await Transaction.create({
            appointment: appointment._id,
            user: appointment.veterinary,
            type: "sale",
            amount: appointment.consultationFee,
            commission: commission,
            netAmount: vetNet,
            description: `Veterinary consultation: ${appointment.petName} (${appointment.reason || "General Checkup"})`
          });

          // 3. Update Global Revenue Record
          revenueRecord.appointments.totalAppointments += 1;
          revenueRecord.appointments.totalRevenue += appointment.consultationFee;
          revenueRecord.summary.totalRevenue += appointment.consultationFee;
          revenueRecord.summary.totalCommission += commission;
          revenueRecord.summary.totalTransactions += 1;

          // Add to veterinary breakdown in Revenue record
          const vetIndex = revenueRecord.appointments.byVeterinary.findIndex(
            (v) => v.veterinary && v.veterinary.toString() === appointment.veterinary.toString()
          );

          if (vetIndex === -1) {
            revenueRecord.appointments.byVeterinary.push({
              veterinary: appointment.veterinary,
              name: vet?.name || "Unknown",
              count: 1,
              revenue: appointment.consultationFee,
            });
          } else {
            revenueRecord.appointments.byVeterinary[vetIndex].count += 1;
            revenueRecord.appointments.byVeterinary[vetIndex].revenue +=
              appointment.consultationFee;
          }

          await revenueRecord.save();
        } catch (revErr) {
          console.error("Appointment revenue recording error:", revErr);
        }
      }
    }

    await appointment.save();

    bumpNamespaceVersion("appointments").catch(() => {});
    bumpNamespaceVersion("dashboard").catch(() => {});

    res.json({
      success: true,
      message: "Appointment status updated",
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating appointment status",
      error: error.message,
    });
  }
};

// @desc    Cancel appointment
// @route   POST /api/appointments/:id/cancel
// @access  Private (Customer/Veterinary only)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("customer", "name email")
      .populate("veterinary", "name email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const isCustomer =
      appointment.customer._id.toString() === req.user._id.toString();
    const isVeterinary =
      appointment.veterinary._id.toString() === req.user._id.toString();

    if (!isCustomer && !isVeterinary) {
      return res.status(403).json({
        success: false,
        message: "Only the customer or the assigned veterinarian can cancel this appointment",
      });
    }

    if (["cancelled", "completed"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${appointment.status} appointment`,
      });
    }

    appointment.status = "cancelled";
    appointment.cancelledBy = req.user._id;
    appointment.cancelledByRole = req.user.role;
    await appointment.save();

    bumpNamespaceVersion("appointments").catch(() => {});
    bumpNamespaceVersion("dashboard").catch(() => {});

    // Send notifications based on who cancelled
    try {
      if (isCustomer) {
        // Notify the veterinary that customer cancelled
        await createNotification(
          appointment.veterinary._id,
          "appointment",
          `Appointment cancelled by customer ${appointment.customer.name} for ${appointment.petName} on ${new Date(appointment.date).toLocaleDateString()}`,
          appointment._id,
          "Appointment"
        );
      } else if (isVeterinary) {
        // Notify the customer that vet cancelled
        await createNotification(
          appointment.customer._id,
          "appointment",
          `Your appointment with Dr. ${appointment.veterinary.name} for ${appointment.petName} on ${new Date(appointment.date).toLocaleDateString()} has been cancelled by the veterinarian`,
          appointment._id,
          "Appointment"
        );
      }
    } catch (notifErr) {
      console.error("Cancel notification error:", notifErr);
    }

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error.message,
    });
  }
};

// @desc    Get available time slots
// @route   GET /api/appointments/available-slots
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { veterinary, date } = req.query;

    if (!veterinary || !date) {
      return res.status(400).json({
        success: false,
        message: "Veterinary ID and date are required",
      });
    }

    // Fetch the veterinary's profile to get their available time slots and days
    const vet = await User.findById(veterinary).select("vetInfo");
    
    if (!vet) {
      return res.status(404).json({
        success: false,
        message: "Veterinary not found",
      });
    }

    // Get the day of the week for the requested date
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString("en-US", { weekday: "long" });

    // Check if the vet is available on this day
    const vetAvailableDays = vet.vetInfo?.availableDays || [];
    if (vetAvailableDays.length > 0 && !vetAvailableDays.includes(dayOfWeek)) {
      return res.json({
        success: true,
        data: {
          date,
          dayOfWeek,
          isVetAvailable: false,
          message: `Veterinary is not available on ${dayOfWeek}`,
          allSlots: [],
          bookedSlots: [],
          availableSlots: [],
        },
      });
    }

    // Use vet's configured time slots, or default if not set
    const vetTimeSlots = vet.vetInfo?.availableTimeSlots || [];
    let allSlots;
    
    if (vetTimeSlots.length > 0) {
      // Use vet's configured slots
      allSlots = vetTimeSlots.map((slot) => `${slot.start}-${slot.end}`);
    } else {
      // Fallback to default slots if vet hasn't configured any
      allSlots = [
        "09:00-10:00",
        "10:00-11:00",
        "11:00-12:00",
        "12:00-13:00",
        "14:00-15:00",
        "15:00-16:00",
        "16:00-17:00",
        "17:00-18:00",
      ];
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      veterinary,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed"] },
    }).select("timeSlot");

    // Extract booked slot start times
    const bookedSlots = bookedAppointments.map((apt) => {
      if (typeof apt.timeSlot === "string") return apt.timeSlot;
      return `${apt.timeSlot?.start}-${apt.timeSlot?.end}`;
    });

    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    res.json({
      success: true,
      data: {
        date,
        dayOfWeek,
        isVetAvailable: true,
        vetAvailableDays,
        allSlots,
        bookedSlots,
        availableSlots,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching available slots",
      error: error.message,
    });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private (Admin)
exports.getAppointmentStats = async (req, res) => {
  try {
    const stats = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAppointments = await Appointment.countDocuments();
    const upcomingAppointments = await Appointment.countDocuments({
      date: { $gte: new Date() },
      status: { $in: ["pending", "confirmed"] },
    });

    res.json({
      success: true,
      data: {
        byStatus: stats,
        totalAppointments,
        upcomingAppointments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointment statistics",
      error: error.message,
    });
  }
};

// @desc    Get veterinary list with location-based search
// @route   GET /api/appointments/veterinaries
// @access  Public
exports.getVeterinaries = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 50,       // km, default 50
      city,
      specialization,
      consultationMode,
      minFee,
      maxFee,
      sortBy = "distance", // distance, fee, experience
    } = req.query;

    // Base filter: approved vets only
    const filter = {
      role: "veterinary",
      isApproved: true,
    };

    // City filter
    if (city) {
      filter["vetInfo.clinicAddress.city"] = { $regex: city, $options: "i" };
    }

    // Specialization filter
    if (specialization) {
      const specs = specialization.split(",").map((s) => s.trim());
      filter["vetInfo.specialization"] = { $in: specs.map((s) => new RegExp(s, "i")) };
    }

    // Consultation mode filter
    if (consultationMode) {
      filter["vetInfo.consultationModes"] = consultationMode;
    }

    // Fee range filter (on legacy consultationFee or in-clinic fee)
    if (minFee || maxFee) {
      filter["vetInfo.consultationFee"] = {};
      if (minFee) filter["vetInfo.consultationFee"].$gte = parseFloat(minFee);
      if (maxFee) filter["vetInfo.consultationFee"].$lte = parseFloat(maxFee);
    }

    let veterinaries = await User.find(filter)
      .select("name email phone phoneNumber vetInfo profilePicture")
      .lean();

    // If customer location provided, calculate distances
    const customerLat = parseFloat(lat);
    const customerLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    if (!isNaN(customerLat) && !isNaN(customerLng)) {
      // Filter out vets without valid coordinates
      const vetsWithCoords = veterinaries.filter((vet) => {
        const coords = vet.vetInfo?.coordinates?.coordinates;
        return coords && coords[0] !== 0 && coords[1] !== 0;
      });
      const vetsWithoutCoords = veterinaries.filter((vet) => {
        const coords = vet.vetInfo?.coordinates?.coordinates;
        return !coords || (coords[0] === 0 && coords[1] === 0);
      });

      // Calculate distances for vets that have coordinates
      const vetsWithDistance = await calculateDistances(
        { lat: customerLat, lng: customerLng },
        vetsWithCoords
      );

      // Filter by radius
      const vetsInRadius = vetsWithDistance.filter(
        (vet) => vet._distance <= searchRadius
      );

      // Add vets without coordinates at the end (so they still show up)
      const vetsNoCoordsMapped = vetsWithoutCoords.map((vet) => ({
        ...vet,
        _distance: null,
        _duration: null,
        _distanceType: "unknown",
      }));

      veterinaries = [...vetsInRadius, ...vetsNoCoordsMapped];

      // Sort
      if (sortBy === "distance") {
        veterinaries.sort((a, b) => {
          if (a._distance === null) return 1;
          if (b._distance === null) return -1;
          return a._distance - b._distance;
        });
      } else if (sortBy === "fee") {
        veterinaries.sort(
          (a, b) =>
            (a.vetInfo?.consultationFee || 0) -
            (b.vetInfo?.consultationFee || 0)
        );
      } else if (sortBy === "experience") {
        veterinaries.sort(
          (a, b) =>
            (b.vetInfo?.experience || 0) - (a.vetInfo?.experience || 0)
        );
      }
    } else {
      // No customer location - just add null distance
      veterinaries = veterinaries.map((vet) => ({
        ...vet,
        _distance: null,
        _duration: null,
        _distanceType: "unknown",
      }));

      // Sort by experience if no location
      if (sortBy === "experience") {
        veterinaries.sort(
          (a, b) =>
            (b.vetInfo?.experience || 0) - (a.vetInfo?.experience || 0)
        );
      } else if (sortBy === "fee") {
        veterinaries.sort(
          (a, b) =>
            (a.vetInfo?.consultationFee || 0) -
            (b.vetInfo?.consultationFee || 0)
        );
      }
    }

    res.json({
      success: true,
      data: veterinaries,
      total: veterinaries.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching veterinaries",
      error: error.message,
    });
  }
};

// @desc    Geocode and update vet address
// @route   POST /api/appointments/vet/update-address
// @access  Private (Veterinary)
exports.updateVetAddress = async (req, res) => {
  try {
    const { clinicAddress, lat, lng, consultationModes, consultationFees, homeVisitRadius, isEmergencyAvailable } = req.body;

    if (!clinicAddress || !clinicAddress.city) {
      return res.status(400).json({
        success: false,
        message: "City is required in clinic address",
      });
    }

    const fullAddress = buildFullAddress(clinicAddress);

    const updateData = {
      "vetInfo.clinicAddress": clinicAddress,
      "vetInfo.fullAddress": fullAddress,
    };

    // Use directly provided coordinates if available, otherwise geocode
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      updateData["vetInfo.coordinates"] = {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON: [lng, lat]
      };
    } else {
      // Fallback to geocoding from address text
      const geoResult = await geocodeAddress(clinicAddress);
      if (geoResult) {
        updateData["vetInfo.coordinates"] = {
          type: "Point",
          coordinates: [geoResult.lng, geoResult.lat],
        };
      }
    }

    if (consultationModes) {
      updateData["vetInfo.consultationModes"] = consultationModes;
    }

    if (consultationFees) {
      updateData["vetInfo.consultationFees"] = consultationFees;
      // Also update legacy consultationFee to the in-clinic fee
      updateData["vetInfo.consultationFee"] =
        consultationFees["in-clinic"] ||
        consultationFees["home-visit"] ||
        consultationFees["video-consultation"] ||
        0;
    }

    if (homeVisitRadius !== undefined) {
      updateData["vetInfo.homeVisitRadius"] = homeVisitRadius;
    }

    if (isEmergencyAvailable !== undefined) {
      updateData["vetInfo.isEmergencyAvailable"] = isEmergencyAvailable;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select("-password");

    const hasCoordinates = !!updateData["vetInfo.coordinates"];

    res.json({
      success: true,
      message: hasCoordinates
        ? "Address and location updated successfully"
        : "Address updated but location could not be determined. Your clinic may not appear in location searches.",
      data: user,
      geocoded: hasCoordinates,
      coordinates: updateData["vetInfo.coordinates"]
        ? {
            lat: updateData["vetInfo.coordinates"].coordinates[1],
            lng: updateData["vetInfo.coordinates"].coordinates[0],
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating vet address",
      error: error.message,
    });
  }
};

// @desc    Reverse geocode coordinates (for frontend location detection)
// @route   GET /api/appointments/reverse-geocode
// @access  Public
exports.reverseGeocodeLocation = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required",
      });
    }

    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));

    if (result) {
      res.json({ success: true, data: result });
    } else {
      res.json({
        success: true,
        data: { city: "Unknown", state: "", displayName: "" },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error reverse geocoding",
      error: error.message,
    });
  }
};
