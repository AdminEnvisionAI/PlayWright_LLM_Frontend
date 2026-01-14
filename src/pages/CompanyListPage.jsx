import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Trash2, Loader2, FolderOpen, Globe, X } from 'lucide-react'
import { getCompanies, createCompany, deleteCompany } from '../services/apiService.js'

function CompanyListPage() {
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', description: '', website: '' })
    const [submitting, setSubmitting] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        loadCompanies()
    }, [])

    const loadCompanies = async () => {
        try {
            setLoading(true)
            const data = await getCompanies()
            setCompanies(data)
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
            await createCompany(formData)
            setFormData({ name: '', description: '', website: '' })
            setShowModal(false)
            await loadCompanies()
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (e, companyId) => {
        e.stopPropagation()
        if (!confirm('Are you sure? This will delete all projects in this company.')) return

        try {
            await deleteCompany(companyId)
            await loadCompanies()
        } catch (err) {
            setError(err.message)
        }
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-state">
                    <Loader2 size={48} className="animate-spin" />
                    <p>Loading companies...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-title-section">
                    <div className="page-icon">
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h1 className="page-title">Companies</h1>
                        <p className="page-subtitle">Select a company to view its projects</p>
                    </div>
                </div>
                <button className="btn-add" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add Company
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            {companies.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Building2 size={64} />
                    </div>
                    <h2>No Companies Created</h2>
                    <p>Get started by adding your first company</p>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        Add Company
                    </button>
                </div>
            ) : (
                <div className="cards-grid">
                    {companies.map(company => (
                        <div
                            key={company.id}
                            className="card"
                            onClick={() => navigate(`/companies/${company.id}/projects`)}
                        >
                            <div className="card-header">
                                <div className="card-icon company">
                                    <Building2 size={24} />
                                </div>
                                <button
                                    className="btn-delete"
                                    onClick={(e) => handleDelete(e, company.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h3 className="card-title">{company.name}</h3>
                            {company.description && (
                                <p className="card-description">{company.description}</p>
                            )}
                            {company.website && (
                                <div className="card-meta">
                                    <Globe size={14} />
                                    <span>{company.website}</span>
                                </div>
                            )}
                            <div className="card-footer">
                                <FolderOpen size={14} />
                                <span>View Projects</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Company</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter company name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the company"
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label>Website</label>
                                <input
                                    type="text"
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    {submitting ? 'Creating...' : 'Create Company'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CompanyListPage
