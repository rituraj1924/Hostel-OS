const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { auth, authorize } = require('../middleware/authmiddleware')

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'global' },
  emailNotifications: { type: Boolean, default: true },
  autoApproveVisitors: { type: Boolean, default: false },
  maintenanceMode: { type: Boolean, default: false },
  maxVisitorDuration: { type: Number, default: 4 },
  lateFeePerDay: { type: Number, default: 50 },
  maxRoomCapacity: { type: Number, default: 4 },
  hostelName: { type: String, default: 'Smart Hostel' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
}, { timestamps: true })

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema)

// GET /api/settings
router.get('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' })
    if (!settings) settings = await Settings.create({ key: 'global' })
    res.json({ success: true, settings })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/settings
router.put('/', auth, authorize('admin'), async (req, res) => {
  try {
    const allowed = ['emailNotifications', 'autoApproveVisitors', 'maintenanceMode',
      'maxVisitorDuration', 'lateFeePerDay', 'maxRoomCapacity', 'hostelName', 'contactEmail', 'contactPhone']
    const update = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      update,
      { new: true, upsert: true }
    )
    res.json({ success: true, settings, message: 'Settings saved' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
