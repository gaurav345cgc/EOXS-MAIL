-- This is a MongoDB script to set up sample email data
-- Run this in MongoDB Compass or MongoDB shell

use email_backup_db;

db.filtered_emails.insertMany([
  {
    subject: "Welcome to our service!",
    sender: "welcome@company.com",
    content: "Thank you for joining our service. We're excited to have you on board!",
    date: new Date("2024-01-15T10:30:00Z"),
    isImportant: true,
    isRead: false
  },
  {
    subject: "Your monthly report is ready",
    sender: "reports@analytics.com",
    content: "Your monthly analytics report has been generated and is ready for review.",
    date: new Date("2024-01-14T14:20:00Z"),
    isImportant: false,
    isRead: true
  },
  {
    subject: "Security Alert: New login detected",
    sender: "security@company.com",
    content: "We detected a new login to your account from a new device. If this wasn't you, please secure your account immediately.",
    date: new Date("2024-01-13T09:15:00Z"),
    isImportant: true,
    isRead: false
  },
  {
    subject: "Newsletter: Weekly Tech Updates",
    sender: "newsletter@techblog.com",
    content: "Here are the latest technology updates and trends from this week.",
    date: new Date("2024-01-12T16:45:00Z"),
    isImportant: false,
    isRead: true
  },
  {
    subject: "Meeting reminder: Project Review",
    sender: "calendar@company.com",
    content: "Reminder: You have a project review meeting scheduled for tomorrow at 2 PM.",
    date: new Date("2024-01-11T11:00:00Z"),
    isImportant: true,
    isRead: false
  }
]);
