import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Code2, Edit3, ExternalLink, FolderGit2, Globe, Lock, Plus, Trash2, Upload, X } from 'lucide-react';
import { CRIMSON_MONOLITH_URL } from '../data/demoWorkspace';
import { uploadWorkspaceFile } from '../services/uploadService';
import {
  DeveloperProfile,
  FIELD_LIMITS,
  PROJECT_CATEGORIES,
  ProjectCategory,
  ProjectItem,
} from '../types/nexora';
import { isValidHttpOrAssetUrl, parseTagList } from '../utils/validation';
import { MagneticButton, TiltCard } from './MotionPrimitives';

interface ProjectGalaxyProps {
  profile: DeveloperProfile | null;
  projects: ProjectItem[];
  isDemoMode: boolean;
  onCreateProject: (input: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProject: (id: string, input: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteProject: (project: ProjectItem) => Promise<void>;
}

const ARTWORK_GRADIENTS = [
  'from-[#4D0C24]/80 via-[#16050D]/90 to-[#2A0A19]/80',
  'from-[#6E1233]/70 via-[#12040A]/90 to-[#3B0B24]/80',
  'from-[#3B0B24]/80 via-[#0E0308]/90 to-[#881337]/55',
  'from-[#280917]/85 via-[#0B0307]/92 to-[#6E1233]/65',
];

export const ProjectGalaxy: React.FC<ProjectGalaxyProps> = ({
  profile,
  projects,
  isDemoMode,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProjectCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Web Platform');
  const [techText, setTechText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [projects, categoryFilter, searchQuery]);

  function openCreate() {
    setEditingProject(null);
    setTitle('');
    setSummary('');
    setDescription('');
    setCategory('Web Platform');
    setTechText('');
    setImageUrl('');
    setGithubUrl('');
    setLiveUrl('');
    setIsPublic(true);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(project: ProjectItem) {
    setEditingProject(project);
    setTitle(project.title);
    setSummary(project.summary);
    setDescription(project.description);
    setCategory(project.category);
    setTechText(project.technologies.join(', '));
    setImageUrl(project.imageUrl);
    setGithubUrl(project.githubUrl);
    setLiveUrl(project.liveUrl);
    setIsPublic(project.isPublic);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    if (isDemoMode) {
      setImageUrl(URL.createObjectURL(file));
      return;
    }
    setUploadingImage(true);
    try {
      const res = await uploadWorkspaceFile(file, 'projects');
      setImageUrl(res.url);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to upload project image.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !summary.trim()) {
      setFormError('Project title and summary are required.');
      return;
    }
    if (!isValidHttpOrAssetUrl(imageUrl) || !isValidHttpOrAssetUrl(githubUrl) || !isValidHttpOrAssetUrl(liveUrl)) {
      setFormError('URLs must begin with https:// or http:// (or be an uploaded asset path).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        authorName: profile?.displayName || 'NEXORA Developer',
        authorHandle: profile?.handle || 'builder',
        title: title.trim().slice(0, FIELD_LIMITS.projectTitleMax),
        summary: summary.trim().slice(0, FIELD_LIMITS.projectSummaryMax),
        description: description.trim().slice(0, FIELD_LIMITS.projectDescMax),
        category,
        technologies: parseTagList(techText),
        imageUrl: imageUrl.trim(),
        githubUrl: githubUrl.trim(),
        liveUrl: liveUrl.trim(),
        isPublic,
      };
      if (editingProject) {
        await onUpdateProject(editingProject.id, payload);
      } else {
        await onCreateProject(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#F45B84]">
            Project Galaxy
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#FAF4F6] mt-1">
            Digital Worlds & Engineering Builds
          </h1>
          <p className="text-sm text-[#D8C7CE]/80 mt-1">
            Showcase projects with curated artwork, stack typography, repositories, and live deployment links.
          </p>
        </div>

        <MagneticButton
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6E1233] to-[#F45B84] hover:from-[#88163F] hover:to-[#FB7185] text-xs font-semibold text-[#FAF4F6] shadow-[0_8px_24px_rgba(244,91,132,0.28)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </MagneticButton>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
          {PROJECT_CATEGORIES.map((cat) => (
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

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects or technologies..."
          className="w-full lg:w-72 rounded-xl border border-rose-200/15 bg-[#12040A]/85 px-3.5 py-2 text-xs text-[#FAF4F6] placeholder:text-[#7E6170] focus:outline-none focus:border-[#F45B84]"
        />
      </div>

      {/* Digital World Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center space-y-3">
          <FolderGit2 className="w-8 h-8 text-[#F45B84]/80 mx-auto" />
          <p className="text-sm font-medium text-[#FAF4F6]">No projects in this view yet</p>
          <p className="text-xs text-[#9E8490] max-w-md mx-auto">
            Add a project with architecture highlights, technologies, and links to feature it on your public profile.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E1233] hover:bg-[#88163F] text-xs font-medium text-[#FAF4F6] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project, idx) => {
            const grad = ARTWORK_GRADIENTS[idx % ARTWORK_GRADIENTS.length];
            const showcaseImage = project.imageUrl || (idx === 1 ? CRIMSON_MONOLITH_URL : '');
            return (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
              >
                <TiltCard glowColor="rgba(244, 91, 132, 0.28)" className="h-full rounded-2xl">
                  <article className="group h-full glass-surface rounded-2xl overflow-hidden flex flex-col justify-between transition-colors hover:border-rose-300/35">
                    <div>
                      <div className="relative aspect-[16/10] bg-[#0B0307] border-b border-rose-200/10 overflow-hidden flex items-center justify-center">
                        {showcaseImage ? (
                          <img
                            src={showcaseImage}
                            alt={project.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-gradient-to-br ${grad} relative flex flex-col items-center justify-center gap-2 p-4 text-center`}
                          >
                            <div className="w-24 h-24 rounded-full border border-rose-200/20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                              <Code2 className="w-7 h-7 text-[#F8A5BE]" />
                            </div>
                            <span className="text-xs font-mono text-[#D8C7CE]">
                              {project.category}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070306]/85 via-transparent to-transparent pointer-events-none" />
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-[#9E8490]">
                          <span className="text-[#F8A5BE] font-medium">{project.category}</span>
                          <span className="inline-flex items-center gap-1">
                            {project.isPublic ? (
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

                        <h2 className="text-lg font-semibold text-[#FAF4F6] leading-snug group-hover:text-[#F8A5BE] transition-colors">
                          {project.title}
                        </h2>
                        <p className="text-sm text-[#D8C7CE] leading-relaxed">{project.summary}</p>

                        {project.technologies.length > 0 && (
                          <p className="text-xs font-mono text-[#D9C6EC]/85 pt-1">
                            {project.technologies.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-rose-200/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-200/15 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-[#FAF4F6] transition-colors"
                          >
                            <span>GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#6E1233]/40 border border-rose-300/25 hover:bg-[#6E1233]/65 text-xs font-medium text-[#F8A5BE] transition-colors"
                          >
                            <span>Live Demo</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(project)}
                          aria-label={`Edit ${project.title}`}
                          className="p-1.5 rounded-lg text-[#9E8490] hover:text-[#FAF4F6] hover:bg-white/[0.08] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProject(project)}
                          aria-label={`Delete ${project.title}`}
                          className="p-1.5 rounded-lg text-[#9E8490] hover:text-rose-200 hover:bg-rose-500/15 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Animated Modal */}
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
                  {editingProject ? 'Edit Project' : 'Add Project to Galaxy'}
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
                    <label htmlFor="proj-title" className="block text-xs font-medium text-[#D8C7CE]">
                      Project Title *
                    </label>
                    <input
                      id="proj-title"
                      type="text"
                      required
                      maxLength={FIELD_LIMITS.projectTitleMax}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="VectorMesh Search"
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="proj-category" className="block text-xs font-medium text-[#D8C7CE]">
                      Category
                    </label>
                    <select
                      id="proj-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    >
                      {PROJECT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="proj-summary" className="block text-xs font-medium text-[#D8C7CE]">
                    One-Line Summary *
                  </label>
                  <input
                    id="proj-summary"
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.projectSummaryMax}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Sub-25ms AST-aware code search engine..."
                    className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="proj-desc" className="block text-xs font-medium text-[#D8C7CE]">
                    Architecture & Impact Description
                  </label>
                  <textarea
                    id="proj-desc"
                    rows={3}
                    maxLength={FIELD_LIMITS.projectDescMax}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe technical decisions, benchmarks, and results..."
                    className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="proj-tech" className="block text-xs font-medium text-[#D8C7CE]">
                    Technologies (comma-separated, up to 12)
                  </label>
                  <input
                    id="proj-tech"
                    type="text"
                    value={techText}
                    onChange={(e) => setTechText(e.target.value)}
                    placeholder="TypeScript, React, Express, Firestore"
                    className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="proj-image" className="text-xs font-medium text-[#D8C7CE]">
                      Project Preview Image
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#F8A5BE] hover:text-[#FAF4F6] cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <input
                    id="proj-image"
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or uploaded image path"
                    className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="proj-github" className="block text-xs font-medium text-[#D8C7CE]">
                      GitHub Repository URL
                    </label>
                    <input
                      id="proj-github"
                      type="url"
                      maxLength={FIELD_LIMITS.urlMax}
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="proj-live" className="block text-xs font-medium text-[#D8C7CE]">
                      Live Demo URL
                    </label>
                    <input
                      id="proj-live"
                      type="url"
                      maxLength={FIELD_LIMITS.urlMax}
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-rose-200/15 bg-[#0D0408] px-3.5 py-2.5 text-sm text-[#FAF4F6] focus:outline-none focus:border-[#F45B84]"
                    />
                  </div>
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
                    {saving ? 'Saving...' : editingProject ? 'Save Changes' : 'Publish Project'}
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
