const API_BASE_URL = 'http://localhost:8000/api'

export async function analyzeWebsite(domain, nation, state, queryContext = "", companyId = null, projectId = null) {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain, nation, state, queryContext, company_id: companyId, project_id: projectId })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to analyze website')
    }

    return response.json()
}

export async function generateQuestions(analysis, domain, nation, state, promptQuestionsId = null) {
    const response = await fetch(`${API_BASE_URL}/generate-questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analysis, domain, nation, state, prompt_questions_id: promptQuestionsId })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to generate questions')
    }

    return response.json()
}


export async function askChatGPT(question, nation, state, promptQuestionsId = null, categoryId = null, uuid = null) {
    const response = await fetch(`${API_BASE_URL}/ask-chatgpt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question, nation, state, prompt_questions_id: promptQuestionsId, category_id: categoryId, uuid: uuid })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to get answer')
    }

    const data = await response.json()
    return data.answer
}

export async function askGemini(question, nation, state, promptQuestionsId = null, categoryId = null, uuid = null) {
    const response = await fetch(`${API_BASE_URL}/ask-gemini`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question, nation, state, prompt_questions_id: promptQuestionsId, category_id: categoryId, uuid: uuid })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to get answer from Gemini')
    }

    const data = await response.json()
    return data.answer
}

export async function getCompanies() {
    const response = await fetch(`${API_BASE_URL}/companies/list`, { method: "POST" })
    if (!response.ok) throw new Error('Failed to fetch companies')
    const data = await response.json()
    return data.companies
}

export async function getCompanyById(companyId) {
    const response = await fetch(`${API_BASE_URL}/companies/get-company/${companyId}`, { method: "POST" })
    if (!response.ok) throw new Error('Failed to fetch company')
    return response.json()
}

export async function createCompany(companyData) {
    const response = await fetch(`${API_BASE_URL}/companies/add-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
    })
    if (!response.ok) throw new Error('Failed to create company')
    return response.json()
}

export async function deleteCompany(companyId) {
    const response = await fetch(`${API_BASE_URL}/companies/delete-company/${companyId}`, {
        method: 'POST'
    })
    if (!response.ok) throw new Error('Failed to delete company')
    return response.json()
}

export async function getProjectsByCompany(companyId) {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/projects`, { method: "POST" })
    if (!response.ok) throw new Error('Failed to fetch projects')
    const data = await response.json()
    return data.projects
}

export async function getProjectById(projectId) {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, { method: "POST" })
    if (!response.ok) throw new Error('Failed to fetch project')
    return response.json()
}

export async function createProject(companyId, projectData) {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/add-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
    })
    if (!response.ok) throw new Error('Failed to create project')
    return response.json()
}

export async function deleteProject(projectId) {
    const response = await fetch(`${API_BASE_URL}/delete-projects/${projectId}`, {
        method: 'POST'
    })
    if (!response.ok) throw new Error('Failed to delete project')
    return response.json()
}

export async function getPromptQuestionsData(projectId) {
    const response = await fetch(`${API_BASE_URL}/category/get-prompt-questions-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId })
    })
    if (!response.ok) throw new Error('Failed to fetch prompt questions data')
    return response.json()
}

export async function getAllCategories() {
    const response = await fetch(`${API_BASE_URL}/category/get-all-category`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        }
    })
    if (!response.ok) throw new Error('Failed to fetch categories')
    return response.json()
}

export async function getGeneratedMetrics(promptQuestionId) {
    const response = await fetch(`${API_BASE_URL}/category/get-genrated-metrics`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ prompt_question_id: promptQuestionId })
    })
    if (!response.ok) throw new Error('Failed to get generated metrics')
    return response.json()
}

export async function calculateGeoMetrics(promptQuestionId) {
    const response = await fetch(`${API_BASE_URL}/category/calculate-geo-metrics`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ prompt_question_id: promptQuestionId })
    })
    if (!response.ok) throw new Error('Failed to calculate geo metrics')
    return response.json()
}