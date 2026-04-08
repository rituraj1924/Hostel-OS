const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { auth, authorize } = require('../middleware/authmiddleware')

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '../uploads/documents')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpeg', '.jpg', '.png']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) cb(null, true)
  else cb(new Error('Only PDF, JPEG, JPG, PNG allowed'), false)
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } })

const docSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: ['rules', 'finance', 'policy', 'mess', 'emergency', 'forms', 'other'], default: 'other' },
  fileType: String,
  fileName: String,
  filePath: String,
  fileSize: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  downloads: { type: Number, default: 0 },
}, { timestamps: true })

const Document = mongoose.models.Document || mongoose.model('Document', docSchema)

// GET /api/documents
router.get('/', auth, async (req, res) => {
  try {
    const docs = await Document.find().populate('uploadedBy', 'name role').sort({ createdAt: -1 })
    res.json({ success: true, documents: docs })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/documents — upload
router.post('/', auth, authorize('admin', 'warden'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    const { title, category } = req.body
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '')
    const sizeMB = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB'
    const doc = await Document.create({
      title: title || req.file.originalname,
      category: category || 'other',
      fileType: ext.toUpperCase(),
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: sizeMB,
      uploadedBy: req.user._id,
    })
    await doc.populate('uploadedBy', 'name role')
    res.status(201).json({ success: true, document: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Upload failed' })
  }
})

// PUT /api/documents/:id — update metadata
router.put('/:id', auth, authorize('admin', 'warden'), async (req, res) => {
  try {
    const { title, category } = req.body
    const doc = await Document.findByIdAndUpdate(req.params.id, { title, category }, { new: true })
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, document: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// DELETE /api/documents/:id
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' })
    if (doc.filePath && fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath)
    await doc.deleteOne()
    res.json({ success: true, message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/documents/:id/download
router.get('/:id/download', auth, async (req, res) => {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true })
    if (!doc || !doc.filePath) return res.status(404).json({ success: false, message: 'Not found' })
    res.download(doc.filePath, doc.title + path.extname(doc.filePath))
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
