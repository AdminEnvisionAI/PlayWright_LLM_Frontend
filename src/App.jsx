import React, { useState, useMemo } from 'react'
import { Category } from './constants.js'
import { analyzeWebsite, generateQuestions, askGemini } from './services/apiService.js'
import { ResultsTable } from './components/ResultsTable.jsx'
import { ExportButton } from './components/ExportButton.jsx'
import { Search, Globe, ShieldCheck, Loader2, AlertCircle, BarChart3, Target, LayoutDashboard, MapPin, Flag, ExternalLink } from 'lucide-react'

function App() {
    const [state, setState] = useState({
        domain: '',
        nation: 'USA',
        state: '',
        queryContext: '',
        status: 'idle',
        analysis: null,
        results: [],
        error: null,
        progress: 0,
    })

    const handleInputChange = (field) => (e) => {
        let value = e.target.value
        if (field === 'domain') {
            value = value.replace(/https?:\/\//, '').split('/')[0].toLowerCase()
        }
        setState(prev => ({ ...prev, [field]: value, error: null }))
    }

    const handleUpdateQuestion = (id, newText) => {
        setState(prev => ({
            ...prev,
            results: prev.results.map(r => r.id === id ? { ...r, question: newText, fullAnswer: '', found: false } : r)
        }))
    }

    const handleRunSingleQuestion = async (id) => {
        const resultToRun = state.results.find(r => r.id === id)
        if (!resultToRun || !state.analysis) return

        setState(prev => ({
            ...prev,
            results: prev.results.map(r => r.id === id ? { ...r, loading: true } : r)
        }))

        try {
            const answer = await askGemini(resultToRun.question, state.nation, state.state || 'Local Area')
            const brandLower = state.analysis.brandName.toLowerCase()
            const domainLower = state.domain.toLowerCase()
            const found = answer.toLowerCase().includes(brandLower) || answer.toLowerCase().includes(domainLower)

            setState(prev => ({
                ...prev,
                results: prev.results.map(r => r.id === id ? {
                    ...r,
                    fullAnswer: answer,
                    found,
                    loading: false
                } : r)
            }))
        } catch (err) {
            console.error("Single question evaluation failed:", err)
            setState(prev => ({
                ...prev,
                results: prev.results.map(r => r.id === id ? { ...r, loading: false } : r)
            }))
        }
    }

    const runEvaluation = async () => {
        if (!state.domain || !state.nation) {
            setState(prev => ({ ...prev, error: "Please enter a valid domain and nation." }))
            return
        }

        setState(prev => ({ ...prev, status: 'analyzing', progress: 5, results: [], analysis: null }))

        try {
            const locationState = state.state || "Local Area"
            const analysis = await analyzeWebsite(state.domain, state.nation, locationState, state.queryContext)
            setState(prev => ({ ...prev, analysis, status: 'generating', progress: 20 }))

            const questions = await generateQuestions(analysis, state.domain, state.nation, locationState)
            setState(prev => ({ ...prev, status: 'evaluating', progress: 30 }))

            const evaluationResults = []
            const brandLower = analysis.brandName.toLowerCase()
            const domainLower = state.domain.toLowerCase()

            for (let i = 0; i < questions.length; i++) {
                const q = questions[i]
                const answer = await askGemini(q.text, state.nation, locationState)

                const found = answer.toLowerCase().includes(brandLower) || answer.toLowerCase().includes(domainLower)

                evaluationResults.push({
                    id: q.id,
                    category: q.category,
                    question: q.text,
                    fullAnswer: answer,
                    found,
                    loading: false
                })

                const currentProgress = 30 + Math.floor(((i + 1) / questions.length) * 70)
                setState(prev => ({ ...prev, results: [...evaluationResults], progress: currentProgress }))
            }

            setState(prev => ({ ...prev, status: 'completed', progress: 100 }))
        } catch (err) {
            console.error("Evaluation failed:", err)
            setState(prev => ({
                ...prev,
                status: 'error',
                error: err.message || "An unexpected error occurred during evaluation."
            }))
        }
    }

    const stats = useMemo(() => {
        const total = state.results.length
        if (total === 0) return { score: 0, foundCount: 0 }
        const foundCount = state.results.filter(r => r.found).length
        return {
            score: Math.round((foundCount / total) * 100),
            foundCount
        }
    }, [state.results])

    const isLoading = state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error'

    return (
        <div className="app-container">
            <header className="header">
                <div className="header-inner">
                    <div className="logo-section">
                        <div className="logo-icon">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="logo-title">Envision Website Evaluator</h1>
                    </div>

                    <div className="input-section">
                        <div className="input-grid">
                            <div className="input-wrapper">
                                <div className="input-icon">
                                    <Globe size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={state.domain}
                                    onChange={handleInputChange('domain')}
                                    placeholder="Domain (example.com)"
                                    className="text-input"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="input-wrapper">
                                <div className="input-icon">
                                    <Flag size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={state.nation}
                                    onChange={handleInputChange('nation')}
                                    placeholder="Nation (e.g. USA)"
                                    className="text-input"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="input-wrapper">
                                <div className="input-icon">
                                    <MapPin size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={state.state}
                                    onChange={handleInputChange('state')}
                                    placeholder="State (Optional)"
                                    className="text-input italic"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={runEvaluation}
                        disabled={isLoading || !state.domain || !state.nation}
                        className="btn-primary"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        {state.status === 'idle' ? 'Start Analysis' : isLoading ? 'Processing...' : 'Re-Run All'}
                    </button>
                </div>
                <div className="query-context-wrapper">
                    <textarea
                        value={state.queryContext}
                        onChange={handleInputChange('queryContext')}
                        placeholder="Describe your website info here (e.g., services offered, target audience, unique selling points, business description...)."
                        className="query-context-textarea"
                        disabled={isLoading}
                        rows={4}
                    />
                </div>

                {isLoading && (
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${state.progress}%` }}
                        />
                    </div>
                )}
            </header>

            <main className="main-content">
                {state.error && (
                    <div className="error-box">
                        <AlertCircle size={20} />
                        <p className="error-text">{state.error}</p>
                    </div>
                )}

                {state.analysis && (
                    <div className="stats-grid animate-in">
                        <div className="stat-card">
                            <div>
                                <div className="stat-header">
                                    <Target size={16} />
                                    Local Profile
                                </div>
                                <h2 className="stat-title">{state.analysis.brandName}</h2>
                                <div className="stat-location">
                                    <MapPin size={12} />
                                    {state.state || 'Generic'}, {state.nation}
                                </div>
                                <p className="stat-description">{state.analysis.niche}</p>
                                <div>
                                    <p className="stat-label">Focus</p>
                                    <p className="stat-value-text">{state.analysis.purpose}</p>
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <BarChart3 size={16} />
                                Visibility Score
                            </div>
                            <div className="score-container">
                                <span className="score-value">{stats.score}%</span>
                                <span className="score-label">Visibility</span>
                            </div>
                            <div className="score-bar-container">
                                <div
                                    className={`score-bar ${stats.score > 50 ? 'high' : 'low'}`}
                                    style={{ width: `${stats.score}%` }}
                                />
                            </div>
                            <p className="score-note">
                                Analyzing recommendations specific to {state.state || 'the region'}.
                            </p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <LayoutDashboard size={16} />
                                Processing Status
                            </div>
                            <div className="status-container">
                                <div className={`status-icon ${state.status === 'completed' ? 'completed' : 'loading'}`}>
                                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
                                </div>
                                <div>
                                    <h3 className="status-title">{state.status === 'completed' ? 'Evaluation Finished' : state.status.replace(/ing$/, 'ing...')}</h3>
                                    <p className="status-subtitle">{state.results.length} / 20 Scenarios analyzed</p>
                                </div>
                            </div>
                            <div className="category-tags">
                                {Object.values(Category).map(cat => (
                                    <span key={cat} className="category-tag">
                                        {cat.split(' ')[0]}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="results-container">
                    <div className="results-header">
                        <div>
                            <h3 className="results-title">Authority Breakdown</h3>
                            <p className="results-subtitle">Visual logs of location-specific recommendations. You can edit and rerun individual questions.</p>
                        </div>
                        {state.status === 'completed' && (
                            <ExportButton results={state.results} filename={`${state.domain}_${state.state || 'local'}`} />
                        )}
                    </div>
                    <div>
                        <ResultsTable
                            results={state.results}
                            brandName={state.analysis?.brandName}
                            domain={state.domain}
                            onUpdateQuestion={handleUpdateQuestion}
                            onRunSingleQuestion={handleRunSingleQuestion}
                        />
                    </div>
                </div>

                {state.status === 'idle' && (
                    <div className="welcome-section animate-in">
                        <div className="welcome-icon-container">
                            <Globe size={48} />
                        </div>
                        <h2 className="welcome-title">Evaluate Your Local Authority</h2>
                        <p className="welcome-description">
                            Find out if Gemini recommends your business in your specific region.
                            Enter your domain and location to see how you rank against local competitors.
                        </p>
                        <div className="features-grid">
                            <div className="feature-item">
                                <div className="feature-icon indigo">
                                    <MapPin size={20} />
                                </div>
                                <span className="feature-label">Region Specific</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon emerald">
                                    <Target size={20} />
                                </div>
                                <span className="feature-label">Brand Detection</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon rose">
                                    <ExternalLink size={20} />
                                </div>
                                <span className="feature-label">Competitor Audit</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="footer">
                <p>&copy; {new Date().getFullYear()} Envision Website Evaluator. Advanced Location Contextual Reasoning Engine.</p>
            </footer>
        </div>
    )
}

export default App
