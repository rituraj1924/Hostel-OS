import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import Modal from '../../components/ui/Modal'
import { FileText, Download, Search, Eye, Plus, Trash2, Edit2, Upload } from 'lucide-react'

const CATEGORIES = ['rules', 'finance', 'policy', 'mess', 'emergency', 'forms', 'other']
const categoryColors = {
  rules: 'bg-primary-fixed text-primary',
  finance: 'bg-tertiary-fixed text-tertiary',
  policy: 'bg-secondary-fixed text-secondary',
  mess: 'bg-green-100 text-green-700',
  emergency: 'bg-error-container text-error',
  forms: 'bg-surface-variant text-on-surface-variant',
  other: 'bg-surface-container text-on-surface-variant',
}
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const ALLOWED_EXT = '.pdf,.jpeg,.jpg,.png'

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', category: 'other' })
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: '', category: 'other' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const fetchDocs = useCallback(async () => {
    try {
      const res = await api.get('/documents')
      setDocs(res.data?.documents || [])
    } catch { setDocs([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleFileSelect = (file) => {
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|jpeg|jpg|png)$/i)) {
      toast.error('Only PDF, JPEG, JPG, PNG allowed'); return
    }
    setSelectedFile(file)
    if (!uploadForm.title) setUploadForm(f => ({ ...f, title: file.name.replace(/\.[^/.]+$/, '') }))
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) return toast.error('Please select a file')
    if (!uploadForm.title.trim()) return toast.error('Please enter a title')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('title', uploadForm.title)
      fd.append('category', uploadForm.category)
      await api.post('/documents', fd, { headers: { 'Content-Type': undefined } })
      toast.success('Document uploaded!')
      setShowUploadModal(false); setSelectedFile(null); setUploadForm({ title: '', category: 'other' })
      fetchDocs()
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/documents/${editDoc._id}`, editForm)
      toast.success('Document updated!')
      setShowEditModal(false)
      fetchDocs()
    } catch { toast.error('Update failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await api.delete(`/documents/${id}`)
      toast.success('Deleted')
      fetchDocs()
    } catch { toast.error('Delete failed') }
  }

  const handleDownload = async (doc) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const token = localStorage.getItem('shms_token')
      const res = await fetch(`${API_BASE}/documents/${doc._id}/download`, { headers: { Authorization: `Bearer ${token}` } })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = doc.title; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const filtered = docs.filter(d => d.title?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Documents Repository</h1>
          <p className="text-on-surface-variant text-sm mt-1">Upload and manage hostel documents</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="bg-primary-gradient text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input type="text" placeholder="Search documents..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
      </div>

      {loading ? <div className="text-center text-on-surface-variant py-8">Loading...</div> : filtered.length === 0 ? (
        <div className="text-center text-on-surface-variant py-12 bg-surface-container-lowest rounded-xl">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">{searchTerm ? 'No documents matched' : 'No documents yet. Upload your first one!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc._id} className="bg-surface-container-lowest p-6 rounded-xl soft-shadow card-3d group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${categoryColors[doc.category] || categoryColors.other}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-2 py-1 bg-surface-container rounded-full">{doc.fileType || 'DOC'}</span>
              </div>
              <h3 className="font-bold text-sm text-on-surface mb-1 group-hover:text-primary transition-colors line-clamp-2">{doc.title}</h3>
              <p className="text-xs text-on-surface-variant capitalize">{doc.category} • {doc.fileSize || '—'}</p>
              <p className="text-xs text-on-surface-variant">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
                <span className="text-xs text-on-surface-variant">{doc.downloads || 0} downloads</span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditDoc(doc); setEditForm({ title: doc.title, category: doc.category }); setShowEditModal(true) }}
                    className="p-2 hover:bg-surface-container rounded-lg transition-colors" title="Edit"><Edit2 className="w-4 h-4 text-on-surface-variant" /></button>
                  <button onClick={() => handleDownload(doc)} className="p-2 hover:bg-primary-fixed rounded-lg transition-colors" title="Download"><Download className="w-4 h-4 text-primary" /></button>
                  <button onClick={() => handleDelete(doc._id)} className="p-2 hover:bg-error/10 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4 text-error" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Document">
        <form onSubmit={handleUpload} className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-primary bg-primary-fixed' : 'border-outline-variant/40 hover:border-primary/50 hover:bg-surface-container'}`}
          >
            <input type="file" ref={fileRef} accept={ALLOWED_EXT} className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-primary opacity-70" />
            {selectedFile ? (
              <p className="text-sm font-bold text-primary">{selectedFile.name} ({(selectedFile.size/1024/1024).toFixed(2)} MB)</p>
            ) : (
              <>
                <p className="text-sm font-medium text-on-surface">Drop file here or click to browse</p>
                <p className="text-xs text-on-surface-variant mt-1">PDF, JPEG, JPG, PNG — max 10 MB</p>
              </>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Title</label>
            <input type="text" value={uploadForm.title} onChange={e => setUploadForm(f => ({...f, title: e.target.value}))} placeholder="Document title..." className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Category</label>
            <select value={uploadForm.category} onChange={e => setUploadForm(f => ({...f, category: e.target.value}))} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">Cancel</button>
            <button type="submit" disabled={uploading} className="flex-1 py-3 bg-primary-gradient text-white font-bold text-sm rounded-xl disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Document">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Title</label>
            <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({...f, title: e.target.value}))} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Category</label>
            <select value={editForm.category} onChange={e => setEditForm(f => ({...f, category: e.target.value}))} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-primary-gradient text-white font-bold text-sm rounded-xl">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
