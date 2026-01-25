/**
 * LightOnOCR Service for KinCircle
 *
 * Provides local/offline OCR capabilities using the LightOnOCR-2-1B microservice.
 * Can be used as a fallback when Gemini is unavailable or for offline deployments.
 *
 * Configuration:
 *   VITE_OCR_SERVICE_URL - URL of the LightOnOCR microservice (default: http://localhost:8090)
 *   VITE_OCR_ENABLED - Enable/disable OCR service (default: false)
 */

import { logger } from "../utils/logger";

const OCR_SERVICE_URL = import.meta.env.VITE_OCR_SERVICE_URL as string || "http://localhost:8090";
const OCR_ENABLED = import.meta.env.VITE_OCR_ENABLED === "true";

interface OcrResponse {
  text: string;
  confidence?: number;
  processing_time_ms?: number;
}

interface ReceiptOcrResponse {
  raw_text: string;
  amount: number | null;
  date: string | null;
  merchant: string | null;
  items: string[];
  processing_time_ms?: number;
}

interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
}

/**
 * Check if the OCR service is enabled and healthy
 */
export const isOcrServiceAvailable = async (): Promise<boolean> => {
  if (!OCR_ENABLED) {
    return false;
  }

  try {
    const response = await fetch(`${OCR_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return false;
    }

    const health: HealthResponse = await response.json();
    return health.status === "healthy" && health.model_loaded;
  } catch (error) {
    logger.warn("OCR service health check failed:", error);
    return false;
  }
};

/**
 * OCR a base64-encoded image using LightOnOCR
 *
 * @param base64Image - Base64 encoded image (with or without data URI prefix)
 * @param maxTokens - Maximum tokens to generate (default: 2048)
 * @returns Extracted text from the image
 */
export const ocrImage = async (
  base64Image: string,
  maxTokens: number = 2048
): Promise<string> => {
  // Strip data URI prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await fetch(`${OCR_SERVICE_URL}/ocr/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_base64: cleanBase64,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      throw new Error(`OCR service returned ${response.status}`);
    }

    const result: OcrResponse = await response.json();
    logger.info(`LightOnOCR: Extracted ${result.text.length} chars in ${result.processing_time_ms}ms`);
    return result.text;
  } catch (error) {
    logger.error("LightOnOCR image processing failed:", error);
    throw error;
  }
};

/**
 * OCR a receipt image and extract structured data
 *
 * @param base64Image - Base64 encoded receipt image
 * @returns Structured receipt data (amount, date, merchant, raw text)
 */
export const ocrReceipt = async (
  base64Image: string
): Promise<{ amount: number; date: string; description: string; category: string }> => {
  // Strip data URI prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await fetch(`${OCR_SERVICE_URL}/ocr/receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_base64: cleanBase64,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`OCR service returned ${response.status}`);
    }

    const result: ReceiptOcrResponse = await response.json();
    logger.info(`LightOnOCR: Receipt OCR completed in ${result.processing_time_ms}ms`);

    // Map to the format expected by KinCircle
    return {
      amount: result.amount || 0,
      date: result.date || new Date().toISOString().split("T")[0],
      description: result.merchant || "",
      category: inferCategory(result.merchant || "", result.raw_text),
    };
  } catch (error) {
    logger.error("LightOnOCR receipt processing failed:", error);
    throw error;
  }
};

/**
 * Infer a category from merchant name and receipt text
 */
function inferCategory(merchant: string, rawText: string): string {
  const text = (merchant + " " + rawText).toLowerCase();

  // Medical/Pharmacy
  if (
    text.includes("pharmacy") ||
    text.includes("cvs") ||
    text.includes("walgreens") ||
    text.includes("rite aid") ||
    text.includes("prescription") ||
    text.includes("medical") ||
    text.includes("hospital") ||
    text.includes("clinic")
  ) {
    return "Medical";
  }

  // Groceries
  if (
    text.includes("grocery") ||
    text.includes("supermarket") ||
    text.includes("kroger") ||
    text.includes("walmart") ||
    text.includes("target") ||
    text.includes("costco") ||
    text.includes("safeway") ||
    text.includes("publix") ||
    text.includes("food")
  ) {
    return "Groceries";
  }

  // Gas/Transportation
  if (
    text.includes("gas") ||
    text.includes("shell") ||
    text.includes("exxon") ||
    text.includes("chevron") ||
    text.includes("bp") ||
    text.includes("uber") ||
    text.includes("lyft")
  ) {
    return "Transportation";
  }

  // Utilities
  if (
    text.includes("electric") ||
    text.includes("water") ||
    text.includes("utility") ||
    text.includes("power") ||
    text.includes("internet") ||
    text.includes("phone")
  ) {
    return "Utilities";
  }

  return "General";
}

/**
 * Check if OCR service is enabled in configuration
 */
export const isOcrEnabled = (): boolean => {
  return OCR_ENABLED;
};
