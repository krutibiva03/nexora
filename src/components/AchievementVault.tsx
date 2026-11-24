import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, Edit3, ExternalLink, Eye, FileText, Globe, Lock, Plus, Trash2, Upload, X } from 'lucide-react';
import { uploadWorkspaceFile } from '../services/uploadService';
import {
  ACHIEVEMENT_CATEGORIES,
  AchievementCategory,
  AchievementItem,
  DeveloperProfile,
  FIELD_LIMITS,
} from '../types/nexora';
import { isValidHttpOrAssetUrl } from '../utils/validation';
import { MagneticButton, TiltCard } from './MotionPrimitives';

interface AchievementVaultProps {
  profile: DeveloperProfile | null;
  achievements: AchievementItem[];
  isDemoMode: boolean;
  onCreateAchievement: (
    input: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onUpdateAchievement: (
    id: string,
    input: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onDeleteAchievement: (achievement: AchievementItem) => Promise<void>;
}

export const AchievementVault: React.FC<AchievementVaultProps> = ({
  profile,
  achievements,
  isDemoMode,
  onCreateAchievement,
  onUpdateAchievement,
  onDeleteAchievement,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | AchievementCategory>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<AchievementItem | null>(null);
  const [editingItem, setEditingItem] = useState<AchievementItem | null>(null);

  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [category, setCategory] = useState<AchievementCategory>('Certification');
  const [issuedDate, setIssuedDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [certificateFileUrl, setCertificateFileUrl] = useState('');
  const [certificateFileName, setCertificateFileName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredAchievements = useMemo(() => {
    if (categoryFilter === 'all') return achievements;
    return achievements.filter((a) => a.category === categoryFilter);
  }, [achievements, categoryFilter]);

  function openCreate() {
    setEditingItem(null);
    setTitle('');
    setIssuer('');
    setCategory('Certification');
    setIssuedDate('');
    setCredentialId('');
    setCredentialUrl('');
    setCertificateFileUrl('');
    setCertificateFileName('');
    setDescription('');
    setIsPublic(true);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item: AchievementItem) {
    setEditingItem(item);
    setTitle(item.title);
    setIssuer(item.issuer);
    setCategory(item.category);
    setIssuedDate(item.issuedDate);
    setCredentialId(item.credentialId);
    setCredentialUrl(item.credentialUrl);
    setCertificateFileUrl(item.certificateFileUrl);
    setCertificateFileName(item.certificateFileName);
    setDescription(item.description);
    setIsPublic(item.isPublic);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    if (isDemoMode) {
      setCertificateFileUrl(URL.createObjectURL(file));
      setCertificateFileName(file.name);
      return;
    }
    setUploadingFile(true);
    try {
      const uploaded = await uploadWorkspaceFile(file, 'certificates');
      setCertificateFileUrl(uploaded.url);
      setCertificateFileName(uploaded.fileName);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to upload certificate file.');
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !issuer.trim()) {
      setFormError('Title and issuing organization are required.');
      return;
    }
    if (!isValidHttpOrAssetUrl(credentialUrl) || !isValidHttpOrAssetUrl(certificateFileUrl)) {
      setFormError('Credential and certificate URLs must use https://, http://, or an uploaded file path.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        authorName: profile?.displayName || 'NEXORA Developer',
        authorHandle: profile?.handle || 'builder',
        title: title.trim().slice(0, FIELD_LIMITS.achievementTitleMax),
        issuer: issuer.trim().slice(0, FIELD_LIMITS.issuerMax),
        category,
        issuedDate: issuedDate.trim().slice(0, FIELD_LIMITS.issuedDateMax),
        credentialId: credentialId.trim().slice(0, FIELD_LIMITS.credentialIdMax),
        credentialUrl: credentialUrl.trim(),
        certificateFileUrl: certificateFileUrl.trim(),
        certificateFileName: certificateFileName.trim().slice(0, FIELD_LIMITS.fileNameMax),
        description: description.trim().slice(0, FIELD_LIMITS.achievementDescMax),
        isPublic,
      };
      if (editingItem) {
        await onUpdateAchievement(editingItem.id, payload);
      } else {
        await onCreateAchievement(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save achievement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#F45B84]">
            Achievement Vault
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#FAF4F6] mt-1">
            Digital Certificate & Milestone Gallery
          </h1>
          <p className="text-sm text-[#D8C7CE]/80 mt-1">
            Store certificates, hackathon wins, and credentials with interactive previews and public curation.
          </p>
        </div>

        <MagneticButton
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-xs font-semibold text-[#FAF4F6] shadow-[0_8px_24px_rgba(244,91,132,0.28)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Achievement
        </MagneticButton>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            categoryFilter === 'all'
              ? 'bg-[#6E1233]/45 text-[#FAF4F6] border border-rose-300/30'
              : 'text-[#9E8490] hover:text-[#FAF4F6] hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          All Categories
        </button>
        {ACHIEVEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              categoryFilter === cat
                ? 'bg-[#6E1233]/45 text-[#FAF4F6] border border-rose-300/30'
                : 'text-[#9E8490] hover:text-[#FAF4F6] hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Vault Gallery */}
      {filteredAchievements.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center space-y-3">
          <Award className="w-8 h-8 text-[#F45B84]/80 mx-auto" />
          <p className="text-sm font-medium text-[#FAF4F6]">No achievements recorded here yet</p>
          <p className="text-xs text-[#9E8490] max-w-md mx-auto">
            Upload a PDF or image certificate, add hackathon placements, or log open-source milestones.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1233] hover:bg-[#88163F] text-xs font-medium text-[#FAF4F6] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload First Achievement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAchievements.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.35 }}
            >
              <TiltCard glowColor="rgba(244, 91, 132, 0.26)" className="h-full rounded-2xl">
                <article className="h-full glass-surface rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-rose-300/35 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#9E8490]">
                      <span className="text-[#F8A5BE] font-medium">
                        {item.category}
                        {item.issuedDate ? ` · ${item.issuedDate}` : ''}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {item.isPublic ? (
                          <>
                            <Globe className="w-3 h-3 text-emerald-400" />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>Private</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6E1233]/50 to-[#2A0A19]/80 border border-rose-300/25 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-[#F45B84]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[#FAF4F6]">{item.title}</h2>
                        <p className="text-sm text-[#D9C6EC] mt-0.5">{item.issuer}</p>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-[#D8C7CE] leading-relaxed">{item.description}</p>
                    )}

                    {item.credentialId && (
                      <p className="text-xs font-mono text-[#9E8490]">
                        Credential ID: {item.credentialId}
                      </p>
                    )}

                    {item.certificateFileUrl && (
                      <div className="rounded-xl border border-rose-300/15 bg-[#0D0409]/85 p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-[#F45B84] shrink-0" />
                          <span className="text-xs text-[#FAF4F6] truncate">
                            {item.certificateFileName || 'Uploaded Certificate'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#F8A5BE] hover:text-[#FAF4F6] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-rose-200/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="text-xs font-medium text-[#D8C7CE] hover:text-[#FAF4F6] cursor-pointer"
                      >
                        Inspect Card
                      </button>
                      {item.credentialUrl && (
                        <a
                          href={item.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#F8A5BE] hover:text-[#FAF4F6]"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        aria-label={`Edit ${item.title}`}
                        className="p-1.5 rounded-lg text-[#9E8490] hover:text-[#FAF4F6] hover:bg-white/[0.08] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAchievement(item)}
                        aria-label={`Delete ${item.title}`}
                        className="p-1.5 rounded-lg text-[#9E8490] hover:text-rose-200 hover:bg-rose-500/15 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Interactive Certificate Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full glass-surface-elevated rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-mono text-[#F8A5BE]">
                    {previewItem.category}
                    {previewItem.issuedDate ? ` · ${previewItem.issuedDate}` : ''}
                  </p>
                  <h2 className="text-xl font-bold text-[#FAF4F6] mt-1">{previewItem.title}</h2>
                  <p className="text-sm text-[#D9C6EC]">{previewItem.issuer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  aria-label="Close preview"
                  className="p-2 rounded-lg text-[#9E8490] hover:text-[#FAF4F6] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {previewItem.certificateFileUrl ? (
                previewItem.certificateFileUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="rounded-xl border border-rose-200/15 bg-[#0D0408] p-6 text-center space-y-3">
                    <FileText className="w-10 h-10 text-[#F45B84] mx-auto" />
                    <p className="text-sm text-[#FAF4F6]">{previewItem.certificateFileName}</p>
                    <a
                      href={previewItem.certificateFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1233] hover:bg-[#88163F] text-xs font-semibold text-[#FAF4F6]"
                    >
                      Open PDF Certificate
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-rose-200/15 bg-[#0D0408] max-h-[380px] flex items-center justify-center">
                    <img
                      src={previewItem.certificateFileUrl}
                      alt={previewItem.title}
                      referrerPolicy="no-referrer"
                      className="max-h-[380px] w-auto object-contain"
                    />
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-rose-300/20 bg-gradient-to-br from-[#280917] via-[#12040A] to-[#070306] p-8 text-center space-y-3">
                  <Award className="w-12 h-12 text-[#F45B84] mx-auto" />
                  <p className="text-base font-semibold text-[#FAF4F6]">{previewItem.title}</p>
                  <p className="text-xs text-[#D9C6EC]">Issued by {previewItem.issuer}</p>
                  {previewItem.credentialId && (
                    <p className="text-xs font-mono text-[#9E8490]">
                      ID: {previewItem.credentialId}
                    </p>
                  )}
                </div>
              )}

              {previewItem.description && (
                <p className="text-sm text-[#D8C7CE] leading-relaxed">{previewItem.description}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-rose-200/10">
                {previewItem.credentialUrl && (
                  <a
                    href={previewItem.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6E1233]/40 border border-rose-300/30 text-xs font-semibold text-[#F8A5BE] hover:bg-[#6E1233]/65"
                  >
                    Verify Online
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 rounded-xl border border-rose-200/15 text-xs font-medium text-[#D8C7CE] hover:text-[#FAF4F6] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22 }}
              className="max-w-xl w-full glass-surface-elevated rounded-2xl p-6 space-y-5 my-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#FAF4F6]">
                  {editingItem ? 'Edit Achievement' : 'Add Achievement or Certificate'}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close modal"
                  className="p-1.5 rounded-lg text-[#9E8490] hover:text-[#FAF4F6] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/60 px-3 py-2 text-xs text-rose-100">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="ach-title" className="block text-xs font-medium text-[#D8C7CE]">
                      Achievement / Certificate Title *
                    </label>
                    <input
                      id="ach-title"
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.achievementTitleMax}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="AWS Solutions Architect Associate"
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ach-issuer" className="block text-xs font-medium text-[#D8C7CE]">
                      Issuing Organization *
                    </label>
                    <input
                      id="ach-issuer"
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.issuerMax}
                      value={issuer}
                      onChange={(e) => setIssuer(e.target.value)}
                      placeholder="Linux Foundation, Coursera, IEEE..."
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ach-category" className="block text-xs font-medium text-[#D8C7CE]">
                      Category
                    </label>
                    <select
                      id="ach-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as AchievementCategory)}
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    >
                      {ACHIEVEMENT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ach-date" className="block text-xs font-medium text-[#D8C7CE]">
                      Issue Date
                    </label>
                    <input
                      id="ach-date"
                      type="text"
                      maxLength={FIELD_LIMITS.issuedDateMax}
                      value={issuedDate}
                      onChange={(e) => setIssuedDate(e.target.value)}
                      placeholder="2026-08"
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="ach-cred-id" className="block text-xs font-medium text-[#D8C7CE]">
                      Credential ID
                    </label>
                    <input
                      id="ach-cred-id"
                      type="text"
                      maxLength={FIELD_LIMITS.credentialIdMax}
                      value={credentialId}
                      onChange={(e) => setCredentialId(e.target.value)}
                      placeholder="CERT-2026-991"
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ach-cred-url" className="block text-xs font-medium text-[#D8C7CE]">
                      Verification URL
                    </label>
                    <input
                      id="ach-cred-url"
                      type="url"
                      maxLength={FIELD_LIMITS.urlMax}
                      value={credentialUrl}
                      onChange={(e) => setCredentialUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#D8C7CE]">
                      Certificate File (PNG, JPEG, WebP, or PDF up to 3 MB)
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#F8A5BE] hover:text-[#FAF4F6] cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingFile ? 'Uploading...' : 'Upload Certificate'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  {certificateFileName && (
                    <p className="text-xs font-mono text-emerald-300 truncate">
                      Attached: {certificateFileName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ach-desc" className="block text-xs font-medium text-[#D8C7CE]">
                    Achievement Description
                  </label>
                  <textarea
                    id="ach-desc"
                    rows={3}
                    maxLength={FIELD_LIMITS.achievementDescMax}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you accomplished or validated..."
                    className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-[#D8C7CE] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-rose-200/20 bg-[#0D0408] text-[#F45B84]"
                  />
                  Display on public profile and Community Discover
                </label>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-200/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-rose-200/15 text-xs font-medium text-[#D8C7CE] hover:text-[#FAF4F6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] disabled:opacity-60 text-xs font-semibold text-[#FAF4F6] cursor-pointer"
                  >
                    {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Save Achievement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
