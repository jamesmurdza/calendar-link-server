import dotenv from 'dotenv';
import OpenAI from 'openai';
dotenv.config();

import { createGoogleCalendarUrl, createAppleCalendarUrl, createOutlookCalendarUrl, createYahooCalendarUrl } from '../utils/links.js';

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
      ...output,
      google_calendar_link: createGoogleCalendarUrl(output),
      apple_calendar_link: createAppleCalendarUrl(output),
      outlook_calendar_link: createOutlookCalendarUrl(output),
      yahoo_calendar_link: createYahooCalendarUrl(output),
    });
  } catch (error) {
    // Handle errors:
    console.error(error.message);
    res.status(500).send(error.message);
  }
}
