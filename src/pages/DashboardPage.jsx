import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Category } from '../constants.js'
import { analyzeWebsite, generateQuestions, askChatGPT, getProjectById, getCompanyById, getPromptQuestionsData, getAllCategories, getGeneratedMetrics, calculateGeoMetrics } from '../services/apiService.js'
import { ResultsTable } from '../components/ResultsTable.jsx'
import { ExportButton } from '../components/ExportButton.jsx'
import { Search, Globe, ShieldCheck, Loader2, AlertCircle, BarChart3, Target, LayoutDashboard, MapPin, Flag, ExternalLink, ChevronRight, Play, Plus, Calculator } from 'lucide-react'

function DashboardPage() {
    const { projectId } = useParams()
    const [project, setProject] = useState(null)
    const [company, setCompany] = useState(null)
    const [categories, setCategories] = useState([])
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
        promptQuestionsId: null,
        geoMetrics: null,
        metricsChecked: false,
        isCalculatingMetrics: false,
        metricsDate: null,  // 🆕 Last calculated date from createdAt
    })

    useEffect(() => {
        loadProjectData()
        loadCategories()
    }, [projectId])

    const loadCategories = async () => {
        try {
            const categoriesData = await getAllCategories()
            setCategories(categoriesData || [])
        } catch (err) {
            console.error('Failed to load categories:', err)
        }
    }

    const loadProjectData = async () => {
        try {
            const projectData = await getProjectById(projectId)
            setProject(projectData)

            const companyData = await getCompanyById(projectData.company_id)
            setCompany(companyData)

            setState(prev => ({
                ...prev,
                domain: projectData.domain || '',
                nation: projectData.nation || 'USA',
                state: projectData.state || ''
            }))

            // Fetch existing analyzing and questions data for this project
            try {
                const promptData = await getPromptQuestionsData(projectId)
                if (promptData && promptData.chatgpt_website_analysis) {
                    // Parse the JSON string from chatgpt_website_analysis
                    const analysis = typeof promptData.chatgpt_website_analysis === 'string'
                        ? JSON.parse(promptData.chatgpt_website_analysis)
                        : promptData.chatgpt_website_analysis

                    const promptQuestionsId = promptData._id || null

                    // Map qna array to results format
                    const questionResults = (promptData.qna || []).map((q, idx) => {
                        const hasAnswer = q.answer && q.answer !== 'Not available yet'
                        return {
                            id: `qna-${idx}`,
                            category: q.category_name || 'General',
                            categoryId: q.category_id,
                            uuid: q.uuid,
                            question: q.question || '',
                            fullAnswer: hasAnswer ? q.answer : '',
                            found: q.capture || false,
                            loading: false
                        }
                    })

                    // Update domain, nation, state from promptData if available
                    setState(prev => ({
                        ...prev,
                        domain: promptData.website_url || prev.domain,
                        nation: promptData.nation || prev.nation,
                        state: promptData.state || prev.state,
                        queryContext: promptData.context || prev.queryContext,
                        analysis,
                        promptQuestionsId,
                        results: questionResults,
                        status: questionResults.length > 0 ? (questionResults.every(q => q.fullAnswer) ? 'completed' : 'questions_ready') : 'idle',
                        progress: 100
                    }))
                }
            } catch (promptErr) {
                console.log('No existing prompt data found for project:', promptErr.message)
            }
        } catch (err) {
            console.error('Failed to load project:', err)
        }
    }

    // Fetch geo metrics when status becomes completed
    // Only check for pre-generated metrics, don't auto-calculate
    useEffect(() => {
        const checkGeneratedMetrics = async () => {
            if (state.status === 'completed' && state.promptQuestionsId && !state.metricsChecked) {
                try {
                    // Try to get pre-generated metrics
                    const generatedMetrics = await getGeneratedMetrics(state.promptQuestionsId)

                    // Check if metrics data exists (has brand_name or total_prompts)
                    if (generatedMetrics && (generatedMetrics.brand_name || generatedMetrics.total_prompts)) {
                        console.log('Using pre-generated metrics')
                        // 🆕 Extract createdAt date
                        const metricsDate = generatedMetrics.createdAt ? new Date(generatedMetrics.createdAt) : null
                        setState(prev => ({ ...prev, geoMetrics: generatedMetrics, metricsChecked: true, metricsDate }))
                    } else {
                        // No pre-generated metrics, user needs to click Calculate button
                        console.log('No pre-generated metrics found')
                        setState(prev => ({ ...prev, metricsChecked: true }))
                    }
                } catch (err) {
                    console.error('Failed to get generated metrics:', err)
                    setState(prev => ({ ...prev, metricsChecked: true }))
                }
            }
        }
        checkGeneratedMetrics()
    }, [state.status, state.promptQuestionsId])

    // Handle Calculate Metrics button click
    const handleCalculateMetrics = async () => {
        if (!state.promptQuestionsId) return

        setState(prev => ({ ...prev, isCalculatingMetrics: true }))

        try {
            const calculatedMetrics = await calculateGeoMetrics(state.promptQuestionsId)
            // 🆕 Parse createdAt from response (new entry created on every recalculate)
            const metricsDate = calculatedMetrics.createdAt ? new Date(calculatedMetrics.createdAt) : new Date()
            setState(prev => ({ ...prev, geoMetrics: calculatedMetrics, isCalculatingMetrics: false, metricsDate }))
        } catch (err) {
            console.error('Failed to calculate geo metrics:', err)
            setState(prev => ({ ...prev, isCalculatingMetrics: false }))
            alert('Failed to calculate metrics. Please try again.')
        }
    }

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

    const handleAddQuestion = (questionText, categoryId, categoryName = 'Custom Question') => {
        const newQuestion = {
            id: `custom-${Date.now()}`,
            category: categoryName,
            categoryId: categoryId,
            question: questionText,
            fullAnswer: '',
            found: false,
            loading: false
        }
        setState(prev => ({
            ...prev,
            results: [...prev.results, newQuestion]
        }))
    }

    const handleDeleteQuestion = (id) => {
        setState(prev => ({
            ...prev,
            results: prev.results.filter(r => r.id !== id)
        }))
    }

    const handleRunSingleQuestion = async (id) => {
        const resultToRun = state.results.find(r => r.id === id)
        if (!resultToRun || !state.analysis) return

        setState(prev => ({
            ...prev,
            results: prev.results.map(r => r.id === id ? { ...r, loading: true } : r)
        }))
        console.log("resultToRun--->", resultToRun)
        try {
            const answer = await askChatGPT(resultToRun.question, state.nation, state.state || 'across country', state.promptQuestionsId, resultToRun.categoryId, resultToRun.uuid)
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

    const handleRunAllQuestions = async () => {
        if (!state.analysis || state.results.length === 0) return

        const brandLower = state.analysis.brandName.toLowerCase()
        const domainLower = state.domain.toLowerCase()
        const locationState = state.state || 'across country'

        setState(prev => ({ ...prev, status: 'evaluating', progress: 30 }))

        for (let i = 0; i < state.results.length; i++) {
            const result = state.results[i]
            if (result.fullAnswer) continue

            setState(prev => ({
                ...prev,
                results: prev.results.map(r => r.id === result.id ? { ...r, loading: true } : r)
            }))

            try {
                const answer = await askChatGPT(result.question, state.nation, locationState, state.promptQuestionsId, result.categoryId, result.uuid)
                const found = answer.toLowerCase().includes(brandLower) || answer.toLowerCase().includes(domainLower)

                setState(prev => ({
                    ...prev,
                    results: prev.results.map(r => r.id === result.id ? {
                        ...r,
                        fullAnswer: answer,
                        found,
                        loading: false
                    } : r)
                }))
            } catch (err) {
                console.error("Question evaluation failed:", err)
                setState(prev => ({
                    ...prev,
                    results: prev.results.map(r => r.id === result.id ? { ...r, loading: false } : r)
                }))
            }

            const currentProgress = 30 + Math.floor(((i + 1) / state.results.length) * 70)
            setState(prev => ({ ...prev, progress: currentProgress }))
        }

        setState(prev => ({ ...prev, status: 'completed', progress: 100 }))
    }

    const runEvaluation = async () => {
        if (!state.domain || !state.nation) {
            setState(prev => ({ ...prev, error: "Please enter a valid domain and nation." }))
            return
        }

        setState(prev => ({ ...prev, status: 'analyzing', progress: 5, results: [], analysis: null, promptQuestionsId: null }))

        try {
            const locationState = state.state || 'across country'
            const analyzeResponse = await analyzeWebsite(state.domain, state.nation, locationState, state.queryContext, company?.id, projectId)

            const analysis = analyzeResponse.website_analysis || analyzeResponse
            const promptQuestionsId = analyzeResponse.prompt_questions_id || null

            setState(prev => ({ ...prev, analysis, promptQuestionsId, status: 'generating', progress: 20 }))

            const questions = await generateQuestions(analysis, state.domain, state.nation, locationState, promptQuestionsId)

            const questionResults = questions.map(q => ({
                id: q.id,
                category: q.category,
                categoryId: q.category_id || null,
                uuid: q.uuid,
                question: q.text,
                fullAnswer: '',
                found: false,
                loading: false
            }))

            setState(prev => ({ ...prev, results: questionResults, status: 'questions_ready', progress: 100 }))
        } catch (err) {
            console.error("Analysis failed:", err)
            setState(prev => ({
                ...prev,
                status: 'error',
                error: err.message || "An unexpected error occurred during analysis."
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

    const isLoading = state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error' && state.status !== 'questions_ready'
    const hasUnansweredQuestions = state.results.some(r => !r.fullAnswer)
    const isAnyLoading = state.results.some(r => r.loading)

    return (
        <div className="app-container">
            <nav className="breadcrumb dashboard-breadcrumb">
                <Link to="/">Companies</Link>
                <ChevronRight size={16} />
                <Link to={`/companies/${company?.id}/projects`}>{company?.name || 'Projects'}</Link>
                <ChevronRight size={16} />
                <span>{project?.name || 'Dashboard'}</span>
            </nav>

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
                        <div className="stat-card stat-card-profile">
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
                                <div className="stat-niche-badge">{state.analysis.niche}</div>
                                <div className="stat-section">
                                    <p className="stat-label">Purpose</p>
                                    <p className="stat-value-text">{state.analysis.purpose}</p>
                                </div>
                                {state.analysis.services && state.analysis.services.length > 0 && (
                                    <div className="stat-section">
                                        <p className="stat-label">Services</p>
                                        <ul className="services-list">
                                            {state.analysis.services.slice(0, 10).map((service, idx) => (
                                                <li key={idx} className="service-item">{service}</li>
                                            ))}
                                            {state.analysis.services.length > 10 && (
                                                <li className="service-item service-etc">...etc.</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
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
                            {state.geoMetrics?.brand_agnostic_metrics && (
                                <div className="brand-agnostic-section">
                                    <p className="stat-label agnostic-label">🔍 Brand Agnostic Metrics (Organic Discovery)</p>
                                    <div className="geo-metrics-grid agnostic-grid">
                                        <div className="geo-metric-item agnostic-item">
                                            <span className="geo-metric-value">{state.geoMetrics.brand_agnostic_metrics.total_prompts}</span>
                                            <span className="geo-metric-label">Total Prompts</span>
                                        </div>
                                        <div className="geo-metric-item agnostic-item">
                                            <span className="geo-metric-value">{state.geoMetrics.brand_agnostic_metrics.mentions}</span>
                                            <span className="geo-metric-label">Mentions</span>
                                        </div>
                                        <div className="geo-metric-item agnostic-item">
                                            <span className="geo-metric-value">{state.geoMetrics.brand_agnostic_metrics.brand_mention_rate?.toFixed(1)}%</span>
                                            <span className="geo-metric-label">Mention Rate</span>
                                        </div>
                                        <div className="geo-metric-item agnostic-item">
                                            <span className="geo-metric-value">{state.geoMetrics.brand_agnostic_metrics.top_3_position_rate?.toFixed(1)}%</span>
                                            <span className="geo-metric-label">Top 3 Rate</span>
                                        </div>
                                        <div className="geo-metric-item agnostic-item">
                                            <span className="geo-metric-value">{state.geoMetrics.brand_agnostic_metrics.recommendation_rate?.toFixed(1)}%</span>
                                            <span className="geo-metric-label">Recommend Rate</span>
                                        </div>
                                        <div className="geo-metric-item agnostic-item">
                                            <span className="geo-metric-value">{state.geoMetrics.brand_agnostic_metrics.zero_mention_count}</span>
                                            <span className="geo-metric-label">Zero Mentions</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {state.geoMetrics?.brand_features && state.geoMetrics.brand_features.length > 0 && (
                                <div className="brand-features-section">
                                    <p className="stat-label">Brand Features</p>
                                    <div className="brand-features-tags">
                                        {state.geoMetrics.brand_features.slice(0, 10).map((feature, idx) => (
                                            <span key={idx} className="brand-feature-tag">{feature}</span>
                                        ))}
                                        {state.geoMetrics.brand_features.length > 10 && (
                                            <span className="brand-feature-tag brand-feature-etc">...etc.</span>
                                        )}
                                    </div>
                                </div>
                            )}
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
                        <div className="results-actions">
                            {(state.status === 'questions_ready' || state.status === 'completed' || state.status === 'evaluating') && hasUnansweredQuestions && (
                                <button
                                    onClick={handleRunAllQuestions}
                                    disabled={isAnyLoading}
                                    className="btn-run-all"
                                >
                                    {isAnyLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                                    Run All Questions
                                </button>
                            )}
                            {/* 🆕 Calculate Metrics always visible when completed (left side) */}
                            {state.status === 'completed' && state.metricsChecked && (
                                <button
                                    onClick={handleCalculateMetrics}
                                    disabled={state.isCalculatingMetrics}
                                    className="btn-calculate-metrics"
                                >
                                    {state.isCalculatingMetrics ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                                    {state.isCalculatingMetrics ? 'Calculating...' : state.geoMetrics ? 'Recalculate Metrics' : 'Calculate Metrics'}
                                </button>
                            )}
                            {/* 🆕 Last calculated date display */}
                            {state.metricsDate && (
                                <span className="metrics-date">
                                    Last: {state.metricsDate.toLocaleDateString()} {state.metricsDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            {/* 🆕 Export disabled until geoMetrics exists */}
                            {state.status === 'completed' && (
                                <ExportButton
                                    results={state.results}
                                    filename={`${state.domain}_${state.state || 'local'}`}
                                    geoMetrics={state.geoMetrics}
                                    disabled={!state.geoMetrics}
                                />
                            )}
                        </div>
                    </div>
                    <div>
                        <ResultsTable
                            results={state.results}
                            brandName={state.analysis?.brandName}
                            domain={state.domain}
                            onUpdateQuestion={handleUpdateQuestion}
                            onRunSingleQuestion={handleRunSingleQuestion}
                            onAddQuestion={handleAddQuestion}
                            onDeleteQuestion={handleDeleteQuestion}
                            categories={categories}
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
                            Find out if ChatGPT recommends your business in your specific region.
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

export default DashboardPage