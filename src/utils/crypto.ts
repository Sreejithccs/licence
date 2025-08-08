/**
 * Client-side decryption utility for renewal tokens
 * In a production environment, decryption should be handled server-side
 * or using a more secure method. This is a basic implementation.
 */

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export const decryptToken = async (encryptedToken: string): Promise<string> => {
  console.log("Decrypting token:", encryptedToken);
  try {
    // In a real application, this would make an API call to your backend
    // to decrypt the token securely
    const response = await fetch(`${API_BASE_URL}/dev/decrypt-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: encryptedToken }),
    });
    console.log("Response:", response);

    if (!response.ok) {
      throw new Error("Failed to decrypt token");
    }

    const data: { decrypted: string } = await response.json();
    console.log("Decrypted data:", data);
    return data.decrypted;
  } catch (error) {
    console.log("Error decrypting token:", error);
    console.error("Error decrypting token:", error);
    throw error;
  }
};

/**
 * Hook to extract and decrypt the app_id from the URL token
 */
export const useDecryptedTokenData = (): [
  any | null,
  boolean,
  Error | null
] => {
  const [tokenData, setTokenData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    const decryptTokenData = async () => {
      if (!token) {
        setIsLoading(false);
        setError(new Error("No token provided"));
        return;
      }

      try {
        const decryptedToken = await decryptToken(token);

        // Try to parse as JSON, if it fails, assume it's a plain string (app_id)
        let data;
        try {
          data = JSON.parse(decryptedToken);
        } catch (e) {
          // If it's not JSON, treat it as a plain app_id string
          data = { app_id: decryptedToken };
        }

        setTokenData(data);
      } catch (err) {
        console.error("Error decrypting token data:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to decrypt token data")
        );
      } finally {
        setIsLoading(false);
      }
    };

    decryptTokenData();
  }, [searchParams]);

  return [tokenData, isLoading, error];
};
