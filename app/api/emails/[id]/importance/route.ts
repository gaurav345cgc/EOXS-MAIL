import { type NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { isImportant, classification } = await request.json()
    const db = await connectToDatabase()
    const collection = db.collection("filtered_emails")

    const updateData: any = { isImportant }
    if (classification) {
      updateData.classification = classification
    }

    const result = await collection.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Email not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating email importance:", error)
    return NextResponse.json({ message: "Failed to update email" }, { status: 500 })
  }
}
