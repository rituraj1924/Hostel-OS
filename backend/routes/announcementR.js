const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { auth, authorize } = require('../middleware/authmiddleware')

// Simple in-schema Announcement model
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  audience: { type: String, default: 'All Residents' },
  priority: { type: String, enum: ['normal', 'urgent', 'info'], default: 'normal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema)

// GET /api/announcements — list all (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const announcements = await Announcement.find()
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    const total = await Announcement.countDocuments()
    res.json({ success: true, announcements, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/announcements — create (admin/warden only)
router.post('/', auth, authorize('admin', 'warden'), async (req, res) => {
  try {
    const { title, message, audience, priority } = req.body
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message required' })
    const ann = await Announcement.create({ title, message, audience, priority, createdBy: req.user._id })
    await ann.populate('createdBy', 'name role')
    res.status(201).json({ success: true, announcement: ann })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// DELETE /api/announcements/:id
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
