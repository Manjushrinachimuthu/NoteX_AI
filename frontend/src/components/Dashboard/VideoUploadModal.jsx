import { useState } from 'react'
import { api } from '../../services/api'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'auto', name: 'Auto Detect' }
]

const VideoUploadModal = ({ onClose, onUploadComplete }) => {
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('auto')
  const [videoFile, setVideoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file')
        return
      }
      if (file.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB')
        return
      }
      setVideoFile(file)
      setError('')
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
      setError('')
    } else {
      setError('Please select a valid video file')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!videoFile) {
      setError('Please select a video file')
      return
    }
    setLoading(true)
    setError('')

    try {
      const meeting = await api.uploadVideo(videoFile, title || 'Uploaded Video', language)
      // Attach language so Dashboard can pass it to processVideo
      onUploadComplete({ ...meeting, language })
    } catch (err) {
      setError(err.message || 'Failed to upload video')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Upload Video</h2>
        <p className="modal-subtitle">Upload a video to generate meeting notes</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Video File</label>
            <div
              className={`file-drop-zone ${dragActive ? 'active' : ''} ${videoFile ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {videoFile ? (
                <div className="selected-file">
                  <span className="file-icon">🎬</span>
                  <span className="file-name">{videoFile.name}</span>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={(e) => {
                      e.preventDefault()
                      setVideoFile(null)
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <span className="upload-icon">📁</span>
                  <span>Drag and drop video here or</span>
                  <label className="browse-btn">
                    Browse
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      hidden
                    />
                  </label>
                </>
              )}
            </div>
            <small className="file-hint">Supported: MP4, WebM, Ogg (Max 500MB)</small>
          </div>

          <div className="form-group">
            <label>Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter video title"
            />
          </div>

          <div className="form-group">
            <label>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={loading || !videoFile}>
              {loading ? 'Uploading...' : 'Upload & Generate Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VideoUploadModal
