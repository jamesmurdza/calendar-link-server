import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

// This endpoint generates text from a prompt.
// See documentation: https://platform.openai.com/docs/api-reference/chat/create

// The following settings are used:
const MODEL = "gpt-3.5-turbo";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const outputSpec = `
type EventDetails = {
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
  guests?: string[]; // Array of guest email addresses
  recurrence?: string; // RFC 5545 recurrence rule
};`;

function createGoogleCalendarLink(event) {
  const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
  let url = `${baseUrl}&text=${encodeURIComponent(event.title)}`;

  const formatDateTime = (input) => {
    // Check if input is already a Date object
    const date = input instanceof Date ? input : new Date(input);
  
    // Convert the date object to an ISO string, which looks like "YYYY-MM-DDTHH:mm:ss.sssZ"
    // Then apply a regular expression to remove dashes, colons, and milliseconds
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };  

  url += `&dates=${formatDateTime(event.startTime)}/${formatDateTime(event.endTime)}`;

  if (event.location) {
    url += `&location=${encodeURIComponent(event.location)}`;
  }

  if (event.description) {
    url += `&details=${encodeURIComponent(event.description)}`;
  }

  if (event.guests && event.guests.length > 0) {
    const guests = event.guests.map(email => encodeURIComponent(email)).join(',');
    url += `&add=${guests}`;
  }

  if (event.recurrence) {
    url += `&recur=RRULE:${encodeURIComponent(event.recurrence)}`;
  }

  // Google Calendar does not directly support URL parameter for reminders.
  // You would typically set reminders in your calendar settings or handle them within your application.

  return url;
}

export default async function textEndpoint(req, res) {
  try {
    const { prompt } = req.query;
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: `${prompt}\n\nGiven the above calendar details, output a JSON object in the format:\n\n${outputSpec}` }],
      //response_format: "json",
    });
    // Parse output as JSON
    const output = JSON.parse(completion.choices[0].message.content);
    res.json({
      google_calendar_link: createGoogleCalendarLink(output),
    });
  } catch (error) {
    // Handle errors:
    console.error(error.message);
    res.status(500).send(error.message);
  }
}
