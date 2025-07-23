import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI;

let client: MongoClient | null = null

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
  }
  return client.db("email_backup_db")
}

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection("filtered_emails")

    // Fetch emails and transform them to match our interface
    const emails = await collection.find({}).toArray()

    const transformedEmails = emails.map((email) => ({
      _id: email._id.toString(),
      subject: email.subject || "No Subject",
      sender: email.sender || email.from || "Unknown Sender",
      content: email.content || email.body || "No content available",
      date: email.timestamp || email.date || new Date().toISOString(),
      classification: email.classification || "NOT_IMPORTANT",
      isImportant:
        email.isImportant || (email.classification && email.classification.toUpperCase() === "IMPORTANT") || false,
      isRead: email.isRead || false,
    }))

    return NextResponse.json(transformedEmails)
  } catch (error) {
    console.error("Error fetching emails:", error)
    return NextResponse.json({ message: "Failed to fetch emails" }, { status: 500 })
  }
}
