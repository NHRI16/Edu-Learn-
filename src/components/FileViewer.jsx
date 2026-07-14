import { FileText, AlertCircle } from 'lucide-react';
import './FileViewer.css';

export default function FileViewer({ fileUrl, fileType, fileName }) {
  if (!fileUrl) {
    return (
      <div className="file-viewer__error">
        <AlertCircle size={48} />
        <p>File tidak ditemukan</p>
      </div>
    );
  }

  if (fileType === 'pdf') {
    return (
      <div className="file-viewer file-viewer--pdf">
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=0`}
          title={fileName}
          className="file-viewer__iframe"
        />
        <div className="file-viewer__fallback">
          <FileText size={24} />
          <span>Tidak bisa menampilkan PDF?</span>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            Buka di tab baru
          </a>
        </div>
      </div>
    );
  }

  if (fileType === 'image') {
    return (
      <div className="file-viewer file-viewer--image">
        <img
          src={fileUrl}
          alt={fileName}
          className="file-viewer__image"
          loading="lazy"
        />
      </div>
    );
  }

  if (fileType === 'video') {
    return (
      <div className="file-viewer file-viewer--video">
        <video
          src={fileUrl}
          controls
          className="file-viewer__video"
          controlsList="nodownload"
          preload="metadata"
        >
          Browser Anda tidak mendukung pemutaran video.
        </video>
      </div>
    );
  }

  return (
    <div className="file-viewer__error">
      <AlertCircle size={48} />
      <p>Tipe file tidak didukung</p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary btn-sm"
      >
        Download File
      </a>
    </div>
  );
}
