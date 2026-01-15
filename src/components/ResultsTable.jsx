import React, { useState } from 'react'
import { CheckCircle2, XCircle, Search, Play, Edit2, Check, X, Loader2, Plus, Trash2 } from 'lucide-react'

function HighlightedText({ text, targetTerms }) {
    if (!text) return null

    const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|edu|gov|io|biz|info|co|uk|ca|au|in|us|me|tv|ai|app)[^\s]*)/gi
    const escapedTargets = targetTerms
        .filter(t => t && t.length > 2)
        .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

    const targetRegex = escapedTargets.length > 0
        ? new RegExp(`(${escapedTargets.join('|')})`, 'gi')
        : null

    const tokens = []
    const parts = text.split(/(\s+)/)

    parts.forEach(part => {
        if (!part.trim()) {
            tokens.push({ type: 'text', value: part })
            return
        }

        const cleanPart = part.replace(/[.,!?;:]+$/, '')
        const isTarget = targetRegex?.test(cleanPart)
        const isUrl = urlRegex.test(cleanPart)

        if (isTarget) {
            tokens.push({ type: 'target', value: part })
        } else if (isUrl) {
            tokens.push({ type: 'competitor', value: part })
        } else {
            tokens.push({ type: 'text', value: part })
        }
    })

    return (
        <>
            {tokens.map((token, i) => {
                if (token.type === 'target') {
                    return (
                        <mark key={i} className="highlight-target">
                            {token.value}
                        </mark>
                    )
                }
                if (token.type === 'competitor') {
                    return (
                        <mark key={i} className="highlight-competitor">
                            {token.value}
                        </mark>
                    )
                }
                return <span key={i}>{token.value}</span>
            })}
        </>
    )
}

export function ResultsTable({ results, brandName, domain, onUpdateQuestion, onRunSingleQuestion, onAddQuestion, onDeleteQuestion }) {
    const targetTerms = [brandName || '', domain || ''].filter(Boolean)
    const [editingId, setEditingId] = useState(null)
    const [tempText, setTempText] = useState("")
    const [showAddForm, setShowAddForm] = useState(false)
    const [newQuestion, setNewQuestion] = useState("")

    const startEditing = (id, currentText) => {
        setEditingId(id)
        setTempText(currentText)
    }

    const saveEdit = (id) => {
        if (onUpdateQuestion) onUpdateQuestion(id, tempText)
        setEditingId(null)
    }

    const cancelEdit = () => {
        setEditingId(null)
    }

    const handleAddQuestion = () => {
        if (newQuestion.trim() && onAddQuestion) {
            onAddQuestion(newQuestion.trim())
            setNewQuestion("")
            setShowAddForm(false)
        }
    }

    return (
        <div className="table-container">
            <div className="table-legend">
                <div className="legend-item">
                    <div className="legend-color target" />
                    Target Website
                </div>
                <div className="legend-item">
                    <div className="legend-color competitor" />
                    Other Recommendations
                </div>
            </div>
            <table className="results-table">
                <thead>
                    <tr>
                        <th style={{ width: '8rem' }}>Category</th>
                        <th style={{ minWidth: '300px' }}>Question</th>
                        <th>ChatGPT Answer</th>
                        <th className="center" style={{ width: '6rem' }}>Status</th>
                        <th className="center" style={{ width: '7rem' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((result) => (
                        <tr key={result.id} className={result.loading ? 'loading-row' : ''}>
                            <td>
                                <span className="category-badge">
                                    {result.category.split(' ')[0]}
                                </span>
                            </td>
                            <td>
                                {editingId === result.id ? (
                                    <div className="edit-form">
                                        <textarea
                                            value={tempText}
                                            onChange={(e) => setTempText(e.target.value)}
                                            className="edit-textarea"
                                            rows={3}
                                        />
                                        <div className="edit-actions">
                                            <button onClick={() => saveEdit(result.id)} className="icon-btn success"><Check size={18} /></button>
                                            <button onClick={cancelEdit} className="icon-btn danger"><X size={18} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="question-cell">
                                        <p className="question-text">
                                            {result.question}
                                        </p>
                                        <button
                                            onClick={() => startEditing(result.id, result.question)}
                                            className="edit-btn-hidden"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td>
                                <div className="answer-cell">
                                    {result.loading ? (
                                        <div className="loading-answer animate-pulse">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>ChatGPT is thinking...</span>
                                        </div>
                                    ) : result.fullAnswer ? (
                                        <HighlightedText text={result.fullAnswer} targetTerms={targetTerms} />
                                    ) : (
                                        <span className="no-answer">No answer generated yet.</span>
                                    )}
                                </div>
                            </td>
                            <td className="center">
                                <div className="status-cell">
                                    {result.loading ? (
                                        <div><Loader2 size={20} className="animate-spin" style={{ color: 'var(--indigo-400)' }} /></div>
                                    ) : result.fullAnswer ? (
                                        result.found ? (
                                            <>
                                                <div className="status-badge found">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                                <span className="status-label found">Found</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="status-badge miss">
                                                    <XCircle size={20} />
                                                </div>
                                                <span className="status-label miss">Miss</span>
                                            </>
                                        )
                                    ) : (
                                        <span className="pending-label">Pending</span>
                                    )}
                                </div>
                            </td>
                            <td className="center">
                                <div className="actions-cell">
                                    <button
                                        onClick={() => startEditing(result.id, result.question)}
                                        className="action-btn edit"
                                        title="Edit Question"
                                        disabled={result.loading}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => onRunSingleQuestion && onRunSingleQuestion(result.id)}
                                        className="action-btn play"
                                        title="Run Question"
                                        disabled={result.loading || !brandName}
                                    >
                                        <Play size={18} fill="currentColor" />
                                    </button>
                                    {onDeleteQuestion && (
                                        <button
                                            onClick={() => onDeleteQuestion(result.id)}
                                            className="action-btn delete"
                                            title="Delete Question"
                                            disabled={result.loading}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {results.length === 0 && (
                        <tr className="empty-row">
                            <td colSpan={5}>
                                <Search size={48} className="empty-icon" />
                                <p>No results yet. Enter domain and location to evaluate.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            {onAddQuestion && (
                <div className="add-question-section">
                    {showAddForm ? (
                        <div className="add-question-form">
                            <textarea
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Enter your custom question..."
                                className="add-question-textarea"
                                rows={2}
                            />
                            <div className="add-question-actions">
                                <button onClick={handleAddQuestion} className="btn-add-confirm" disabled={!newQuestion.trim()}>
                                    <Plus size={16} />
                                    Add Question
                                </button>
                                <button onClick={() => { setShowAddForm(false); setNewQuestion(""); }} className="btn-add-cancel">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowAddForm(true)} className="btn-show-add-form">
                            <Plus size={18} />
                            Add Custom Question
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
