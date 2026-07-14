import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, GraduationCap, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'siswa',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.fullName, formData.role);
      navigate('/dashboard');
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('Email sudah terdaftar. Silakan gunakan email lain atau masuk.');
      } else {
        setError(err.message || 'Terjadi kesalahan saat mendaftar.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg__orb auth-bg__orb--1" />
        <div className="auth-bg__orb auth-bg__orb--2" />
      </div>

      <div className="auth-container animate-fade-in-up">
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={32} />
          </div>
          <h1>Buat Akun</h1>
          <p>Bergabung dengan EduLearn</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Nama Lengkap</label>
            <div className="input-icon-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="form-input input-with-icon"
                placeholder="Nama lengkap Anda"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                className="form-input input-with-icon"
                placeholder="contoh@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input input-with-icon"
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Konfirmasi Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input input-with-icon"
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Daftar sebagai</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-option ${formData.role === 'siswa' ? 'role-option--active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'siswa' })}
              >
                <span className="role-option__emoji">🎓</span>
                <span className="role-option__label">Siswa</span>
                <span className="role-option__desc">Akses dan pelajari materi</span>
              </button>
              <button
                type="button"
                className={`role-option ${formData.role === 'guru' ? 'role-option--active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'guru' })}
              >
                <span className="role-option__emoji">📚</span>
                <span className="role-option__label">Guru</span>
                <span className="role-option__desc">Upload dan kelola materi</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                Memproses...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Daftar
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Sudah punya akun?{' '}
          <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
