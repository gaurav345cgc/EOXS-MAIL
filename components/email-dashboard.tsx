"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Star, Trash2, AlertCircle, MoreVertical, Search, ArrowLeft, Sun, Moon, X } from "lucide-react"
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
  const [splitPosition, setSplitPosition] = useState(50) // Start at 40% for better default
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
    // Check for saved theme preference
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

    // Filter by classification (important/not important)
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

    // Enhanced search - search across all text fields
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
        // If we're viewing the email and it's moved to a different category, close it
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
    return currentView === "important" ? "Important Emails" : "Regular Emails"
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

  // Clamp splitPosition between 30 and 70
  const clampSplitPosition = (pos: number) => Math.min(70, Math.max(30, pos))

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Clamp the split position between 20% and 80%
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

  // Ensure splitPosition stays in bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setSplitPosition((pos) => clampSplitPosition(pos))
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-black" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Mobile view when email is selected
  if (isMobile && selectedEmail) {
    return (
      <div className={`min-h-screen w-full max-w-full overflow-x-auto ${isDarkMode ? "bg-black" : "bg-gray-50"}`}>
        <header
          className={`${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-b px-4 py-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Mail className="h-6 w-6 text-blue-600" />
              <h1 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>EOXS</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className={`${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
          <div className={`p-4 border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
            <div className="flex flex-col space-y-3">
              <h3 className={`text-lg font-semibold break-words ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {selectedEmail.subject}
              </h3>
              <div className={`flex flex-col space-y-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <span className="break-words">From: {selectedEmail.sender}</span>
                <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                {(selectedEmail.classification === "IMPORTANT" || selectedEmail.isImportant) && (
                  <Badge variant="secondary" className="w-fit">
                    <Star className="h-3 w-3 mr-1" />
                    Important
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleImportance(
                      selectedEmail._id,
                      selectedEmail.isImportant || selectedEmail.classification === "IMPORTANT",
                    )
                  }
                  className="flex-1 min-w-0"
                >
                  <Star className="h-4 w-4 mr-1" />
                  {selectedEmail.isImportant || selectedEmail.classification === "IMPORTANT"
                    ? "Move to Regular"
                    : "Move to Important"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteEmail(selectedEmail._id)}
                  className="flex-1 min-w-0"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4 w-full max-w-full overflow-x-auto">
            <div className="prose max-w-none overflow-x-auto">
              <p
                className={`whitespace-pre-wrap break-words break-all max-w-full leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {selectedEmail.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-auto ${isDarkMode ? "bg-black" : "bg-gray-50"}`}>
      {/* Header */}
      <header
        className={`${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-b px-4 md:px-6 py-4 shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? "bg-blue-900" : "bg-blue-100"}`}>
                <Mail className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <h1 className={`text-lg md:text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>EOXS</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-10 w-48 md:w-80 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300"}`}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="rounded-full">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Simplified Sidebar - Fixed Width */}
        <div
          className={`w-16 md:w-64 max-w-full ${
            isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
          } border-r transition-all duration-300 ease-in-out shadow-sm flex-shrink-0 overflow-x-auto`}
        >
          <div className="p-3 md:p-4">
            {/* Navigation - Only Important and Regular */}
            <nav className="space-y-2">
              <Button
                variant={currentView === "important" ? "default" : "ghost"}
                className={`w-full h-12 justify-between rounded-lg transition-all duration-200 ${
                  currentView === "important"
                    ? isDarkMode
                      ? "bg-blue-900 text-blue-100 hover:bg-blue-800"
                      : "bg-blue-100 text-blue-900 hover:bg-blue-200"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                      : "text-gray-700 hover:bg-gray-100"
                } px-4`}
                onClick={() => setCurrentView("important")}
              >
                <div className="flex items-center min-w-0">
                  <Star className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden md:inline font-medium ml-3 truncate">Important</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`hidden md:inline-flex flex-shrink-0 ml-2 min-w-[24px] justify-center ${
                    isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {emails.filter((e) => e.classification === "IMPORTANT" || e.isImportant).length}
                </Badge>
              </Button>

              <Button
                variant={currentView === "not-important" ? "default" : "ghost"}
                className={`w-full h-12 justify-between rounded-lg transition-all duration-200 ${
                  currentView === "not-important"
                    ? isDarkMode
                      ? "bg-blue-900 text-blue-100 hover:bg-blue-800"
                      : "bg-blue-100 text-blue-900 hover:bg-blue-200"
                    : isDarkMode
                      ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                      : "text-gray-700 hover:bg-gray-100"
                } px-4`}
                onClick={() => setCurrentView("not-important")}
              >
                <div className="flex items-center min-w-0">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden md:inline font-medium ml-3 truncate">Regular</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`hidden md:inline-flex flex-shrink-0 ml-2 min-w-[24px] justify-center ${
                    isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {emails.filter((e) => e.classification !== "IMPORTANT" && !e.isImportant).length}
                </Badge>
              </Button>
            </nav>
          </div>
        </div>

        {/* Email List and Content with Resizable Split */}
        <div className="flex-1 flex relative" ref={containerRef}>
          {/* Email List */}
          <div
            className={`${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-r transition-all duration-300 w-full max-w-full overflow-x-auto`}
            style={{ width: !selectedEmail || isMobile ? "100%" : `${splitPosition}%`, minWidth: !selectedEmail || isMobile ? undefined : "30%", maxWidth: !selectedEmail || isMobile ? undefined : "70%" }}
          >
            <div className={`p-4 border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {getViewTitle()}
              </h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{getViewCount()} emails</p>
            </div>

            {error && (
              <Alert variant="destructive" className="m-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="overflow-y-auto h-[calc(100vh-160px)]">
              {filteredEmails.length === 0 ? (
                <div className={`p-8 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No emails found</p>
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <div
                    key={email._id}
                    className={`group p-4 border-b cursor-pointer transition-colors duration-200 w-full max-w-full ${
                      isDarkMode ? "border-gray-800 hover:bg-gray-800" : "border-gray-100 hover:bg-gray-50"
                    } ${
                      selectedEmail?._id === email._id
                        ? isDarkMode
                          ? "bg-blue-900 border-blue-800"
                          : "bg-blue-50 border-blue-200"
                        : ""
                    } ${!email.isRead ? "font-medium" : ""}`}
                    onClick={() => {
                      setSelectedEmail(email)
                      if (!email.isRead) {
                        markAsRead(email._id)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between w-full max-w-full">
                      <div className="flex-1 min-w-0 pr-2 w-full max-w-full">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm break-words whitespace-normal ${!email.isRead ? "font-semibold" : "font-medium"} ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {email.sender}
                          </p>
                          {(email.classification === "IMPORTANT" || email.isImportant) && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                          )}
                        </div>
                        {currentView === "important" ? (
                          <>
                            <p className={`text-xs break-words whitespace-normal mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {email.content.length > 40 ? email.content.slice(0, 40) + '...' : email.content}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className={`text-xs break-words whitespace-normal mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {email.content.length > 40 ? email.content.slice(0, 40) + '...' : email.content}
                            </p>
                          </>
                        )}
                        <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          {new Date(email.date).toLocaleDateString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleImportance(email._id, email.isImportant || email.classification === "IMPORTANT")
                            }}
                            className={isDarkMode ? "text-gray-300 hover:bg-gray-700" : ""}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {email.isImportant || email.classification === "IMPORTANT"
                              ? "Move to Regular"
                              : "Move to Important"}
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
                ))
              )}
            </div>
          </div>

          {/* Resizable Divider */}
          {selectedEmail && !isMobile && (
            <div
              className={`absolute inset-y-0 w-1 cursor-col-resize transition-colors duration-200 ${
                isResizing
                  ? "bg-blue-500"
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

          {/* Email Content - Desktop Only */}
          {!isMobile && (
            <div
              className={`${isDarkMode ? "bg-gray-900" : "bg-white"} transition-all duration-300 overflow-x-auto w-full max-w-full`}
              style={{ width: selectedEmail ? `${100 - splitPosition}%` : "0%", minWidth: selectedEmail ? "30%" : 0, maxWidth: selectedEmail ? "70%" : 0, display: selectedEmail ? undefined : "none" }}
            >
              {selectedEmail ? (
                <div className="h-full flex flex-col">
                  <div className={`p-6 border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"} flex-shrink-0`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3
                          className={`text-xl font-semibold mb-2 break-words ${isDarkMode ? "text-white" : "text-gray-900"}`}
                        >
                          {selectedEmail.subject}
                        </h3>
                        <div
                          className={`flex flex-col space-y-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                        >
                          <span className="break-words">From: {selectedEmail.sender}</span>
                          <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                          {(selectedEmail.classification === "IMPORTANT" || selectedEmail.isImportant) && (
                            <Badge variant="secondary" className="w-fit">
                              <Star className="h-3 w-3 mr-1" />
                              Important
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleImportance(
                            selectedEmail._id,
                            selectedEmail.isImportant || selectedEmail.classification === "IMPORTANT",
                          )
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                          isDarkMode
                            ? "border-gray-700 hover:bg-gray-800 text-gray-300"
                            : "border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <Star className="h-4 w-4" />
                        {selectedEmail.isImportant || selectedEmail.classification === "IMPORTANT"
                          ? "Move to Regular"
                          : "Move to Important"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEmail(selectedEmail._id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                          isDarkMode
                            ? "border-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-300"
                            : "border-gray-300 hover:bg-red-50 text-gray-700 hover:text-red-600"
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="prose max-w-none overflow-x-auto">
                      <p
                        className={`whitespace-pre-wrap break-words break-all max-w-full leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
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
                    <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Select an email to read</p>
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
