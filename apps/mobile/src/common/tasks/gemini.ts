import axios from "axios";

const GEMINI_API_KEY = "AIzaSyA5XWWjLqH_eEyYIJ2wvzhaXdrnAEXJO_I";

export const getFirstAidResponse = async (
  userMessage: string
): Promise<string> => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are a medical first aid assistant. Give short clear instructions and remind users to seek professional help.\n\nUser: ${userMessage}`
              }
            ]
          }
        ]
      }
    );

    return response.data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error(error);
    return "Sorry, I couldn't retrieve first aid information.";
  }
};