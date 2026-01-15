import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Loader2 } from 'lucide-react'
import { calculateGeoMetrics } from '../services/apiService.js'

export function ExportButton({ results, filename, promptQuestionsId }) {
    const [isExporting, setIsExporting] = useState(false)

    const generateConclusions = (metrics) => {
        const conclusions = []

        // Brand Mention Analysis
        if (metrics.brand_mention_rate >= 50) {
            conclusions.push(`✅ Strong Brand Visibility: ${metrics.brand_name} is mentioned in ${metrics.brand_mention_rate}% of prompts, indicating good AI recognition.`)
        } else if (metrics.brand_mention_rate >= 25) {
            conclusions.push(`⚠️ Moderate Brand Visibility: ${metrics.brand_name} appears in ${metrics.brand_mention_rate}% of prompts. There's room for improvement in AI recommendations.`)
        } else {
            conclusions.push(`❌ Low Brand Visibility: ${metrics.brand_name} only appears in ${metrics.brand_mention_rate}% of prompts. Significant SEO and content optimization needed.`)
        }

        // Top 3 Position Analysis
        if (metrics.top_3_position_rate >= 50) {
            conclusions.push(`✅ Excellent Positioning: Brand appears in top 3 recommendations ${metrics.top_3_position_rate}% of the time.`)
        } else if (metrics.top_3_position_rate > 0) {
            conclusions.push(`⚠️ Average Positioning: Brand achieves top 3 position only ${metrics.top_3_position_rate}% of the time. Consider strengthening unique value propositions.`)
        } else {
            conclusions.push(`❌ Poor Positioning: Brand never appears in top 3 recommendations. Focus on differentiating factors and local SEO.`)
        }

        // Sentiment Analysis
        if (metrics.positive_sentiment_rate >= 80) {
            conclusions.push(`✅ Positive Brand Perception: ${metrics.positive_sentiment_rate}% positive sentiment indicates strong reputation.`)
        } else if (metrics.positive_sentiment_rate >= 50) {
            conclusions.push(`⚠️ Mixed Sentiment: ${metrics.positive_sentiment_rate}% positive sentiment. Address customer feedback and improve service quality.`)
        }

        // Zero Mention Analysis
        if (metrics.zero_mention_count > 0) {
            conclusions.push(`📊 Opportunity Areas: ${metrics.zero_mention_count} prompts where brand wasn't mentioned. Review these prompts to identify content gaps.`)
        }

        // Competitor Analysis
        const competitorCount = Object.keys(metrics.competitor_mentions || {}).length
        if (competitorCount > 0) {
            conclusions.push(`🔍 Competitive Landscape: ${competitorCount} competitors identified in AI responses. Analyze their strengths for improvement opportunities.`)
        }

        // Brand Features
        if (metrics.brand_features && metrics.brand_features.length > 0) {
            conclusions.push(`💡 Key Differentiators: Your brand is recognized for: ${metrics.brand_features.join(', ')}.`)
        }

        // Overall Recommendation
        if (metrics.brand_mention_rate >= 50 && metrics.positive_sentiment_rate >= 70) {
            conclusions.push(`🎯 Overall: ${metrics.brand_name} has strong AI visibility. Continue current strategies and focus on maintaining consistency.`)
        } else if (metrics.brand_mention_rate >= 25) {
            conclusions.push(`🎯 Overall: ${metrics.brand_name} has potential but needs targeted improvements in content and local SEO optimization.`)
        } else {
            conclusions.push(`🎯 Overall: Immediate action required to improve ${metrics.brand_name}'s AI visibility. Focus on structured data, local citations, and content strategy.`)
        }

        return conclusions
    }

    const handleExport = async () => {
        setIsExporting(true)

        try {
            // Fetch geo metrics from API
            const metrics = await calculateGeoMetrics(promptQuestionsId)
            const conclusions = generateConclusions(metrics)

            const workbook = XLSX.utils.book_new()

            // Sheet 1: Executive Summary
            const summaryData = [
                ['BRAND PERFORMANCE REPORT'],
                [''],
                ['Brand Name', metrics.brand_name],
                ['Report Generated', new Date().toLocaleString()],
                [''],
                ['KEY METRICS'],
                ['Total Prompts Analyzed', metrics.total_prompts],
                ['Total Brand Mentions', metrics.total_mentions],
                ['Brand Mention Rate', `${metrics.brand_mention_rate}%`],
                ['Top 3 Position Rate', `${metrics.top_3_position_rate}%`],
                ['Recommendation Rate', `${metrics.recommendation_rate}%`],
                ['Positive Sentiment Rate', `${metrics.positive_sentiment_rate}%`],
                ['First Party Citations', metrics.first_party_citations],
                ['First Party Citation Rate', `${metrics.first_party_citation_rate}%`],
                [''],
                ['BRAND FEATURES RECOGNIZED'],
                ...(metrics.brand_features || []).map(f => [f]),
                [''],
                ['CONCLUSIONS & RECOMMENDATIONS'],
                ...conclusions.map(c => [c]),
            ]
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
            summarySheet['!cols'] = [{ wch: 80 }, { wch: 40 }]
            // Style for header
            summarySheet['A1'] = { v: 'BRAND PERFORMANCE REPORT', t: 's', s: { font: { bold: true, sz: 16 } } }
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary')

            // Sheet 2: Metrics Analysis
            const metricsData = [
                ['DETAILED METRICS ANALYSIS'],
                [''],
                ['Metric', 'Value', 'Status'],
                ['Total Prompts', metrics.total_prompts, 'Baseline'],
                ['Total Mentions', metrics.total_mentions, metrics.total_mentions > 0 ? '✓ Good' : '✗ Needs Work'],
                ['Brand Mention Rate', `${metrics.brand_mention_rate}%`, metrics.brand_mention_rate >= 50 ? '✓ Excellent' : metrics.brand_mention_rate >= 25 ? '⚠ Moderate' : '✗ Low'],
                ['Top 3 Mentions', metrics.top_3_mentions, metrics.top_3_mentions > 0 ? '✓ Good' : '✗ Not in Top 3'],
                ['Top 3 Position Rate', `${metrics.top_3_position_rate}%`, metrics.top_3_position_rate >= 50 ? '✓ Excellent' : '⚠ Needs Improvement'],
                ['Zero Mention Count', metrics.zero_mention_count, metrics.zero_mention_count === 0 ? '✓ Perfect' : `⚠ ${metrics.zero_mention_count} Opportunities`],
                ['Recommendation Rate', `${metrics.recommendation_rate}%`, metrics.recommendation_rate >= 50 ? '✓ Good' : '⚠ Low'],
                ['Positive Sentiment', `${metrics.positive_sentiment_rate}%`, metrics.positive_sentiment_rate >= 80 ? '✓ Excellent' : '⚠ Mixed'],
                ['Comparison Presence', metrics.comparison_presence, ''],
                ['Using LLM Flags', metrics.using_llm_flags ? 'Yes' : 'No', ''],
            ]
            const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData)
            metricsSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }]
            XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics Analysis')

            // Sheet 3: Competitor Analysis
            const competitorEntries = Object.entries(metrics.competitor_mentions || {})
            const competitorData = [
                ['COMPETITOR ANALYSIS'],
                [''],
                ['Competitor', 'Mention Count'],
                ...(competitorEntries.length > 0
                    ? competitorEntries.sort((a, b) => b[1] - a[1]).map(([name, count]) => [name, count])
                    : [['No competitors identified in responses', '']]),
                [''],
                ['Analysis Notes'],
                [competitorEntries.length > 0
                    ? `${competitorEntries.length} competitors were mentioned in AI responses. Focus on differentiating your brand from these competitors.`
                    : 'No direct competitors were mentioned. This could indicate a niche market or need for broader keyword targeting.'],
            ]
            const competitorSheet = XLSX.utils.aoa_to_sheet(competitorData)
            competitorSheet['!cols'] = [{ wch: 40 }, { wch: 20 }]
            XLSX.utils.book_append_sheet(workbook, competitorSheet, 'Competitor Analysis')

            // Sheet 4: Zero Mention Prompts (Opportunities)
            const zeroMentionData = [
                ['IMPROVEMENT OPPORTUNITIES'],
                ['(Prompts where brand was NOT mentioned)'],
                [''],
                ['Question', 'Answer Snippet', 'Category'],
                ...(metrics.zero_mention_prompts || []).map(p => [
                    p.question,
                    p.answer_snippet,
                    p.category_name
                ]),
            ]
            if ((metrics.zero_mention_prompts || []).length === 0) {
                zeroMentionData.push(['🎉 Congratulations! Brand was mentioned in all prompts.', '', ''])
            }
            const zeroMentionSheet = XLSX.utils.aoa_to_sheet(zeroMentionData)
            zeroMentionSheet['!cols'] = [{ wch: 60 }, { wch: 80 }, { wch: 20 }]
            XLSX.utils.book_append_sheet(workbook, zeroMentionSheet, 'Zero Mention Prompts')

            // Sheet 5: All Q&A Data - Organized by Category
            const qnaData = [
                ['QUESTION & ANSWER ANALYSIS BY CATEGORY'],
                [''],
            ]

            // Group results by category
            const groupedByCategory = results.reduce((acc, r) => {
                const cat = r.category || 'Uncategorized'
                if (!acc[cat]) acc[cat] = []
                acc[cat].push(r)
                return acc
            }, {})

            // Add category-wise sections
            Object.entries(groupedByCategory).forEach(([category, items]) => {
                const foundCount = items.filter(i => i.found).length
                const totalCount = items.length
                const foundRate = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0

                // Category Header
                qnaData.push([''])
                qnaData.push([`📂 ${category.toUpperCase()}`])
                qnaData.push([`Found: ${foundCount}/${totalCount} (${foundRate}%)`, '', '', foundRate >= 50 ? '✅ Good' : foundRate > 0 ? '⚠️ Needs Improvement' : '❌ Not Visible'])
                qnaData.push([''])
                qnaData.push(['#', 'Question', 'ChatGPT Answer', 'Brand Found', 'Status'])

                // Add each Q&A in this category
                items.forEach((r, idx) => {
                    qnaData.push([
                        idx + 1,
                        r.question,
                        r.fullAnswer || '(Not answered yet)',
                        r.found ? 'YES ✓' : 'NO ✗',
                        r.found ? '✅ Visible' : '❌ Not Found'
                    ])
                })
            })

            // Add Summary at the end
            const totalFound = results.filter(r => r.found).length
            const totalQuestions = results.length
            const overallRate = totalQuestions > 0 ? Math.round((totalFound / totalQuestions) * 100) : 0

            qnaData.push([''])
            qnaData.push(['═══════════════════════════════════════════════════════════'])
            qnaData.push(['OVERALL SUMMARY'])
            qnaData.push(['Total Questions', totalQuestions])
            qnaData.push(['Brand Found', totalFound])
            qnaData.push(['Brand Not Found', totalQuestions - totalFound])
            qnaData.push(['Visibility Rate', `${overallRate}%`])
            qnaData.push(['Performance', overallRate >= 70 ? '🏆 Excellent' : overallRate >= 50 ? '✅ Good' : overallRate >= 25 ? '⚠️ Needs Work' : '❌ Critical - Immediate Action Required'])

            const qnaSheet = XLSX.utils.aoa_to_sheet(qnaData)
            qnaSheet['!cols'] = [{ wch: 5 }, { wch: 60 }, { wch: 100 }, { wch: 15 }, { wch: 18 }]
            XLSX.utils.book_append_sheet(workbook, qnaSheet, 'All Q&A Data')

            // Download the workbook
            XLSX.writeFile(workbook, `${filename}_comprehensive_report.xlsx`)
        } catch (error) {
            console.error('Export failed:', error)
            alert('Failed to generate report. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button
            onClick={handleExport}
            className="btn-export"
            disabled={results.length === 0 || isExporting}
        >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Generating Report...' : 'Export to Excel (.xlsx)'}
        </button>
    )
}
