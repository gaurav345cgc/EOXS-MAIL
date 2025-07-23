import { type NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const MONGODB_URI =
  "mongodb+srv://innovationcelleoxs19:AkMuA3cN2tsMllAx@cluster0.cywqo3w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

let client: MongoClient | null = null

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
  }
  return client.db("email_backup_db")
}

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided")
  }

  const token = authHeader.substring(7)
  return jwt.verify(token, JWT_SECRET)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection("filtered_emails")

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Email not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting email:", error)
    return NextResponse.json({ message: "Failed to delete email" }, { status: 500 })
  }
}
