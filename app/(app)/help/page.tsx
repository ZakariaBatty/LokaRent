'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  ChevronRight,
  Rocket,
  BookOpen,
  Play,
  HelpCircle,
  Zap,
  Star,
  Lightbulb,
  ArrowRight,
  Clock,
  Eye,
  ThumbsUp,
} from 'lucide-react'
import { helpCenterCategories, helpCenterArticles } from '@/lib/help-center-data'

const iconMap: Record<string, React.ReactNode> = {
  Rocket: <Rocket className="h-6 w-6" />,
  BookOpen: <BookOpen className="h-6 w-6" />,
  Play: <Play className="h-6 w-6" />,
  HelpCircle: <HelpCircle className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Star: <Star className="h-6 w-6" />,
  Lightbulb: <Lightbulb className="h-6 w-6" />,
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  green: 'bg-green-50 text-green-700 ring-green-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)

  // Search through articles
  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase()
    if (!query) return []

    return Object.values(helpCenterArticles).filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [searchQuery])

  // Get articles for selected category
  const categoryArticles = useMemo(() => {
    if (!selectedCategory) return []
    const category = helpCenterCategories.find((c) => c.id === selectedCategory)
    if (!category) return []
    return category.articles.map((id) => helpCenterArticles[id]).filter(Boolean)
  }, [selectedCategory])

  // Get selected article content
  const selectedArticleContent = selectedArticle ? helpCenterArticles[selectedArticle] : null

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="mb-2 text-3xl font-bold text-slate-900">Help Center</h1>
            <p className="text-sm text-slate-500">
              Everything you need to know about LokaRent. Search, browse, or contact support.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles, guides, and FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Search Results */}
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Search Results ({searchResults.length})
                </h2>
                {searchResults.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-sm text-slate-500">No articles found matching your query.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {searchResults.map((article) => (
                      <motion.button
                        key={article.id}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setSelectedArticle(article.id)
                          setSearchQuery('')
                        }}
                        className="group rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50 hover:border-slate-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 group-hover:text-blue-600">
                              {article.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">{article.description}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {article.readTime} min read
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.views.toLocaleString()} views
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="mt-1 h-5 w-5 text-slate-300 transition group-hover:text-slate-400" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Categories View */}
          {!searchQuery && !selectedCategory && !selectedArticle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Featured Articles */}
              <div className="mb-12">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Featured Articles</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[helpCenterArticles['gs-01'], helpCenterArticles['ug-01']].map((article) => (
                    <motion.button
                      key={article.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedArticle(article.id)}
                      className="group rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-left transition hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="mb-2 inline-block rounded-lg bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        Popular
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600">
                        {article.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">{article.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.readTime} min read
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Categories Grid */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Browse Categories</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {helpCenterCategories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`group rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:shadow-md ${colorMap[category.color]} hover:shadow-lg`}
                    >
                      <div className="mb-3 inline-block rounded-lg p-2.5 bg-slate-100 group-hover:bg-opacity-50">
                        {iconMap[category.icon]}
                      </div>
                      <h3 className="font-semibold text-slate-900">{category.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{category.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          {category.articles.length} articles
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:text-slate-600" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Articles View */}
          {!searchQuery && selectedCategory && !selectedArticle && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setSelectedCategory(null)}
                className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to categories
              </button>

              {(() => {
                const category = helpCenterCategories.find((c) => c.id === selectedCategory)
                return category ? (
                  <div>
                    <div className="mb-6">
                      <div className={`mb-4 inline-block rounded-xl p-3 ${colorMap[category.color]}`}>
                        {iconMap[category.icon]}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{category.title}</h2>
                      <p className="mt-2 text-slate-600">{category.description}</p>
                    </div>

                    <div className="grid gap-3">
                      {categoryArticles.map((article) => (
                        <motion.button
                          key={article.id}
                          whileHover={{ x: 4 }}
                          onClick={() => setSelectedArticle(article.id)}
                          className="group rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-slate-900 group-hover:text-blue-600">
                                {article.title}
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">{article.description}</p>
                              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {article.readTime} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {article.views.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  {article.helpful}%
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="mt-1 h-5 w-5 text-slate-300" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}
            </motion.div>
          )}

          {/* Article View */}
          {selectedArticleContent && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setSelectedArticle(null)}
                className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back
              </button>

              <div className="max-w-3xl">
                {/* Article Header */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      {helpCenterCategories.find((c) =>
                        c.articles.includes(selectedArticleContent.id)
                      )?.title}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">{selectedArticleContent.title}</h1>
                  <p className="mt-2 text-slate-600">{selectedArticleContent.description}</p>

                  {/* Meta Info */}
                  <div className="mt-4 flex items-center gap-6 border-t border-slate-200 pt-4 text-sm text-slate-500">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {selectedArticleContent.readTime} min read
                    </span>
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {selectedArticleContent.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      {selectedArticleContent.helpful}% helpful
                    </span>
                  </div>
                </div>

                {/* Video Embed */}
                {selectedArticleContent.videoUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 overflow-hidden rounded-xl border border-slate-200"
                  >
                    <div className="aspect-video">
                      <iframe
                        src={selectedArticleContent.videoUrl}
                        title="Tutorial video"
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </motion.div>
                )}

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="prose max-w-none text-slate-700 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:text-slate-700 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-2 [&_code]:py-1 [&_code]:text-sm"
                  dangerouslySetInnerHTML={{
                    __html: selectedArticleContent.content
                      .split('\n')
                      .map((line) => {
                        if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`
                        if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`
                        if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`
                        if (line.startsWith('- '))
                          return `<li>${line.substring(2)}</li>`
                        if (line.trim() === '')
                          return ''
                        return `<p>${line}</p>`
                      })
                      .join('\n')
                      .replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`),
                  }}
                />

                {/* Related Articles */}
                {selectedArticleContent.relatedArticles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 border-t border-slate-200 pt-8"
                  >
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Related Articles</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedArticleContent.relatedArticles.map((relId) => {
                        const relArticle = helpCenterArticles[relId]
                        return relArticle ? (
                          <motion.button
                            key={relId}
                            whileHover={{ x: 2 }}
                            onClick={() => setSelectedArticle(relId)}
                            className="group rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-white hover:shadow-sm"
                          >
                            <h4 className="text-sm font-medium text-slate-900 group-hover:text-blue-600">
                              {relArticle.title}
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              {relArticle.description}
                            </p>
                          </motion.button>
                        ) : null
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Feedback */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6"
                >
                  <p className="text-sm font-medium text-slate-900">Was this article helpful?</p>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                      Yes
                    </button>
                    <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                      No
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
