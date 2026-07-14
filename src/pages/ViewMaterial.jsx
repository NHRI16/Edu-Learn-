import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FileViewer from '../components/FileViewer';
import {
  ArrowLeft,
  Download,
  FileText,
  Image,
  Video,
  User,
  Clock,
  HardDrive,
} from 'lucide-react';
import './ViewMaterial.css';

const typeConfig = {
  pdf: { icon: FileText, label: 'PDF Document', color: '#ef4444' },
  image: { icon: Image, label: 'Image File', color: '#10b981' },
  video: { icon: Video, label: 'Video File', color: '#a855f7' },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

export default function ViewMaterial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [uploaderName, setUploaderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMaterial();
  }, [id]);

  const fetchMaterial = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Materi tidak ditemukan.');

      setMaterial(data);

      // Fetch uploader name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.uploaded_by)
        .single();

      setUploaderName(profile?.full_name || 'Unknown');
    } catch (err) {
      setError(err.message || 'Gagal memuat materi.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '50vh' }}>
        <div className="spinner spinner-lg" />
        <p>Memuat materi...</p>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="view-material__error">
        <h2>😕 Oops!</h2>
        <p>{error || 'Materi tidak ditemukan.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const config = typeConfig[material.file_type] || typeConfig.pdf;
  const Icon = config.icon;

  return (
    <div className="view-material">
      {/* Back button & header */}
      <div className="view-material__topbar">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Kembali
        </button>
        <a
          href={material.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          download
        >
          <Download size={16} />
          Download
        </a>
      </div>

      {/* Material info */}
      <div className="view-material__info animate-fade-in">
        <div className="view-material__type-badge" style={{ '--type-color': config.color }}>
          <Icon size={18} />
          <span>{config.label}</span>
        </div>
        <h1 className="view-material__title">{material.title}</h1>
        {material.description && (
          <p className="view-material__desc">{material.description}</p>
        )}
        <div className="view-material__meta">
          <span className="view-material__meta-item">
            <User size={15} />
            {uploaderName}
          </span>
          <span className="view-material__meta-item">
            <Clock size={15} />
            {formatDate(material.created_at)}
          </span>
          <span className="view-material__meta-item">
            <HardDrive size={15} />
            {formatFileSize(material.file_size)}
          </span>
        </div>
      </div>

      {/* File viewer */}
      <div className="view-material__viewer animate-fade-in-up">
        <FileViewer
          fileUrl={material.file_url}
          fileType={material.file_type}
          fileName={material.file_name}
        />
      </div>
    </div>
  );
}
