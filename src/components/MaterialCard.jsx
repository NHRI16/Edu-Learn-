import { useNavigate } from 'react-router-dom';
import { FileText, Image, Video, Clock, User } from 'lucide-react';
import './MaterialCard.css';

const typeConfig = {
  pdf: { icon: FileText, color: '#ef4444', label: 'PDF', badgeClass: 'badge-pdf' },
  image: { icon: Image, color: '#10b981', label: 'Gambar', badgeClass: 'badge-image' },
  video: { icon: Video, color: '#a855f7', label: 'Video', badgeClass: 'badge-video' },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export default function MaterialCard({ material, uploaderName }) {
  const navigate = useNavigate();
  const config = typeConfig[material.file_type] || typeConfig.pdf;
  const Icon = config.icon;

  return (
    <article
      className="material-card card"
      onClick={() => navigate(`/material/${material.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/material/${material.id}`);
      }}
    >
      <div className="material-card__icon" style={{ '--icon-color': config.color }}>
        <Icon size={28} />
      </div>

      <div className="material-card__body">
        <div className="material-card__header">
          <span className={`badge ${config.badgeClass}`}>{config.label}</span>
          {material.file_size && (
            <span className="material-card__size">{formatFileSize(material.file_size)}</span>
          )}
        </div>

        <h3 className="material-card__title">{material.title}</h3>

        {material.description && (
          <p className="material-card__desc">{material.description}</p>
        )}

        <div className="material-card__meta">
          <span className="material-card__meta-item">
            <User size={14} />
            {uploaderName || 'Unknown'}
          </span>
          <span className="material-card__meta-item">
            <Clock size={14} />
            {formatDate(material.created_at)}
          </span>
        </div>
      </div>
    </article>
  );
}
