import React from 'react'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'

export function ExportButton({ results, filename }) {
    const handleExport = () => {
        const data = results.map(r => ({
            Category: r.category,
            Question: r.question,
            'Gemini Full Answer': r.fullAnswer,
            'Found (True/False)': r.found ? 'TRUE' : 'FALSE'
        }))

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Authority Evaluation")

        const maxWidths = [
            { wch: 25 },
            { wch: 50 },
            { wch: 80 },
            { wch: 15 }
        ]
        worksheet['!cols'] = maxWidths

        XLSX.writeFile(workbook, `${filename}_authority_report.xlsx`)
    }

    return (
        <button
            onClick={handleExport}
            className="btn-export"
            disabled={results.length === 0}
        >
            <Download size={16} />
            Export to Excel (.xlsx)
        </button>
    )
}
