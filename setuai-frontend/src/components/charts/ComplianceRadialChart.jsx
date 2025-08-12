// src/components/charts/ComplianceRadialChart.jsx
import React from 'react';
import Chart from 'react-apexcharts';

const ComplianceRadialChart = ({ documents, overallScore }) => {
  const pillarColors = {
    'ESI_PF_COVERAGE': '#1A56DB',
    'FACTORY_REGISTRATION_SAFETY': '#0E9F6E',
    'ENVIRONMENTAL': '#D97706',
    'WAGES_OVERTIME': '#9B1C1C',
    'CHILD_LABOR_AGE_VERIFICATION': '#5A21B5'
  };

  const processDataForChart = () => {
    const pillarData = documents.reduce((acc, doc) => {
      const pillar = doc.complianceDocument.pillar;
      if (!acc[pillar]) {
        acc[pillar] = { totalScore: 0, count: 0, missing: 0, rejected: 0, verified: 0 };
      }
      acc[pillar].totalScore += doc.riskScore || 0;
      acc[pillar].count++;
      if (doc.verificationStatus === 'MISSING') acc[pillar].missing++;
      if (doc.verificationStatus === 'REJECTED') acc[pillar].rejected++;
      if (doc.verificationStatus === 'VERIFIED') acc[pillar].verified++;
      return acc;
    }, {});

    const series = Object.values(pillarData).map(data => data.count > 0 ? Math.round(data.totalScore / data.count) : 0);
    const labels = Object.keys(pillarData).map(pillar => 
      pillar.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    const colors = Object.keys(pillarData).map(pillar => pillarColors[pillar] || '#374151');

    return { series, labels, colors, pillarData };
  };
  
  const generateSmartSuggestions = () => {
    const suggestions = [];
    const { pillarData } = processDataForChart();

    Object.entries(pillarData).forEach(([pillar, data]) => {
      const pillarName = pillar.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (data.rejected > 0) {
        suggestions.push({
          type: 'error',
          priority: 'critical',
          message: `${data.rejected} document(s) in ${pillarName} were rejected.`,
          action: 'Please review and upload corrected documents immediately.'
        });
      }
      if (data.missing > 0) {
        suggestions.push({
          type: 'warning',
          priority: 'high',
          message: `${data.missing} document(s) in ${pillarName} are missing.`,
          action: 'Upload these documents to improve your compliance score.'
        });
      }
      if (data.verified === data.count && data.count > 0) {
        suggestions.push({
          type: 'success',
          priority: 'low',
          message: `All documents for ${pillarName} are verified.`,
          action: 'Great job! Keep these documents up-to-date.'
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityMap = { critical: 3, high: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
  };

  const { series, labels, colors, pillarData } = processDataForChart();
  const suggestions = generateSmartSuggestions();

  const chartOptions = {
    chart: {
      width: '100%',
      height: 380,
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
    },
    series: series,
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270,
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: 'Overall Score',
              fontSize: '18px',
              fontWeight: 600,
              color: '#374151',
              formatter: () => `${Math.round(overallScore || 0)}%`
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      type: 'gradient',
    },
    colors: colors,
    legend: {
      formatter: function (val, opts) {
        return labels[opts.seriesIndex] + " - " + opts.w.globals.series[opts.seriesIndex] + '%'
      },
      position: 'bottom',
      labels: {
        colors: '#374151'
      }
    },
    labels: labels,
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
      }
    }]
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-1/3">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
          <h5 className="text-xl font-bold text-gray-900 dark:text-white">Compliance Breakdown</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pillar-wise compliance score</p>
          <div className="flex-grow flex flex-col justify-center items-center mt-4">
            <Chart options={chartOptions} series={series} type="donut" width="100%" />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-2/3">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-full">
        <h5 className="text-xl font-bold text-gray-900 dark:text-white">Smart Compliance Insights</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Actionable recommendations to improve your status</p>
          <div className="space-y-3 mt-4 max-h-[380px] overflow-y-auto scrollbar-hide">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  suggestion.type === 'error' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' :
                  suggestion.type === 'warning' ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                }`}>
                  <div className="flex items-start">
                    <div className="ml-2">
                      <h3 className={`text-sm font-medium ${
                        suggestion.type === 'error' ? 'text-red-700 dark:text-red-400' :
                        suggestion.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                        'text-green-700 dark:text-green-400'
                      }`}>{suggestion.message}</h3>
                      <p className={`mt-1 text-xs ${
                        suggestion.type === 'error' ? 'text-red-600 dark:text-red-300' :
                        suggestion.type === 'warning' ? 'text-yellow-600 dark:text-yellow-300' :
                        'text-green-600 dark:text-green-300'
                      }`}>{suggestion.action}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No specific recommendations at this time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceRadialChart;