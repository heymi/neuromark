import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Project } from '../types';

const PROJECT_COLORS = [
  '#FF3B30', // Apple Red
  '#FF9500', // Apple Orange
  '#FFCC00', // Apple Yellow
  '#34C759', // Apple Green
  '#32ADE6', // Apple Teal
  '#007AFF', // Apple Blue
  '#5856D6', // Apple Indigo
  '#AF52DE', // Apple Purple
  '#FF2D55', // Apple Pink
];

interface ProjectsPanelProps {
  projects: (Project & { count: number })[];
  activeProject: string | null;
  onSelectProject: (projectId: string) => void;
  onAddProject: (name: string, color: string) => void;
  onUpdateProject: (id: string, name: string, color: string) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsPanel: React.FC<ProjectsPanelProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[5]);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectColor, setEditProjectColor] = useState(PROJECT_COLORS[5]);

  const submitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onAddProject(newProjectName.trim(), newProjectColor);
    setNewProjectName('');
    setIsAddingProject(false);
  };

  const startEditingProject = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectColor(project.color);
  };

  const submitEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId) return;
    if (!editProjectName.trim()) return;
    onUpdateProject(editingProjectId, editProjectName.trim(), editProjectColor);
    setEditingProjectId(null);
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-system-dark-panel border border-black/[0.04] dark:border-white/[0.05] shadow-sm p-3 md:p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
          Projects
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAddingProject(true);
            setEditingProjectId(null);
          }}
          className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="Add Project"
        >
          <Plus size={12} />
        </button>
      </div>

      {isAddingProject && (
        <form
          onSubmit={submitNewProject}
          className="mb-3 bg-system-bg/60 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3 rounded-xl"
        >
          <input
            autoFocus
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name..."
            className="w-full mb-2 px-2 py-1.5 text-xs bg-transparent border-b border-black/10 dark:border-white/10 focus:border-indigo-500 outline-none text-system-text dark:text-system-dark-text placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {PROJECT_COLORS.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewProjectColor(c)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    newProjectColor === c
                      ? 'scale-110 ring-2 ring-offset-1 ring-black/10 dark:ring-white/20'
                      : 'hover:scale-110'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Cancel"
              >
                <X size={12} />
              </button>
              <button
                type="submit"
                className="p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-sm hover:scale-105 transition-transform"
                title="Create"
              >
                <Check size={12} />
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-1.5">
        {projects.length === 0 ? (
          <div className="text-xs text-system-secondary dark:text-system-dark-secondary opacity-80">
            No projects yet.
          </div>
        ) : (
          projects.map((project) => {
            const isActive = activeProject === project.id;
            const isEditing = editingProjectId === project.id;

            if (isEditing) {
              return (
                <form
                  key={project.id}
                  onSubmit={submitEditProject}
                  className="bg-system-bg/60 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                      style={{ background: editProjectColor }}
                    />
                    <input
                      autoFocus
                      type="text"
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                      className="flex-1 text-xs bg-transparent border-b border-black/10 dark:border-white/10 focus:border-indigo-500 outline-none text-system-text dark:text-system-dark-text"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {PROJECT_COLORS.slice(0, 6).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditProjectColor(c)}
                          className={`w-3.5 h-3.5 rounded-full transition-transform ${
                            editProjectColor === c
                              ? 'scale-110 ring-2 ring-offset-1 ring-black/10 dark:ring-white/20'
                              : 'hover:scale-110'
                          }`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                      <button
                        type="submit"
                        className="p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-sm hover:scale-105 transition-transform"
                        title="Save"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  </div>
                </form>
              );
            }

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelectProject(project.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-colors group/item ${
                  isActive
                    ? 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/30'
                    : 'bg-system-bg/40 dark:bg-white/[0.03] border-black/5 dark:border-white/10 hover:bg-system-bg/70 dark:hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                    style={{ background: project.color }}
                  />
                  <span className="text-[13px] font-semibold text-system-text dark:text-system-dark-text truncate">
                    {project.name}
                  </span>
                  <span className="text-[10px] font-semibold text-system-secondary dark:text-system-dark-secondary">
                    {project.count}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => startEditingProject(project, e)}
                    className="p-1.5 text-gray-400 hover:text-system-text dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                    title="Edit"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

