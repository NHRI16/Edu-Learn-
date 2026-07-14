import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import MaterialCard from '../components/MaterialCard';
import { Search, BookOpen, Filter, SlidersHorizontal } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch uploader profiles
      if (data && data.length > 0) {
        const uploaderIds = [...new Set(data.map((m) => m.uploaded_by))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', uploaderIds);

        const profilesMap = {};
        profilesData?.forEach((p) => {
          profilesMap[p.id] = p.full_name;
        });
        setProfiles(profilesMap);
      }

      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || m.file_type === filterType;
    return matchesSearch && matchesType;
  });

  const typeCounts = {
    all: materials.length,
    pdf: materials.filter((m) => m.file_type === 'pdf').length,
    image: materials.filter((m) => m.file_type === 'image').length,
    video: materials.filter((m) => m.file_type === 'video').length,
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>
            Halo, <span className="text-gradient">{profile?.full_name || 'User'}</span> 👋
          </h1>
          <p className="dashboard__subtitle">
            {profile?.role === 'guru'
              ? 'Kelola dan bagikan materi pembelajaran Anda.'
              : 'Jelajahi materi pembelajaran yang tersedia.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard__stats">
        <div className="stat-card card">
          <div className="stat-card__icon stat-card__icon--total">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="stat-card__value">{typeCounts.all}</span>
            <span className="stat-card__label">Total Materi</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-card__icon stat-card__icon--pdf">
            <span>📄</span>
          </div>
          <div>
            <span className="stat-card__value">{typeCounts.pdf}</span>
            <span className="stat-card__label">PDF</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-card__icon stat-card__icon--image">
            <span>🖼️</span>
          </div>
          <div>
            <span className="stat-card__value">{typeCounts.image}</span>
            <span className="stat-card__label">Gambar</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-card__icon stat-card__icon--video">
            <span>🎬</span>
          </div>
          <div>
            <span className="stat-card__value">{typeCounts.video}</span>
            <span className="stat-card__label">Video</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="dashboard__toolbar">
        <div className="search-box">
          <Search size={18} className="search-box__icon" />
          <input
            type="text"
            className="form-input search-box__input"
            placeholder="Cari materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <SlidersHorizontal size={16} />
          {[
            { key: 'all', label: 'Semua' },
            { key: 'pdf', label: 'PDF' },
            { key: 'image', label: 'Gambar' },
            { key: 'video', label: 'Video' },
          ].map((f) => (
            <button
              key={f.key}
              className={`filter-pill ${filterType === f.key ? 'filter-pill--active' : ''}`}
              onClick={() => setFilterType(f.key)}
            >
              {f.label}
              {typeCounts[f.key] > 0 && (
                <span className="filter-pill__count">{typeCounts[f.key]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Materials list */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner spinner-lg"></div>
          <p>Memuat materi...</p>
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="materials-grid">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              uploaderName={profiles[material.uploaded_by]}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <BookOpen size={56} />
          <h3>
            {searchQuery || filterType !== 'all'
              ? 'Tidak ada materi ditemukan'
              : 'Belum ada materi'}
          </h3>
          <p>
            {searchQuery || filterType !== 'all'
              ? 'Coba ubah kata kunci pencarian atau filter Anda.'
              : profile?.role === 'guru'
              ? 'Mulai upload materi pertama Anda!'
              : 'Materi akan muncul di sini setelah guru mengupload.'}
          </p>
        </div>
      )}
    </div>
  );
}
