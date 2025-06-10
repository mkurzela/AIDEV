import axios from "axios";

export class WebService {
  static async checkEndpoint(
    endpoint: string,
    password: string
  ): Promise<string> {
    try {
      console.log(`\n🌐 Making POST request to ${endpoint} with password`);
      const response = await axios.post(endpoint, { password });
      console.log(`📥 Response from endpoint:`, response.data);

      // Extract just the message field from the response
      if (response.data && response.data.message) {
        const message = response.data.message;
        if (typeof message !== "string" || message.length < 10) {
          throw new Error(`Invalid message format or too short: ${message}`);
        }
        return message;
      }
      throw new Error("Invalid response format - missing message field");
    } catch (error: any) {
      console.error(`❌ Error checking endpoint:`, error.message);
      if (error.response) {
        console.error(`Response data:`, error.response.data);
      }
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }
}
