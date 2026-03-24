import { supabase } from "../adapter/openclawAdapter"

export interface ToolDefinition {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, any>
    required?: string[]
  }
}

export const TOOLS: Record<string, ToolDefinition[]> = {
  healthtech: [
    {
      name: "summarize_intake",
      description: "Summarizes a patient intake form into a professional clinical note.",
      input_schema: {
        type: "object",
        properties: {
          content: { type: "string", description: "The raw text of the intake form." },
          format:  { type: "string", enum: ["standard", "soape", "brief"], default: "standard" }
        },
        required: ["content"]
      }
    },
    {
      name: "write_clinical_record",
      description: "Saves a clinical note or record to the patient database.",
      input_schema: {
        type: "object",
        properties: {
          patientId: { type: "string" },
          note:      { type: "string" },
          category:  { type: "string", enum: ["consultation", "follow-up", "emergency"] }
        },
        required: ["patientId", "note"]
      }
    },
    {
      name: "consult_expert",
      description: "Consults an expert from another domain (agrotech, fintech) to get specialized advice.",
      input_schema: {
        type: "object",
        properties: {
          expertDomain: { type: "string", enum: ["agrotech", "fintech"] },
          query:        { type: "string" }
        },
        required: ["expertDomain", "query"]
      }
    }
  ],
  agrotech: [
    {
      name: "analyze_crop_health",
      description: "Analyzes sensor data and images to determine crop health status.",
      input_schema: {
        type: "object",
        properties: {
          fieldId: { type: "string" },
          data:    { type: "object", description: "NDVI, moisture, and temperature data." }
        },
        required: ["fieldId"]
      }
    },
    {
      name: "apply_treatment",
      description: "Applies a chemical or biological treatment to a specific field. REQUIRES APPROVAL.",
      input_schema: {
        type: "object",
        properties: {
          fieldId:   { type: "string" },
          treatment: { type: "string" },
          quantity:  { type: "string" }
        },
        required: ["fieldId", "treatment"]
      }
    },
    {
      name: "consult_expert",
      description: "Consults an expert from another domain (healthtech, fintech) to get specialized advice.",
      input_schema: {
        type: "object",
        properties: {
          expertDomain: { type: "string", enum: ["healthtech", "fintech"] },
          query:        { type: "string" }
        },
        required: ["expertDomain", "query"]
      }
    }
  ],
  fintech: [
    {
      name: "detect_fraud_patterns",
      description: "Analyzes transaction history to identify high-risk or fraudulent patterns.",
      input_schema: {
        type: "object",
        properties: {
          accountId:    { type: "string" },
          transactions: { type: "array", items: { type: "object" } }
        },
        required: ["accountId"]
      }
    },
    {
      name: "execute_transfer",
      description: "Moves funds between accounts. REQUIRES HUMAN APPROVAL.",
      input_schema: {
        type: "object",
        properties: {
          from:   { type: "string" },
          to:     { type: "string" },
          amount: { type: "number" },
          currency:{ type: "string", default: "USD" }
        },
        required: ["from", "to", "amount"]
      }
    },
    {
      name: "consult_expert",
      description: "Consults an expert from another domain (healthtech, agrotech) to get specialized advice.",
      input_schema: {
        type: "object",
        properties: {
          expertDomain: { type: "string", enum: ["healthtech", "agrotech"] },
          query:        { type: "string" }
        },
        required: ["expertDomain", "query"]
      }
    }
  ]
}

// ─── TOOL LOGIC ──────────────────────────────────────────────────────────────
export const TOOL_HANDLERS: Record<string, (args: any) => Promise<any>> = {
  summarize_intake: async (args) => {
    return { summary: `[SUMMARY] Generated clinical note for: ${args.content.slice(0, 50)}...`, format: args.format }
  },
  write_clinical_record: async (args) => {
    // REAL ACTION: We could write to Supabase here if we had the table
    console.log("Saving clinical record...", args)
    return { success: true, recordId: `rec_${Math.random().toString(36).slice(2)}` }
  },
  analyze_crop_health: async (args) => {
    const health = Math.random() > 0.3 ? "Healthy" : "Infected"
    return { status: health, fieldId: args.fieldId, recommendation: health === "Infected" ? "Apply Fungicide" : "Maintain watering" }
  },
  apply_treatment: async (args) => {
    return { status: "applied", treatment: args.treatment, fieldId: args.fieldId }
  },
  detect_fraud_patterns: async (args) => {
    return { risk_score: Math.floor(Math.random() * 100), flagged: Math.random() > 0.8 }
  },
  execute_transfer: async (args) => {
    return { status: "completed", txId: `tx_${Math.random().toString(36).slice(2)}`, amount: args.amount }
  }
}
