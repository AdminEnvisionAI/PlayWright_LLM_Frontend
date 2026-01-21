import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Loader2 } from 'lucide-react'

export function ExportButton({ results, filename, geoMetrics, disabled = false }) {
    const [isExporting, setIsExporting] = useState(false)

    const generateConclusions = (metrics) => {
        const conclusions = []
        const brandAgnostic = metrics.brand_agnostic_metrics || {}
        const brandIncluded = metrics.brand_included_metrics || {}
        const brandName = metrics.brand_name || 'Brand'

        // Brand Agnostic Mention Analysis (Organic Discovery)
        if (brandAgnostic.brand_mention_rate >= 50) {
            conclusions.push(`✅ Strong Organic Visibility: ${brandName} is organically mentioned in ${brandAgnostic.brand_mention_rate}% of generic prompts (without brand name), indicating excellent AI recognition.`)
        } else if (brandAgnostic.brand_mention_rate >= 25) {
            conclusions.push(`⚠️ Moderate Organic Visibility: ${brandName} appears in ${brandAgnostic.brand_mention_rate}% of generic prompts. There's room for improvement in organic AI recommendations.`)
        } else if (brandAgnostic.brand_mention_rate > 0) {
            conclusions.push(`⚠️ Low Organic Visibility: ${brandName} only appears in ${brandAgnostic.brand_mention_rate}% of generic prompts. SEO and content optimization needed.`)
        } else {
            conclusions.push(`❌ No Organic Visibility: ${brandName} is not appearing in any generic prompts (0% organic mention rate). Immediate action required for AI visibility.`)
        }

        // Top 3 Position Analysis (Brand Agnostic)
        if (brandAgnostic.top_3_position_rate >= 50) {
            conclusions.push(`✅ Excellent Organic Positioning: Brand appears in top 3 recommendations ${brandAgnostic.top_3_position_rate}% of the time in generic searches.`)
        } else if (brandAgnostic.top_3_position_rate > 0) {
            conclusions.push(`⚠️ Average Organic Positioning: Brand achieves top 3 position only ${brandAgnostic.top_3_position_rate}% of the time in generic searches.`)
        } else {
            conclusions.push(`❌ Poor Organic Positioning: Brand never appears in top 3 for generic searches. Focus on differentiating factors and local SEO.`)
        }

        // Positive Sentiment Analysis (from Brand Included - meaningful when brand is mentioned)
        if (brandIncluded.positive_sentiment_rate >= 80) {
            conclusions.push(`✅ Positive Brand Perception: ${brandIncluded.positive_sentiment_rate}% positive sentiment when brand is mentioned, indicating strong reputation.`)
        } else if (brandIncluded.positive_sentiment_rate >= 50) {
            conclusions.push(`⚠️ Mixed Sentiment: ${brandIncluded.positive_sentiment_rate}% positive sentiment. Address customer feedback and improve service quality.`)
        } else if (brandIncluded.positive_sentiment_rate > 0) {
            conclusions.push(`⚠️ Low Sentiment: Only ${brandIncluded.positive_sentiment_rate}% positive sentiment. Review AI responses for improvement areas.`)
        }

        // Zero Mention Analysis (Brand Agnostic)
        if (brandAgnostic.zero_mention_count > 0) {
            conclusions.push(`📊 Opportunity Areas: ${brandAgnostic.zero_mention_count} generic prompts where brand wasn't mentioned organically. Review these prompts to identify content gaps.`)
        } else if (brandAgnostic.total_prompts > 0) {
            conclusions.push(`🎉 Perfect Organic Coverage: Brand was mentioned in all ${brandAgnostic.total_prompts} generic prompts!`)
        }

        // Recommendation Rate (Brand Agnostic)
        if (brandAgnostic.recommendation_rate >= 50) {
            conclusions.push(`✅ High Recommendation Rate: ${brandAgnostic.recommendation_rate}% recommendation rate in organic searches.`)
        } else if (brandAgnostic.recommendation_rate > 0) {
            conclusions.push(`⚠️ Low Recommendation Rate: Only ${brandAgnostic.recommendation_rate}% recommendation rate in organic searches. Improve brand perception.`)
        }

        // Competitor Analysis
        const competitorCount = Object.keys(metrics.competitor_mentions || {}).length
        if (competitorCount > 0) {
            conclusions.push(`🔍 Competitive Landscape: ${competitorCount} competitors identified in AI responses. Analyze their strengths for improvement opportunities.`)
        }

        // Brand Features (limited to first 10)
        if (metrics.brand_features && metrics.brand_features.length > 0) {
            const topFeatures = metrics.brand_features.slice(0, 10).join(', ')
            conclusions.push(`💡 Key Differentiators: Your brand is recognized for: ${topFeatures}.`)
        }

        // Overall Recommendation based on Brand Agnostic metrics
        if (brandAgnostic.brand_mention_rate >= 50) {
            conclusions.push(`🎯 Overall: ${brandName} has strong organic AI visibility. Continue current strategies and focus on maintaining consistency.`)
        } else if (brandAgnostic.brand_mention_rate >= 25) {
            conclusions.push(`🎯 Overall: ${brandName} has potential but needs targeted improvements in content and local SEO optimization for better organic discovery.`)
        } else {
            conclusions.push(`🎯 Overall: Immediate action required to improve ${brandName}'s organic AI visibility. Focus on structured data, local citations, and content strategy.`)
        }

        return conclusions
    }

    const handleExport = async () => {
        if (!geoMetrics) {
            alert('Metrics data not available. Please wait for analysis to complete.')
            return
        }

        setIsExporting(true)

        try {
            // Use geoMetrics prop instead of fetching
            const metrics = geoMetrics
            const conclusions = generateConclusions(metrics)

            const workbook = XLSX.utils.book_new()

            // Sheet 1: AEO_GEO_Prompt_Tracking - Questions grouped by category
            const promptTrackingData = [
                ['Category', 'Prompt', 'Platform (ChatGPT)', 'Mentions', 'Rank (0-2)', 'Description', 'Intent Match', 'Conversion', 'Total Score', 'Notes'],
            ]

            // Group results by category
            const allPrompts = [...results]
            const groupedByCategory = allPrompts.reduce((acc, r) => {
                const cat = r.category || 'Uncategorized'
                if (!acc[cat]) acc[cat] = []
                acc[cat].push(r)
                return acc
            }, {})

            // Add prompts grouped by category
            Object.entries(groupedByCategory).sort((a, b) => a[0].localeCompare(b[0])).forEach(([category, items]) => {
                items.forEach(r => {
                    const mentions = r.found ? 1 : 0
                    const rank = r.found ? 1 : 'NA'
                    const description = r.fullAnswer ? r.fullAnswer.substring(0, 100) + '...' : ''
                    const intentMatch = r.fullAnswer ? (r.found ? 1 : 0) : 'NA'
                    const conversion = r.found ? 1 : 0
                    const totalScore = r.found ? (mentions + (typeof rank === 'number' ? rank : 0) + intentMatch + conversion) : 0

                    let notes = ''
                    if (!r.found) {
                        notes = 'No mention'
                    } else if (r.fullAnswer && r.fullAnswer.toLowerCase().includes('not recommended')) {
                        notes = 'not recommended, Competition recommend.'
                    } else if (r.fullAnswer && r.fullAnswer.toLowerCase().includes('negative')) {
                        notes = 'Negative review from regulatory.'
                    }

                    promptTrackingData.push([
                        category,
                        r.question || '',
                        '',
                        mentions,
                        rank,
                        description,
                        intentMatch,
                        conversion,
                        totalScore,
                        notes
                    ])
                })
            })

            const promptTrackingSheet = XLSX.utils.aoa_to_sheet(promptTrackingData)
            promptTrackingSheet['!cols'] = [
                { wch: 15 },  // Category
                { wch: 55 },  // Prompt
                { wch: 15 },  // Platform
                { wch: 10 },  // Mentions
                { wch: 10 },  // Rank
                { wch: 40 },  // Description
                { wch: 12 },  // Intent Match
                { wch: 12 },  // Conversion
                { wch: 12 },  // Total Score
                { wch: 50 },  // Notes
            ]
            XLSX.utils.book_append_sheet(workbook, promptTrackingSheet, 'AEO_GEO_Prompt_Tracking')

            // 🆕 Calculate Brand Agnostic & Zero Mention prompts FIRST (before summary)
            const brandName = metrics.brand_name || ''
            const brandNameLower = brandName.toLowerCase()

            // 🆕 Only include prompts that have answers
            const answeredPrompts = results.filter(r => r.fullAnswer && r.fullAnswer.trim() !== '')

            // Brand agnostic = answered questions WITHOUT brand name in question
            const brandAgnosticPrompts = answeredPrompts.filter(r => {
                const questionLower = (r.question || '').toLowerCase()
                return !questionLower.includes(brandNameLower)
            })

            // Zero mention = brand agnostic where brand NOT found in answer
            const zeroMentionPrompts = brandAgnosticPrompts.filter(r => {
                const answerLower = (r.fullAnswer || '').toLowerCase()
                return !answerLower.includes(brandNameLower)
            })

            // 🆕 Use calculated counts (ensures sheet matches summary)
            const calculatedBrandAgnosticTotal = brandAgnosticPrompts.length
            const calculatedZeroMentionCount = zeroMentionPrompts.length

            // Sheet 2: Executive Summary - Brand Info + Brand Agnostic Metrics + Features
            const brandAgnostic = metrics.brand_agnostic_metrics || {}
            const brandIncluded = metrics.brand_included_metrics || {}
            const summaryData = [
                ['BRAND PERFORMANCE REPORT'],
                [''],
                ['BRAND INFORMATION'],
                ['Brand Name', metrics.brand_name || ''],
                ['Total Prompts (Overall)', metrics.total_prompts || 0],
                ['Total Prompts (Brand Agnostic)', calculatedBrandAgnosticTotal],
                ['Report Generated', new Date().toLocaleString()],
                [''],
                ['═══════════════════════════════════════════════════════════════'],
                ['BRAND AGNOSTIC METRICS (Organic Discovery - Without Brand Name)'],
                ['═══════════════════════════════════════════════════════════════'],
                [''],
                ['Metric', 'Value', 'Status'],
                ['Total Prompts', calculatedBrandAgnosticTotal, 'Baseline'],
                ['Mentions', brandAgnostic.mentions || 0, brandAgnostic.mentions > 0 ? '✓ Found' : '✗ Not Found'],
                ['Brand Mention Rate', `${brandAgnostic.brand_mention_rate || 0}%`, brandAgnostic.brand_mention_rate >= 50 ? '✓ Excellent' : brandAgnostic.brand_mention_rate > 0 ? '⚠ Moderate' : '✗ Not Visible'],
                ['Top 3 Mentions', brandAgnostic.top_3_mentions || 0, brandAgnostic.top_3_mentions > 0 ? '✓ Good' : '✗ Not in Top 3'],
                ['Top 3 Position Rate', `${brandAgnostic.top_3_position_rate || 0}%`, brandAgnostic.top_3_position_rate >= 50 ? '✓ Excellent' : '⚠ Needs Improvement'],
                ['Recommendation Rate', `${brandAgnostic.recommendation_rate || 0}%`, brandAgnostic.recommendation_rate >= 50 ? '✓ Good' : '⚠ Low'],
                ['Zero Mention Count', calculatedZeroMentionCount, calculatedZeroMentionCount === 0 ? '✓ Perfect' : `⚠ ${calculatedZeroMentionCount} Opportunities`],
                ['Citations Expected', brandAgnostic.citations_expected || 0, ''],
                ['First Party Citations', brandAgnostic.first_party_citations || 0, ''],
                ['First Party Citation Rate', `${brandAgnostic.first_party_citation_rate || 0}%`, ''],
                [''],
                ['═══════════════════════════════════════════════════════════════'],
                ['BRAND INCLUDED METRICS (Sentiment from branded queries)'],
                ['═══════════════════════════════════════════════════════════════'],
                [''],
                ['Positive Sentiment Rate', `${brandIncluded.positive_sentiment_rate || 0}%`, brandIncluded.positive_sentiment_rate >= 80 ? '✓ Excellent' : brandIncluded.positive_sentiment_rate >= 50 ? '⚠ Mixed' : '⚠ Low'],
                [''],
                ['═══════════════════════════════════════════════════════════════'],
                ['BRAND FEATURES (Recognized by AI)'],
                ['═══════════════════════════════════════════════════════════════'],
                [''],
                ...(metrics.brand_features || []).slice(0, 50).map((f, idx) => [`${idx + 1}. ${f}`]),
                metrics.brand_features && metrics.brand_features.length > 50 ? [`... and ${metrics.brand_features.length - 50} more features`] : [],
                [''],
                ['═══════════════════════════════════════════════════════════════'],
                ['CONCLUSIONS & RECOMMENDATIONS'],
                ['═══════════════════════════════════════════════════════════════'],
                [''],
                ...conclusions.map(c => [c]),
            ].filter(row => row.length > 0)

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
            summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 25 }]
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary')

            // Sheet 3: Zero Mention Prompts (Brand Agnostic - where brand NOT mentioned in answer)
            const zeroMentionData = [
                ['IMPROVEMENT OPPORTUNITIES'],
                ['(Brand Agnostic Prompts - where brand was NOT mentioned organically)'],
                [''],
                ['#', 'Question', 'Answer Snippet', 'Category'],
            ]

            // 🆕 Use already computed zeroMentionPrompts (matches summary count)
            if (zeroMentionPrompts.length > 0) {
                zeroMentionPrompts.forEach((r, idx) => {
                    zeroMentionData.push([
                        idx + 1,
                        r.question || '',
                        r.fullAnswer ? r.fullAnswer.substring(0, 150) + '...' : '',
                        r.category || ''
                    ])
                })
            } else {
                zeroMentionData.push(['', '🎉 No zero mention prompts found - Brand is visible organically in all responses!', '', ''])
            }

            const zeroMentionSheet = XLSX.utils.aoa_to_sheet(zeroMentionData)
            zeroMentionSheet['!cols'] = [{ wch: 5 }, { wch: 60 }, { wch: 80 }, { wch: 20 }]
            XLSX.utils.book_append_sheet(workbook, zeroMentionSheet, 'Zero Mention Prompts')

            // Sheet 4: Competitor Analysis - 🆕 Extract competitors from all answers
            // Start with API-provided competitors, then extract more from answers
            const competitorMentions = { ...(metrics.competitor_mentions || {}) }

            // 🆕 Extract competitor brands from all answers (common restaurant/brand names)
            const knownCompetitors = [
                'Olive Garden', 'Cheesecake Factory', 'P.F. Changs', 'Red Lobster', 'Outback',
                'Applebees', 'Chilis', 'TGI Fridays', 'Buffalo Wild Wings', 'Dennys',
                'IHOP', 'Cracker Barrel', 'Texas Roadhouse', 'LongHorn', 'Ruth Chris',
                'Morton', 'Capital Grille', 'Nobu', 'Benihana', 'Maggianos',
                // Add more as needed or get from metrics.competitors
            ]
            const apiCompetitors = metrics.competitors || []
            const allCompetitors = [...new Set([...apiCompetitors, ...knownCompetitors])]

            // Scan all answers for competitor mentions
            results.forEach(r => {
                const answerLower = (r.fullAnswer || '').toLowerCase()
                allCompetitors.forEach(comp => {
                    if (comp && answerLower.includes(comp.toLowerCase())) {
                        competitorMentions[comp] = (competitorMentions[comp] || 0) + 1
                    }
                })
            })

            const competitorEntries = Object.entries(competitorMentions).filter(([_, count]) => count > 0)
            const competitorData = [
                ['COMPETITOR ANALYSIS'],
                ['(Competitors mentioned in ChatGPT responses)'],
                [''],
                ['Competitor', 'Mention Count'],
                ...(competitorEntries.length > 0
                    ? competitorEntries.sort((a, b) => b[1] - a[1]).map(([name, count]) => [name, count])
                    : [['No competitors identified in responses', '']]),
            ]
            const competitorSheet = XLSX.utils.aoa_to_sheet(competitorData)
            competitorSheet['!cols'] = [{ wch: 40 }, { wch: 20 }]
            XLSX.utils.book_append_sheet(workbook, competitorSheet, 'Competitor Analysis')

            // Sheet 5: All Q&A Data - Organized by Category
            const qnaData = [
                ['QUESTION & ANSWER ANALYSIS BY CATEGORY'],
                [''],
            ]

            // Add category-wise sections
            Object.entries(groupedByCategory).sort((a, b) => a[0].localeCompare(b[0])).forEach(([category, items]) => {
                const foundCount = items.filter(i => i.found).length
                const totalCount = items.length
                const foundRate = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0

                // Category Header
                qnaData.push([''])
                qnaData.push([`📂 ${category.toUpperCase()}`])
                qnaData.push([`Found: ${foundCount}/${totalCount} (${foundRate}%)`, '', '', foundRate >= 50 ? '✅ Good' : foundRate > 0 ? '⚠️ Needs Improvement' : '❌ Not Visible'])
                qnaData.push([''])
                qnaData.push(['#', 'Question', 'ChatGPT Answer', 'Brand Found'])

                // Add each Q&A in this category (🆕 Removed duplicate Status column)
                items.forEach((r, idx) => {
                    qnaData.push([
                        idx + 1,
                        r.question,
                        r.fullAnswer || '(Not answered yet)',
                        r.found ? 'YES ✓' : 'NO ✗'
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
            qnaSheet['!cols'] = [{ wch: 5 }, { wch: 60 }, { wch: 100 }, { wch: 15 }]  // 🆕 Removed Status column width
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
            disabled={disabled || results.length === 0 || isExporting || !geoMetrics}
        >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Generating Report...' : 'Export to Excel (.xlsx)'}
        </button>
    )
}
