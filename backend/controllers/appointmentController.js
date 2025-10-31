const Appointment = require("../models/Appointment");
const User = require("../models/User");

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
      .populate("veterinary", "name email phoneNumber vetInfo profilePicture");

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
    const { veterinary, petName, petType, petAge, date, timeSlot, reason } =
      req.body;

    const vet = await User.findById(veterinary);
    if (!vet || vet.role !== "veterinary" || !vet.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Invalid or unapproved veterinary selected",
      });
    }

    const existingAppointment = await Appointment.findOne({
      veterinary,
      date: new Date(date),
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    const appointment = await Appointment.create({
      customer: req.user._id,
      veterinary,
      petName,
      petType,
      petAge,
      date: new Date(date),
      timeSlot,
      reason,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("customer", "name email phoneNumber")
      .populate("veterinary", "name email vetInfo");

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
// @access  Private (Veterinary/Admin)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const isVeterinary =
      appointment.veterinary.toString() === req.user._id.toString();
    const isAdmin = ["admin", "co-admin"].includes(req.user.role);

    if (!isVeterinary && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this appointment",
      });
    }

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();

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
// @access  Private (Customer/Veterinary)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const isCustomer =
      appointment.customer.toString() === req.user._id.toString();
    const isVeterinary =
      appointment.veterinary.toString() === req.user._id.toString();
    const isAdmin = ["admin", "co-admin"].includes(req.user.role);

    if (!isCustomer && !isVeterinary && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this appointment",
      });
    }

    if (["cancelled", "completed"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${appointment.status} appointment`,
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

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

    const allSlots = [
      "09:00-10:00",
      "10:00-11:00",
      "11:00-12:00",
      "12:00-13:00",
      "13:00-14:00",
      "14:00-15:00",
      "15:00-16:00",
      "16:00-17:00",
      "17:00-18:00",
    ];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      veterinary,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed"] },
    }).select("timeSlot");

    const bookedSlots = bookedAppointments.map((apt) => apt.timeSlot);
    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    res.json({
      success: true,
      data: {
        date,
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

// @desc    Get veterinary list
// @route   GET /api/appointments/veterinaries
// @access  Public
exports.getVeterinaries = async (req, res) => {
  try {
    const veterinaries = await User.find({
      role: "veterinary",
      isApproved: true,
    }).select("name email phoneNumber vetInfo profilePicture");

    res.json({
      success: true,
      data: veterinaries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching veterinaries",
      error: error.message,
    });
  }
};
