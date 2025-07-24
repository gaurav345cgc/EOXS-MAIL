"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Mail,
  Star,
  Trash2,
  MoreVertical,
  Search,
  ArrowLeft,
  Sun,
  Moon,
  X,
  Menu,
  Send,
  Edit3,
  Inbox,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Email {
  _id: string
  subject: string
  sender: string
  content: string
  date: string
  classification: string
  isImportant: boolean
  isRead: boolean
}

export default function EmailDashboard() {
  const [emails, setEmails] = useState<Email[]>([])
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([])
  const [currentView, setCurrentView] = useState<"important" | "not-important">("important")
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [splitPosition, setSplitPosition] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    fetchEmails()
  }, [])

  useEffect(() => {
    filterEmails()
  }, [emails, currentView, searchTerm])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/emails")

      if (response.ok) {
        const data = await response.json()
        setEmails(data)
      } else {
        setError("Failed to fetch emails")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const filterEmails = () => {
    let filtered = emails

    if (currentView === "important") {
      filtered = filtered.filter((email) => {
        return (
          email.classification === "IMPORTANT" ||
          email.isImportant === true ||
          (email.classification && email.classification.toUpperCase() === "IMPORTANT")
        )
      })
    } else if (currentView === "not-important") {
      filtered = filtered.filter((email) => {
        return (
          email.classification !== "IMPORTANT" &&
          email.isImportant !== true &&
          (!email.classification || email.classification.toUpperCase() !== "IMPORTANT")
        )
      })
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (email) =>
          email.subject.toLowerCase().includes(searchLower) ||
          email.sender.toLowerCase().includes(searchLower) ||
          email.content.toLowerCase().includes(searchLower) ||
          (email.classification && email.classification.toLowerCase().includes(searchLower)),
      )
    }

    // Sort emails by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredEmails(filtered)
  }

  const toggleImportance = async (emailId: string, isImportant: boolean) => {
    try {
      const newClassification = !isImportant ? "IMPORTANT" : "NOT_IMPORTANT"
      const response = await fetch(`/api/emails/${emailId}/importance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isImportant: !isImportant,
          classification: newClassification,
        }),
      })

      if (response.ok) {
        setEmails(
          emails.map((email) =>
            email._id === emailId ? { ...email, isImportant: !isImportant, classification: newClassification } : email,
          ),
        )
        if (selectedEmail?._id === emailId) {
          setSelectedEmail(null)
        }
      }
    } catch (err) {
      setError("Failed to update email importance")
    }
  }

  const deleteEmail = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setEmails(emails.filter((email) => email._id !== emailId))
        setSelectedEmail(null)
      }
    } catch (err) {
      setError("Failed to delete email")
    }
  }

  const markAsRead = async (emailId: string) => {
    try {
      await fetch(`/api/emails/${emailId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: true }),
      })

      setEmails(emails.map((email) => (email._id === emailId ? { ...email, isRead: true } : email)))
    } catch (err) {
      console.error("Failed to mark as read")
    }
  }

  const getViewTitle = () => {
    return currentView === "important" ? "Starred" : "Inbox"
  }

  const getViewCount = () => {
    return currentView === "important"
      ? emails.filter((e) => {
          return (
            e.classification === "IMPORTANT" ||
            e.isImportant === true ||
            (e.classification && e.classification.toUpperCase() === "IMPORTANT")
          )
        }).length
      : emails.filter((e) => {
          return (
            e.classification !== "IMPORTANT" &&
            e.isImportant !== true &&
            (!e.classification || e.classification.toUpperCase() !== "IMPORTANT")
          )
        }).length
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  const clampSplitPosition = (pos: number) => Math.min(70, Math.max(30, pos))

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100

    setSplitPosition(clampSplitPosition(newPosition))
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing])

  useEffect(() => {
    const handleResize = () => {
      setSplitPosition((pos) => clampSplitPosition(pos))
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    )
  }

  // Mobile view when email is selected
  if (isMobile && selectedEmail) {
    return (
      <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <header
          className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-4 py-3 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className={`text-xl font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>Gmail</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <div className={`${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
          <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className="flex flex-col space-y-3">
              <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {selectedEmail.subject}
              </h3>
              <div className={`flex flex-col space-y-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <span>{selectedEmail.sender}</span>
                <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                {(selectedEmail.classification === "IMPORTANT" || selectedEmail.isImportant) && (
                  <Badge variant="secondary" className="w-fit bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Important
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleImportance(
                      selectedEmail._id,
                      selectedEmail.isImportant || selectedEmail.classification === "IMPORTANT",
                    )
                  }
                  className="flex-1"
                >
                  <Star className="h-4 w-4 mr-1" />
                  {selectedEmail.isImportant || selectedEmail.classification === "IMPORTANT" ? "Unstar" : "Star"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteEmail(selectedEmail._id)} className="flex-1">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="prose max-w-none">
              <p className={`whitespace-pre-wrap leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {selectedEmail.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      {/* Gmail-style Header */}
      <header
        className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-2 shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="p-2 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Mail className="h-6 w-6 text-red-500" />
                <h1 className={`text-xl font-normal ${isDarkMode ? "text-white" : "text-gray-700"}`}>Gmail</h1>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search mail"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-12 pr-10 h-12 rounded-full border-0 shadow-sm ${
                  isDarkMode
                    ? "bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600"
                    : "bg-gray-100 focus:bg-white focus:shadow-md"
                }`}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2 rounded-full">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Gmail-style Sidebar */}
        <div
          className={`w-16 md:w-64 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"} transition-all duration-300 flex-shrink-0`}
        >
          <div className="p-4">
            <nav className="space-y-1">
              <Button
                variant="ghost"
                className={`w-full justify-start h-10 px-3 rounded-r-full ${
                  currentView === "important"
                    ? isDarkMode
                      ? "bg-red-900 text-red-100 hover:bg-red-800"
                      : "bg-red-100 text-red-900 hover:bg-red-200"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setCurrentView("important")}
              >
                <Star className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="hidden md:inline font-medium">Starred</span>
                {emails.filter((e) => e.classification === "IMPORTANT" || e.isImportant).length > 0 && (
                  <span
                    className={`hidden md:inline ml-auto text-sm ${
                      currentView === "important" ? "text-red-700" : "text-gray-500"
                    }`}
                  >
                    {emails.filter((e) => e.classification === "IMPORTANT" || e.isImportant).length}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                className={`w-full justify-start h-10 px-3 rounded-r-full ${
                  currentView === "not-important"
                    ? isDarkMode
                      ? "bg-red-900 text-red-100 hover:bg-red-800"
                      : "bg-red-100 text-red-900 hover:bg-red-200"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setCurrentView("not-important")}
              >
                <Inbox className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="hidden md:inline font-medium">Inbox</span>
                {getViewCount() > 0 && currentView === "not-important" && (
                  <span
                    className={`hidden md:inline ml-auto text-sm ${
                      currentView === "not-important" ? "text-red-700" : "text-gray-500"
                    }`}
                  >
                    {emails.filter((e) => e.classification !== "IMPORTANT" && !e.isImportant).length}
                  </span>
                )}
              </Button>
            </nav>
          </div>
        </div>

        {/* Email List and Content */}
        <div className="flex-1 flex relative" ref={containerRef}>
          {/* Email List */}
          <div
            className={`${isDarkMode ? "bg-gray-900" : "bg-white"} transition-all duration-300`}
            style={{
              width: !selectedEmail || isMobile ? "100%" : `${splitPosition}%`,
              minWidth: !selectedEmail || isMobile ? undefined : "30%",
              maxWidth: !selectedEmail || isMobile ? undefined : "70%",
            }}
          >
            <div className={`px-6 py-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-normal ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {getViewTitle()}
                </h2>
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {getViewCount()} emails
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="m-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="overflow-y-auto h-[calc(100vh-140px)]">
              {filteredEmails.length === 0 ? (
                <div className={`p-12 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No emails found</p>
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <div
                    key={email._id}
                    className={`group px-6 py-3 border-b cursor-pointer transition-all duration-150 ${
                      isDarkMode ? "border-gray-800 hover:shadow-md" : "border-gray-100 hover:shadow-sm"
                    } ${
                      selectedEmail?._id === email._id
                        ? isDarkMode
                          ? "bg-red-900 bg-opacity-20 border-red-800"
                          : "bg-red-50 border-red-200"
                        : isDarkMode
                          ? "hover:bg-gray-800"
                          : "hover:bg-gray-50"
                    } ${!email.isRead ? "bg-opacity-50" : ""}`}
                    onClick={() => {
                      setSelectedEmail(email)
                      if (!email.isRead) {
                        markAsRead(email._id)
                      }
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {email.classification === "IMPORTANT" || email.isImportant ? (
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        ) : (
                          <div className="h-5 w-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <p
                                className={`text-sm truncate ${
                                  !email.isRead
                                    ? isDarkMode
                                      ? "font-semibold text-white"
                                      : "font-semibold text-gray-900"
                                    : isDarkMode
                                      ? "font-medium text-gray-300"
                                      : "font-medium text-gray-700"
                                }`}
                              >
                                {email.sender}
                              </p>
                              <p
                                className={`text-sm truncate flex-1 ${
                                  !email.isRead
                                    ? isDarkMode
                                      ? "font-medium text-white"
                                      : "font-medium text-gray-900"
                                    : isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                }`}
                              >
                                {email.subject}
                              </p>
                            </div>
                            <p className={`text-xs mt-1 truncate ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                              {email.content.length > 80 ? email.content.slice(0, 80) + "..." : email.content}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                              {new Date(email.date).toLocaleDateString()}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}
                              >
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleImportance(
                                      email._id,
                                      email.isImportant || email.classification === "IMPORTANT",
                                    )
                                  }}
                                  className={isDarkMode ? "text-gray-300 hover:bg-gray-700" : ""}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  {email.isImportant || email.classification === "IMPORTANT" ? "Unstar" : "Star"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteEmail(email._id)
                                  }}
                                  className={`text-red-600 ${isDarkMode ? "hover:bg-gray-700" : ""}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resizable Divider */}
          {selectedEmail && !isMobile && (
            <div
              className={`absolute inset-y-0 w-1 cursor-col-resize transition-colors duration-200 ${
                isResizing
                  ? "bg-red-500"
                  : isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-300 hover:bg-gray-400"
              }`}
              style={{ left: `${splitPosition}%`, transform: "translateX(-50%)" }}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute inset-0 w-3 -translate-x-1/2" />
            </div>
          )}

          {/* Email Content */}
          {!isMobile && (
            <div
              className={`${isDarkMode ? "bg-gray-900" : "bg-white"} transition-all duration-300`}
              style={{
                width: selectedEmail ? `${100 - splitPosition}%` : "0%",
                minWidth: selectedEmail ? "30%" : 0,
                maxWidth: selectedEmail ? "70%" : 0,
                display: selectedEmail ? undefined : "none",
              }}
            >
              {selectedEmail ? (
                <div className="h-full flex flex-col">
                  <div className={`p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-2xl font-normal mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {selectedEmail.subject}
                        </h3>
                        <div
                          className={`flex items-center space-x-4 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                        >
                          <span className="font-medium">{selectedEmail.sender}</span>
                          <span>•</span>
                          <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                          {(selectedEmail.classification === "IMPORTANT" || selectedEmail.isImportant) && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Starred
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleImportance(
                            selectedEmail._id,
                            selectedEmail.isImportant || selectedEmail.classification === "IMPORTANT",
                          )
                        }
                        className={`${isDarkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50"}`}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {selectedEmail.isImportant || selectedEmail.classification === "IMPORTANT" ? "Unstar" : "Star"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEmail(selectedEmail._id)}
                        className={`${isDarkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50"}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="prose max-w-none">
                      <p
                        className={`whitespace-pre-wrap leading-relaxed text-base ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {selectedEmail.content}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`h-full flex items-center justify-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  <div className="text-center">
                    <Mail className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-light">Select a conversation to read</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
