import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

export default function HelpPage() {
  const { t } = useLocalization();
  const [selectedChapter, setSelectedChapter] = useState('gettingStarted');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});
  const [showFAQ, setShowFAQ] = useState(false);

  const chapters = [
    {
      id: 'gettingStarted',
      icon: '🚀',
      title: t('help.chapters.gettingStarted.title'),
      description: t('help.chapters.gettingStarted.description')
    },
    {
      id: 'uploadingDocuments',
      icon: '📄',
      title: t('help.chapters.uploadingDocuments.title'),
      description: t('help.chapters.uploadingDocuments.description')
    },
    {
      id: 'verificationProcess',
      icon: '🤖',
      title: t('help.chapters.verificationProcess.title'),
      description: t('help.chapters.verificationProcess.description')
    },
    {
      id: 'complianceScoring',
      icon: '📊',
      title: t('help.chapters.complianceScoring.title'),
      description: t('help.chapters.complianceScoring.description')
    },
    {
      id: 'marketplace',
      icon: '🏪',
      title: t('help.chapters.marketplace.title'),
      description: t('help.chapters.marketplace.description')
    },
    {
      id: 'engagementManagement',
      icon: '🤝',
      title: t('help.chapters.engagementManagement.title'),
      description: t('help.chapters.engagementManagement.description')
    },
    {
      id: 'reportsAndAnalytics',
      icon: '📈',
      title: t('help.chapters.reportsAndAnalytics.title'),
      description: t('help.chapters.reportsAndAnalytics.description')
    },
    {
      id: 'troubleshooting',
      icon: '🔧',
      title: t('help.chapters.troubleshooting.title'),
      description: t('help.chapters.troubleshooting.description')
    }
  ];

  const sections = {
    gettingStarted: [
      {
        id: 'introduction',
        title: t('help.sections.introduction.title'),
        content: t('help.sections.introduction.content'),
        steps: [
          t('help.sections.introduction.step1'),
          t('help.sections.introduction.step2'),
          t('help.sections.introduction.step3'),
          t('help.sections.introduction.step4')
        ]
      },
      {
        id: 'dashboardOverview',
        title: t('help.sections.dashboardOverview.title'),
        content: t('help.sections.dashboardOverview.content'),
        steps: [
          t('help.sections.dashboardOverview.step1'),
          t('help.sections.dashboardOverview.step2'),
          t('help.sections.dashboardOverview.step3'),
          t('help.sections.dashboardOverview.step4')
        ]
      }
    ],
    uploadingDocuments: [
      {
        id: 'documentUpload',
        title: t('help.sections.documentUpload.title'),
        content: t('help.sections.documentUpload.content'),
        steps: [
          t('help.sections.documentUpload.step1'),
          t('help.sections.documentUpload.step2'),
          t('help.sections.documentUpload.step3'),
          t('help.sections.documentUpload.step4')
        ],
        tips: [
          t('help.sections.documentUpload.tip1'),
          t('help.sections.documentUpload.tip2'),
          t('help.sections.documentUpload.tip3'),
          t('help.sections.documentUpload.tip4')
        ]
      }
    ],
    verificationProcess: [
      {
        id: 'verificationProcess',
        title: t('help.sections.verificationProcess.title'),
        content: t('help.sections.verificationProcess.content'),
        steps: [
          t('help.sections.verificationProcess.step1'),
          t('help.sections.verificationProcess.step2'),
          t('help.sections.verificationProcess.step3'),
          t('help.sections.verificationProcess.step4')
        ],
        tips: [
          t('help.sections.verificationProcess.tip1'),
          t('help.sections.verificationProcess.tip2'),
          t('help.sections.verificationProcess.tip3'),
          t('help.sections.verificationProcess.tip4')
        ]
      }
    ],
    complianceScoring: [
      {
        id: 'complianceScoring',
        title: t('help.sections.complianceScoring.title'),
        content: t('help.sections.complianceScoring.content'),
        scoringFactors: [
          { factor: t('help.sections.complianceScoring.factor1'), weight: t('help.sections.complianceScoring.weight1') },
          { factor: t('help.sections.complianceScoring.factor2'), weight: t('help.sections.complianceScoring.weight2') },
          { factor: t('help.sections.complianceScoring.factor3'), weight: t('help.sections.complianceScoring.weight3') },
          { factor: t('help.sections.complianceScoring.factor4'), weight: t('help.sections.complianceScoring.weight4') }
        ],
        scoreRanges: [
          { range: '85-100%', status: 'GREEN', description: t('help.sections.complianceScoring.range1') },
          { range: '60-84%', status: 'AMBER', description: t('help.sections.complianceScoring.range2') },
          { range: '0-59%', status: 'RED', description: t('help.sections.complianceScoring.range3') }
        ]
      }
    ],
    reportsAndAnalytics: [
      {
        id: 'reportsUnderstanding',
        title: t('help.sections.reportsUnderstanding.title'),
        content: t('help.sections.reportsUnderstanding.content'),
        features: [
          t('help.sections.reportsUnderstanding.feature1'),
          t('help.sections.reportsUnderstanding.feature2'),
          t('help.sections.reportsUnderstanding.feature3'),
          t('help.sections.reportsUnderstanding.feature4')
        ]
      }
    ],
    marketplace: [
      {
        id: 'marketplaceOverview',
        title: t('help.sections.marketplaceOverview.title'),
        content: t('help.sections.marketplaceOverview.content'),
        steps: [
          t('help.sections.marketplaceOverview.step1'),
          t('help.sections.marketplaceOverview.step2'),
          t('help.sections.marketplaceOverview.step3'),
          t('help.sections.marketplaceOverview.step4'),
          t('help.sections.marketplaceOverview.step5')
        ],
        tips: [
          t('help.sections.marketplaceOverview.tip1'),
          t('help.sections.marketplaceOverview.tip2'),
          t('help.sections.marketplaceOverview.tip3'),
          t('help.sections.marketplaceOverview.tip4')
        ]
      },
      {
        id: 'marketplaceSearch',
        title: t('help.sections.marketplaceSearch.title'),
        content: t('help.sections.marketplaceSearch.content'),
        steps: [
          t('help.sections.marketplaceSearch.step1'),
          t('help.sections.marketplaceSearch.step2'),
          t('help.sections.marketplaceSearch.step3'),
          t('help.sections.marketplaceSearch.step4'),
          t('help.sections.marketplaceSearch.step5')
        ],
        tips: [
          t('help.sections.marketplaceSearch.tip1'),
          t('help.sections.marketplaceSearch.tip2'),
          t('help.sections.marketplaceSearch.tip3'),
          t('help.sections.marketplaceSearch.tip4')
        ]
      },
      {
        id: 'vendorProfiles',
        title: t('help.sections.vendorProfiles.title'),
        content: t('help.sections.vendorProfiles.content'),
        features: [
          t('help.sections.vendorProfiles.feature1'),
          t('help.sections.vendorProfiles.feature2'),
          t('help.sections.vendorProfiles.feature3'),
          t('help.sections.vendorProfiles.feature4'),
          t('help.sections.vendorProfiles.feature5')
        ],
        tips: [
          t('help.sections.vendorProfiles.tip1'),
          t('help.sections.vendorProfiles.tip2'),
          t('help.sections.vendorProfiles.tip3'),
          t('help.sections.vendorProfiles.tip4')
        ]
      }
    ],
    engagementManagement: [
      {
        id: 'engagementBasics',
        title: t('help.sections.engagementBasics.title'),
        content: t('help.sections.engagementBasics.content'),
        steps: [
          t('help.sections.engagementBasics.step1'),
          t('help.sections.engagementBasics.step2'),
          t('help.sections.engagementBasics.step3'),
          t('help.sections.engagementBasics.step4'),
          t('help.sections.engagementBasics.step5')
        ],
        tips: [
          t('help.sections.engagementBasics.tip1'),
          t('help.sections.engagementBasics.tip2'),
          t('help.sections.engagementBasics.tip3'),
          t('help.sections.engagementBasics.tip4')
        ]
      },
      {
        id: 'engagementStatuses',
        title: t('help.sections.engagementStatuses.title'),
        content: t('help.sections.engagementStatuses.content'),
        statuses: [
          {
            status: 'pending',
            title: t('help.sections.engagementStatuses.pending.title'),
            description: t('help.sections.engagementStatuses.pending.description'),
            action: t('help.sections.engagementStatuses.pending.action')
          },
          {
            status: 'active',
            title: t('help.sections.engagementStatuses.active.title'),
            description: t('help.sections.engagementStatuses.active.description'),
            action: t('help.sections.engagementStatuses.active.action')
          },
          {
            status: 'completed',
            title: t('help.sections.engagementStatuses.completed.title'),
            description: t('help.sections.engagementStatuses.completed.description'),
            action: t('help.sections.engagementStatuses.completed.action')
          },
          {
            status: 'onHold',
            title: t('help.sections.engagementStatuses.onHold.title'),
            description: t('help.sections.engagementStatuses.onHold.description'),
            action: t('help.sections.engagementStatuses.onHold.action')
          }
        ]
      },
      {
        id: 'engagementPriorities',
        title: t('help.sections.engagementPriorities.title'),
        content: t('help.sections.engagementPriorities.content'),
        priorities: [
          {
            priority: 'urgent',
            title: t('help.sections.engagementPriorities.urgent.title'),
            description: t('help.sections.engagementPriorities.urgent.description'),
            color: t('help.sections.engagementPriorities.urgent.color'),
            action: t('help.sections.engagementPriorities.urgent.action')
          },
          {
            priority: 'high',
            title: t('help.sections.engagementPriorities.high.title'),
            description: t('help.sections.engagementPriorities.high.description'),
            color: t('help.sections.engagementPriorities.high.color'),
            action: t('help.sections.engagementPriorities.high.action')
          },
          {
            priority: 'medium',
            title: t('help.sections.engagementPriorities.medium.title'),
            description: t('help.sections.engagementPriorities.medium.description'),
            color: t('help.sections.engagementPriorities.medium.color'),
            action: t('help.sections.engagementPriorities.medium.action')
          },
          {
            priority: 'low',
            title: t('help.sections.engagementPriorities.low.title'),
            description: t('help.sections.engagementPriorities.low.description'),
            color: t('help.sections.engagementPriorities.low.color'),
            action: t('help.sections.engagementPriorities.low.action')
          }
        ]
      },
      {
        id: 'dealTypes',
        title: t('help.sections.dealTypes.title'),
        content: t('help.sections.dealTypes.content'),
        dealTypes: [
          {
            type: 'purchase',
            title: t('help.sections.dealTypes.purchase.title'),
            description: t('help.sections.dealTypes.purchase.description'),
            examples: t('help.sections.dealTypes.purchase.examples')
          },
          {
            type: 'service',
            title: t('help.sections.dealTypes.service.title'),
            description: t('help.sections.dealTypes.service.description'),
            examples: t('help.sections.dealTypes.service.examples')
          },
          {
            type: 'consultation',
            title: t('help.sections.dealTypes.consultation.title'),
            description: t('help.sections.dealTypes.consultation.description'),
            examples: t('help.sections.dealTypes.consultation.examples')
          }
        ]
      },
      {
        id: 'engagementHistory',
        title: t('help.sections.engagementHistory.title'),
        content: t('help.sections.engagementHistory.content'),
        features: [
          t('help.sections.engagementHistory.feature1'),
          t('help.sections.engagementHistory.feature2'),
          t('help.sections.engagementHistory.feature3'),
          t('help.sections.engagementHistory.feature4'),
          t('help.sections.engagementHistory.feature5')
        ],
        tips: [
          t('help.sections.engagementHistory.tip1'),
          t('help.sections.engagementHistory.tip2'),
          t('help.sections.engagementHistory.tip3'),
          t('help.sections.engagementHistory.tip4')
        ]
      },
      {
        id: 'vendorCommunication',
        title: t('help.sections.vendorCommunication.title'),
        content: t('help.sections.vendorCommunication.content'),
        steps: [
          t('help.sections.vendorCommunication.step1'),
          t('help.sections.vendorCommunication.step2'),
          t('help.sections.vendorCommunication.step3'),
          t('help.sections.vendorCommunication.step4'),
          t('help.sections.vendorCommunication.step5')
        ],
        tips: [
          t('help.sections.vendorCommunication.tip1'),
          t('help.sections.vendorCommunication.tip2'),
          t('help.sections.vendorCommunication.tip3'),
          t('help.sections.vendorCommunication.tip4')
        ]
      },
      {
        id: 'marketplaceBestPractices',
        title: t('help.sections.marketplaceBestPractices.title'),
        content: t('help.sections.marketplaceBestPractices.content'),
        practices: [
          {
            title: t('help.sections.marketplaceBestPractices.practice1.title'),
            description: t('help.sections.marketplaceBestPractices.practice1.description')
          },
          {
            title: t('help.sections.marketplaceBestPractices.practice2.title'),
            description: t('help.sections.marketplaceBestPractices.practice2.description')
          },
          {
            title: t('help.sections.marketplaceBestPractices.practice3.title'),
            description: t('help.sections.marketplaceBestPractices.practice3.description')
          },
          {
            title: t('help.sections.marketplaceBestPractices.practice4.title'),
            description: t('help.sections.marketplaceBestPractices.practice4.description')
          },
          {
            title: t('help.sections.marketplaceBestPractices.practice5.title'),
            description: t('help.sections.marketplaceBestPractices.practice5.description')
          }
        ]
      }
    ],
    troubleshooting: [
      {
        id: 'commonIssues',
        title: t('help.sections.commonIssues.title'),
        content: t('help.sections.commonIssues.content'),
        issues: [
          {
            problem: t('help.sections.commonIssues.issue1.problem'),
            solution: t('help.sections.commonIssues.issue1.solution')
          },
          {
            problem: t('help.sections.commonIssues.issue2.problem'),
            solution: t('help.sections.commonIssues.issue2.solution')
          },
          {
            problem: t('help.sections.commonIssues.issue3.problem'),
            solution: t('help.sections.commonIssues.issue3.solution')
          },
          {
            problem: t('help.sections.commonIssues.issue4.problem'),
            solution: t('help.sections.commonIssues.issue4.solution')
          }
        ]
      }
    ]
  };

  const handleChapterClick = (chapterId) => {
    setSelectedChapter(chapterId);
  };

  const handleSectionClick = (section) => {
    setModalContent(section);
    setShowModal(true);
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent(t('help.emailSubject'));
    const body = encodeURIComponent(t('help.emailBody'));
    const mailtoLink = `mailto:aksidharthm10@gmail.com?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  };

  const handleViewFAQ = () => {
    setShowFAQ(true);
  };

  const faqData = [
    {
      question: "How do I upload compliance documents?",
      answer: "Navigate to the Dashboard and click on 'Upload Document'. Select your file and follow the prompts to complete the upload process."
    },
    {
      question: "What file formats are supported for document upload?",
      answer: "We support PDF, JPG, PNG, and DOCX files. For best results, use PDF format for documents."
    },
    {
      question: "How is my compliance score calculated?",
      answer: "Your compliance score is calculated based on the completeness and accuracy of your uploaded documents, verification status, and adherence to regulatory requirements."
    },
    {
      question: "How long does document verification take?",
      answer: "Document verification typically takes 24-48 hours. You'll receive a notification once the verification is complete."
    },
    {
      question: "Can I edit my vendor profile after publishing?",
      answer: "Yes, you can edit your profile at any time. Changes will be reflected in the marketplace after review."
    },
    {
      question: "How do I respond to buyer requests?",
      answer: "Go to the 'Buyer Requests' section, select the request you want to respond to, and use the response form to provide your details."
    },
    {
      question: "What should I do if I forget my password?",
      answer: "Use the 'Forgot Password' link on the login page to reset your password via email."
    },
    {
      question: "How do I update my company information?",
      answer: "Go to your Profile page and click on 'Edit Profile' to update your company information and contact details."
    },
    {
      question: "What are the different compliance statuses?",
      answer: "Green (85-100%): Fully compliant, Amber (60-84%): Partially compliant, Red (0-59%): Non-compliant and requires attention."
    },
    {
      question: "How do I export my compliance reports?",
      answer: "Navigate to the Reports section and click on 'Export Report' to download your compliance data in PDF or Excel format."
    }
  ];

  const filteredChapters = chapters.filter(chapter =>
    chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chapter.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add CSS to hide scrollbars and enable smooth scrolling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .smooth-scroll {
        scroll-behavior: smooth;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('help.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {t('help.welcome')}
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder={t('help.searchHelp')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Chapter Navigation */}
            <div className="lg:col-span-1">
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-h-[calc(100vh-250px)] overflow-hidden"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mb-4">
                  {t('help.userGuide')}
                </h2>
                <nav className="space-y-2 overflow-y-auto hide-scrollbar smooth-scroll" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                  <AnimatePresence>
                    {filteredChapters.map((chapter, index) => (
                      <motion.button
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter.id)}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                          selectedChapter === chapter.id
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <motion.span 
                            className="text-2xl"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            {chapter.icon}
                          </motion.span>
                          <div>
                            <h3 className="font-medium">{chapter.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {chapter.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </nav>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-h-[calc(100vh-250px)] relative overflow-hidden"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {chapters.find(c => c.id === selectedChapter)?.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {chapters.find(c => c.id === selectedChapter)?.description}
                  </p>
                </div>

                <motion.div 
                  className="space-y-6 overflow-y-auto pr-2 hide-scrollbar smooth-scroll"
                  style={{ maxHeight: 'calc(100vh - 350px)' }}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {sections[selectedChapter]?.map((section, index) => (
                    <motion.div
                      key={section.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                      onClick={() => handleSectionClick(section)}
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.02, 
                        y: -5,
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {section.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {section.content}
                      </p>
                      
                      {section.steps && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Steps:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {section.steps.map((step, stepIndex) => (
                              <motion.li 
                                key={stepIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: stepIndex * 0.1 }}
                              >
                                {step}
                              </motion.li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {section.tips && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tips:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {section.tips.map((tip, tipIndex) => (
                              <motion.li 
                                key={tipIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: tipIndex * 0.1 }}
                              >
                                {tip}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {section.scoringFactors && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Scoring Factors:</h4>
                          <div className="space-y-2">
                            {section.scoringFactors.map((factor, factorIndex) => (
                              <motion.div 
                                key={factorIndex} 
                                className="flex justify-between text-sm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: factorIndex * 0.1 }}
                              >
                                <span className="text-gray-600 dark:text-gray-300">{factor.factor}</span>
                                <span className="font-medium text-gray-900 dark:text-white">{factor.weight}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.scoreRanges && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Score Ranges:</h4>
                          <div className="space-y-2">
                            {section.scoreRanges.map((range, rangeIndex) => (
                              <motion.div 
                                key={rangeIndex} 
                                className="flex justify-between text-sm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: rangeIndex * 0.1 }}
                              >
                                <span className="text-gray-600 dark:text-gray-300">{range.range}</span>
                                <span className={`font-medium ${
                                  range.status === 'GREEN' ? 'text-green-600 dark:text-green-400' :
                                  range.status === 'AMBER' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {range.status}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.features && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Features:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {section.features.map((feature, featureIndex) => (
                              <motion.li 
                                key={featureIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: featureIndex * 0.1 }}
                              >
                                {feature}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {section.issues && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Common Issues:</h4>
                          <div className="space-y-3">
                            {section.issues.map((issue, issueIndex) => (
                              <motion.div 
                                key={issueIndex} 
                                className="bg-gray-50 dark:bg-gray-700 p-3 rounded"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: issueIndex * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                              >
                                <p className="font-medium text-gray-900 dark:text-white mb-1">
                                  {issue.problem}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {issue.solution}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      <motion.div 
                        className="mt-4 text-sm text-green-600 dark:text-green-400 font-medium"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        Click to learn more →
                      </motion.div>
                    </motion.div>
                  ))}
                  
                  {/* Bottom padding for infinite scroll feel */}
                  <div className="h-32 pb-8"></div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Contact Support Section */}
          <motion.div 
            className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('help.contactSupport')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('help.contactSupportSubtitle')}
              </p>
              <div className="flex justify-center space-x-4">
                <motion.button 
                  onClick={handleContactSupport}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('help.contactSupport')}
                </motion.button>
                <motion.button 
                  onClick={handleViewFAQ}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('help.viewFAQ')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Modal for detailed content */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <motion.div 
            className="p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {modalContent.title}
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {modalContent.content}
              </p>
              
              {modalContent.steps && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Detailed Steps:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    {modalContent.steps.map((step, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {step}
                      </motion.li>
                    ))}
                  </ol>
                </div>
              )}

              {modalContent.tips && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Pro Tips:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    {modalContent.tips.map((tip, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {tip}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {modalContent.scoringFactors && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Scoring Factors:</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {modalContent.scoringFactors.map((factor, index) => (
                      <motion.div 
                        key={index} 
                        className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="text-gray-700 dark:text-gray-300">{factor.factor}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{factor.weight}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {modalContent.scoreRanges && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Score Ranges:</h3>
                  <div className="space-y-3">
                    {modalContent.scoreRanges.map((range, index) => (
                      <motion.div 
                        key={index} 
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{range.range}</span>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{range.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          range.status === 'GREEN' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                          range.status === 'AMBER' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                        }`}>
                          {range.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {modalContent.issues && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Common Issues & Solutions:</h3>
                  <div className="space-y-4">
                    {modalContent.issues.map((issue, index) => (
                      <motion.div 
                        key={index} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Problem: {issue.problem}</h4>
                        <p className="text-gray-600 dark:text-gray-300">Solution: {issue.solution}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {modalContent.statuses && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Engagement Statuses:</h3>
                  <div className="space-y-3">
                    {modalContent.statuses.map((status, index) => (
                      <motion.div 
                        key={index} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{status.title}</h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{status.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Action: {status.action}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {modalContent.priorities && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Priority Levels:</h3>
                  <div className="space-y-3">
                    {modalContent.priorities.map((priority, index) => (
                      <motion.div 
                        key={index} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{priority.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            priority.color === 'Red' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                            priority.color === 'Orange' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400' :
                            priority.color === 'Yellow' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                            'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          }`}>
                            {priority.color}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{priority.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Action: {priority.action}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {modalContent.dealTypes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Deal Types:</h3>
                  <div className="space-y-3">
                    {modalContent.dealTypes.map((dealType, index) => (
                      <motion.div 
                        key={index} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{dealType.title}</h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{dealType.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Examples: {dealType.examples}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {modalContent.features && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Features:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    {modalContent.features.map((feature, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {feature}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {modalContent.practices && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Best Practices:</h3>
                  <div className="space-y-3">
                    {modalContent.practices.map((practice, index) => (
                      <motion.div 
                        key={index} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{practice.title}</h4>
                        <p className="text-gray-600 dark:text-gray-300">{practice.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </Modal>

        {/* FAQ Modal */}
        <Modal isOpen={showFAQ} onClose={() => setShowFAQ(false)}>
          <motion.div 
            className="p-6 max-w-4xl max-h-[80vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('help.faqTitle')}
              </h2>
              <button
                onClick={() => setShowFAQ(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('help.faqSubtitle')}
            </p>

            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <motion.div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
                Still need help? Contact our support team.
              </p>
              <div className="flex justify-center">
                <motion.button
                  onClick={() => {
                    setShowFAQ(false);
                    handleContactSupport();
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('help.contactSupport')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </Modal>
      </div>
    </Layout>
  );
} 