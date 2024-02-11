import dotenv from 'dotenv';
import OpenAI from 'openai';
dotenv.config();

// This endpoint generates text from a prompt.
// See documentation: https://platform.openai.com/docs/api-reference/chat/create

// The following settings are used:
const MODEL = 'gpt-3.5-turbo';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const outputSpec = `{
  title: "Team Meeting",
  startTime: "2024-02-11T09:00:00",
  endTime: "2024-02-11T10:00:00",
  location: "Conference Room 2A",
  description: "Weekly team meeting to discuss project updates.",
  guests: ["john@example.com", "sarah@example.com", "alex@example.com"],
  recurrence: "RRULE:FREQ=WEEKLY;BYDAY=MO;WKST=SU"
}`;

function createGoogleCalendarUrl(options) {
  const {
    title: eventTitle,
    startTime,
    endTime,
    description = '',
    location = '',
    timezone,
    recurrence: recurrenceRule,
    guests = [],
  } = options;

  // Base URL for adding events to Google Calendar
  const baseUrl = 'http://www.google.com/calendar/render';

  // Format dates to 'YYYYMMDDTHHMMSSZ' format
  const formatDateTime = (date) => {
    return new Date(date).toISOString().replace(/-|:|\.\d{3}/g, '');
  };

  // Construct query parameters
  const queryParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: `${formatDateTime(startTime)}/${formatDateTime(endTime)}`,
    details: description,
    location: location,
    trp: 'false',
    sprop: '',
    sprop: 'name:',
  });

  // Encode and join guests to a comma-separated string
  const formattedGuests = guests.map(encodeURIComponent).join(',');

  // Add guests if provided
  if (guests.length > 0) {
    queryParams.append('add', formattedGuests);
  }

  // Add timezone and recurrence rule if provided
  if (timezone) {
    queryParams.append('ctz', timezone);
  }

  if (recurrenceRule) {
    // Correctly format the recurrence rule without double-encoding
    const formattedRecurrenceRule = `RRULE:${recurrenceRule}`;
    queryParams.append('recur', formattedRecurrenceRule);
  }

  // Return the full URL
  return `${baseUrl}?${queryParams.toString()}`;
}

function DEPRE_createGoogleCalendarLink(event) {
  const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
  let url = `${baseUrl}&text=${encodeURIComponent(event.title)}`;

  const formatDateTime = (input) => {
    // Check if input is already a Date object
    const date = input instanceof Date ? input : new Date(input);

    // Convert the date object to an ISO string, which looks like "YYYY-MM-DDTHH:mm:ss.sssZ"
    // Then apply a regular expression to remove dashes, colons, and milliseconds
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };

  url += `&dates=${formatDateTime(event.startTime)}/${formatDateTime(
    event.endTime
  )}`;

  if (event.location) {
    url += `&location=${encodeURIComponent(event.location)}`;
  }

  if (event.description) {
    url += `&details=${encodeURIComponent(event.description)}`;
  }

  if (event.guests && event.guests.length > 0) {
    const guests = event.guests
      .map((email) => encodeURIComponent(email))
      .join(',');
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
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nGiven the above calendar details, output a JSON object in the format:\n\n${outputSpec}`,
        },
      ],
      //response_format: "json",
    });
    // Parse output as JSON
    const output = JSON.parse(completion.choices[0].message.content);
    res.json({
      google_calendar_link: createGoogleCalendarUrl(output),
    });
  } catch (error) {
    // Handle errors:
    console.error(error.message);
    res.status(500).send(error.message);
  }
}
