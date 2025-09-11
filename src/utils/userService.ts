import api from "./api";

export interface UserData {
  id: string;
  username: string;
  empCode: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  name?: string;
  email?: string;
}

export const getUserByEmpCode = async (
  empCode: string,
  token: string
): Promise<UserData> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/emp-code/${empCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user by empCode:", error);
    throw error;
  }
};
