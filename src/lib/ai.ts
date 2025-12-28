import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const model = openai(process.env.AI_MODEL || "gpt-4o-mini");

export async function generateAIData<T extends z.ZodTypeAny>(
  schema: T,
  prompt: string,
  count: number = 1
): Promise<z.infer<T>[]> {
  try {
    const arraySchema = z.object({
      items: z.array(schema),
    });

    const result = await generateText({
      model,
      prompt: `Generate ${count} realistic ${prompt}.
Ensure data is diverse, authentic, and follows Indian naming conventions and formats where applicable.
Return JSON strictly in this shape: { "items": [...] }`,
      output: Output.object({
        schema: arraySchema,
      }),
    });

    return result.output.items;
  } catch (error) {
    console.error("AI generation failed:", error);
    throw new Error("Failed to generate data with AI");
  }
}

export function isAIConfigured(): boolean {
  return (
    !!process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== "your_openai_api_key_here"
  );
}
