const API_BASE_URL = '/api'

export async function analyzeWebsite(domain, nation, state, queryContext = "") {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain, nation, state, queryContext })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to analyze website')
    }

    return response.json()
}

export async function generateQuestions(analysis, domain, nation, state) {
    const response = await fetch(`${API_BASE_URL}/generate-questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analysis, domain, nation, state })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to generate questions')
    }

    return response.json()
}

export async function askGemini(question, nation, state) {
    const response = await fetch(`${API_BASE_URL}/ask-chatgpt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question, nation, state })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to get answer')
    }

    const data = await response.json()
    return data.answer
}

export async function getCompanies() {
    const response = await fetch(`${API_BASE_URL}/companies`)
    if (!response.ok) throw new Error('Failed to fetch companies')
    const data = await response.json()
    return data.companies
}

export async function getCompanyById(companyId) {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}`)
    if (!response.ok) throw new Error('Failed to fetch company')
    return response.json()
}

export async function createCompany(companyData) {
    const response = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
    })
    if (!response.ok) throw new Error('Failed to create company')
    return response.json()
}

export async function deleteCompany(companyId) {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete company')
    return response.json()
}

export async function getProjectsByCompany(companyId) {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/projects`)
    if (!response.ok) throw new Error('Failed to fetch projects')
    const data = await response.json()
    return data.projects
}

export async function getProjectById(projectId) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`)
    if (!response.ok) throw new Error('Failed to fetch project')
    return response.json()
}

export async function createProject(companyId, projectData) {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
    })
    if (!response.ok) throw new Error('Failed to create project')
    return response.json()
}

export async function deleteProject(projectId) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete project')
    return response.json()
}
