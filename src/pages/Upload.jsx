import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Upload as UploadIcon,
  FileText,
  Image,
  Video,
  X,
  CheckCircle,
  CloudUpload,
} from 'lucide-react';
import './Upload.css';

const ACCEPTED_TYPES = {
  pdf: {
    mimes: ['application/pdf'],
    extensions: '.pdf',
    label: 'PDF',
    icon: FileText,
  },
  image: {
    mimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: '.jpg,.jpeg,.png,.gif,.webp',
    label: 'Gambar',
    icon: Image,
  },
  video: {
    mimes: ['video/mp4', 'video/webm', 'video/quicktime'],
    extensions: '.mp4,.webm,.mov',
    label: 'Video',
    icon: Video,
  },
};

function getFileType(file) {
  if (!file) return null;
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return null;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileType = file ? getFileType(file) : null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    const type = getFileType(selectedFile);

    if (!type) {
      setError('Tipe file tidak didukung. Gunakan PDF, gambar (JPG/PNG/GIF/WebP), atau video (MP4/WebM).');
      return;
    }

    // Max 50MB
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('Ukuran file maksimal 50MB.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 15, 85));
      }, 200);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      setProgress(90);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase.from('materials').insert({
        title: title.trim(),
        description: description.trim() || null,
        file_url: urlData.publicUrl,
        file_type: fileType,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      setProgress(100);
      setSuccess(true);

      // Redirect after success animation
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Gagal mengupload file. Silakan coba lagi.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="upload-success animate-fade-in-up">
        <div className="upload-success__icon">
          <CheckCircle size={56} />
        </div>
        <h2>Upload Berhasil! 🎉</h2>
        <p>Materi Anda telah berhasil diupload dan tersedia untuk siswa.</p>
        <p className="upload-success__redirect">Mengalihkan ke dashboard...</p>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <div className="upload-page__header">
        <h1>
          <UploadIcon size={28} />
          Upload Materi
        </h1>
        <p>Bagikan materi pembelajaran untuk siswa Anda.</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        {/* Drop zone */}
        <div
          className={`drop-zone ${dragActive ? 'drop-zone--active' : ''} ${file ? 'drop-zone--has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov"
            onChange={handleFileSelect}
            hidden
          />

          {file ? (
            <div className="drop-zone__file">
              <div className="drop-zone__file-icon">
                {fileType === 'pdf' && <FileText size={32} />}
                {fileType === 'image' && <Image size={32} />}
                {fileType === 'video' && <Video size={32} />}
              </div>
              <div className="drop-zone__file-info">
                <span className="drop-zone__file-name">{file.name}</span>
                <span className="drop-zone__file-size">
                  {formatFileSize(file.size)} · {ACCEPTED_TYPES[fileType]?.label}
                </span>
              </div>
              <button
                type="button"
                className="drop-zone__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="drop-zone__placeholder">
              <CloudUpload size={48} />
              <p className="drop-zone__text">
                Drag & drop file di sini atau <span>pilih file</span>
              </p>
              <p className="drop-zone__hint">
                PDF, Gambar (JPG/PNG/GIF/WebP), atau Video (MP4/WebM) · Maks. 50MB
              </p>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="title">Judul Materi *</label>
          <input
            id="title"
            type="text"
            className="form-input"
            placeholder="Masukkan judul materi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Deskripsi (opsional)</label>
          <textarea
            id="description"
            className="form-input"
            placeholder="Deskripsi singkat tentang materi ini..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="upload-progress">
            <div className="upload-progress__bar">
              <div
                className="upload-progress__fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="upload-progress__text">
              {progress < 100 ? `Mengupload... ${Math.round(progress)}%` : 'Selesai!'}
            </span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={!file || !title.trim() || uploading}
        >
          {uploading ? (
            <>
              <div className="spinner" />
              Mengupload...
            </>
          ) : (
            <>
              <UploadIcon size={20} />
              Upload Materi
            </>
          )}
        </button>
      </form>
    </div>
  );
}
