import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { FolderOpen, Plus, Trash2, Loader2, Building2, Globe, MapPin, Flag, ChevronRight, X, LayoutDashboard } from 'lucide-react'
import { getProjectsByCompany, getCompanyById, createProject, deleteProject } from '../services/apiService.js'

function ProjectListPage() {
    const { companyId } = useParams()
    const [company, setCompany] = useState(null)
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', description: '', domain: '', nation: 'USA', state: '' })
    const [submitting, setSubmitting] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        loadData()
    }, [companyId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [companyData, projectsData] = await Promise.all([
                getCompanyById(companyId),
                getProjectsByCompany(companyId)
            ])
            setCompany(companyData)
            setProjects(projectsData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) return

        try {
            setSubmitting(true)
            await createProject(companyId, formData)
            setFormData({ name: '', description: '', domain: '', nation: 'USA', state: '' })
            setShowModal(false)
            await loadData()
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (e, projectId) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this project?')) return

        try {
            await deleteProject(projectId)
            await loadData()
        } catch (err) {
            setError(err.message)
        }
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-state">
                    <Loader2 size={48} className="animate-spin" />
                    <p>Loading projects...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <nav className="breadcrumb">
                <Link to="/">Companies</Link>
                <ChevronRight size={16} />
                <span>{company?.name || 'Projects'}</span>
            </nav>

            <div className="page-header">
                <div className="page-title-section">
                    <div className="page-icon project">
                        <FolderOpen size={28} />
                    </div>
                    <div>
                        <h1 className="page-title">{company?.name} - Projects</h1>
                        <p className="page-subtitle">Select a project to open the evaluation dashboard</p>
                    </div>
                </div>
                <button className="btn-add" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add Project
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            {projects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon project">
                        <FolderOpen size={64} />
                    </div>
                    <h2>No Projects Created</h2>
                    <p>Add your first project to start evaluating websites</p>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        Add Project
                    </button>
                </div>
            ) : (
                <div className="cards-grid">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className="card"
                            onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                        >
                            <div className="card-header">
                                <div className="card-icon project">
                                    <FolderOpen size={24} />
                                </div>
                                <button
                                    className="btn-delete"
                                    onClick={(e) => handleDelete(e, project.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h3 className="card-title">{project.name}</h3>
                            {project.description && (
                                <p className="card-description">{project.description}</p>
                            )}
                            {project.domain && (
                                <div className="card-meta">
                                    <Globe size={14} />
                                    <span>{project.domain}</span>
                                </div>
                            )}
                            <div className="card-meta-row">
                                {project.nation && (
                                    <div className="card-meta">
                                        <Flag size={14} />
                                        <span>{project.nation}</span>
                                    </div>
                                )}
                                {project.state && (
                                    <div className="card-meta">
                                        <MapPin size={14} />
                                        <span>{project.state}</span>
                                    </div>
                                )}
                            </div>
                            <div className="card-footer">
                                <LayoutDashboard size={14} />
                                <span>Open Dashboard</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Project</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Project Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the project"
                                    rows={2}
                                />
                            </div>
                            <div className="form-group">
                                <label>Domain</label>
                                <input
                                    type="text"
                                    value={formData.domain}
                                    onChange={e => setFormData({ ...formData, domain: e.target.value })}
                                    placeholder="example.com"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nation</label>
                                    <input
                                        type="text"
                                        value={formData.nation}
                                        onChange={e => setFormData({ ...formData, nation: e.target.value })}
                                        placeholder="USA"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                                        placeholder="California"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    {submitting ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProjectListPage
