import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  UserCircle,
  Camera,
  Save,
  Mail,
  Shield,
  Calendar,
  FileText,
  Image,
  Video,
  Trash2,
} from 'lucide-react';
import './Profile.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

export default function Profile() {
  const { user, profile, updateProfile, isGuru } = useAuth();
  const avatarInputRef = useRef(null);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [myMaterials, setMyMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user && isGuru) {
      fetchMyMaterials();
    } else {
      setLoadingMaterials(false);
    }
  }, [user, isGuru]);

  const fetchMyMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran foto maksimal 5MB.' });
      return;
    }

    setUploadingAvatar(true);
    setMessage({ type: '', text: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(urlData.publicUrl);
      await updateProfile({ avatar_url: urlData.publicUrl });
      setMessage({ type: 'success', text: 'Foto profil berhasil diperbarui!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengupload foto.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile({ full_name: fullName.trim() });
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan profil.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaterial = async (material) => {
    if (!confirm(`Hapus materi "${material.title}"?`)) return;

    try {
      // Delete from storage
      const urlParts = material.file_url.split('/materials/');
      if (urlParts[1]) {
        await supabase.storage
          .from('materials')
          .remove([decodeURIComponent(urlParts[1])]);
      }

      // Delete from database
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', material.id);

      if (error) throw error;

      setMyMaterials((prev) => prev.filter((m) => m.id !== material.id));
      setMessage({ type: 'success', text: 'Materi berhasil dihapus.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus materi.' });
    }
  };

  const typeIcons = {
    pdf: <FileText size={16} />,
    image: <Image size={16} />,
    video: <Video size={16} />,
  };

  return (
    <div className="profile-page">
      <h1>Profil Saya</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>
          <span>{message.text}</span>
        </div>
      )}

      <div className="profile-layout">
        {/* Profile card */}
        <div className="profile-card card animate-fade-in">
          <div className="profile-card__avatar-wrapper">
            <div className="profile-card__avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                <UserCircle size={64} />
              )}
            </div>
            <button
              className="profile-card__avatar-btn"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <div className="spinner" style={{ width: 16, height: 16 }} />
              ) : (
                <Camera size={16} />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              hidden
            />
          </div>

          <form onSubmit={handleSaveProfile} className="profile-card__form">
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Nama Lengkap</label>
              <input
                id="fullName"
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap Anda"
                required
              />
            </div>

            <div className="profile-card__info">
              <div className="profile-info-item">
                <Mail size={16} />
                <span>{user?.email}</span>
              </div>
              <div className="profile-info-item">
                <Shield size={16} />
                <span className={`badge ${isGuru ? 'badge-guru' : 'badge-siswa'}`}>
                  {profile?.role || 'siswa'}
                </span>
              </div>
              <div className="profile-info-item">
                <Calendar size={16} />
                <span>Bergabung {profile?.created_at ? formatDate(profile.created_at) : '-'}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={saving || fullName.trim() === profile?.full_name}
            >
              {saving ? (
                <>
                  <div className="spinner" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </form>
        </div>

        {/* My Materials (guru only) */}
        {isGuru && (
          <div className="profile-materials animate-slide-in">
            <h2>Materi Saya</h2>
            <p className="profile-materials__subtitle">
              {myMaterials.length} materi telah diupload
            </p>

            {loadingMaterials ? (
              <div className="loading-screen" style={{ minHeight: '200px' }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : myMaterials.length > 0 ? (
              <div className="profile-materials__list">
                {myMaterials.map((material) => (
                  <div key={material.id} className="profile-material-item card">
                    <div className="profile-material-item__icon">
                      {typeIcons[material.file_type]}
                    </div>
                    <div className="profile-material-item__info">
                      <span className="profile-material-item__title">{material.title}</span>
                      <span className="profile-material-item__meta">
                        {formatFileSize(material.file_size)} · {formatDate(material.created_at)}
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteMaterial(material)}
                      title="Hapus materi"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <FileText size={40} />
                <h3>Belum ada materi</h3>
                <p>Upload materi pertama Anda dari halaman Upload.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
