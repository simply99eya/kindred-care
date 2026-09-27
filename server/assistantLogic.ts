type ScheduleItem = { title: string; startTime: string; status: "planned" | "completed" };

function friendlyTime(value: string): string {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function answerFromSavedSchedule(message: string, dateKey: string, items: ScheduleItem[], localTime: string): string {
  const question = message.toLocaleLowerCase().trim();
  if (/\b(diagnos|treat|medicine|medication|dose|symptom|medical advice)\b/.test(question)) {
    return "I can help with saved plans, but I can’t give medical advice or recommend treatments. Please check with your care team.";
  }
  if (/\b(where|find|open|navigate|show me)\b/.test(question)) {
    if (/people|family|friend|person/.test(question)) return "Open **People I Know** to look through familiar people and their descriptions.";
    if (/calendar|schedule|agenda|activity/.test(question)) return "Open **Calendar** to see the day or choose another date.";
    return "You can use the menu to open **Today**, **Calendar**, **People I Know**, or **Help**.";
  }
  if (/\b(people|family|friend|who is)\b/.test(question)) {
    return "Open **People I Know** to see the familiar people your caregiver has added. I don’t identify faces in this demo.";
  }
  if (!/\b(today|tomorrow|schedule|agenda|next|upcoming|what|when|appointment|activity|plan|doing)\b/.test(question)) {
    return "I can help with your saved schedule or show you where to find things. You could ask, “What is next today?”";
  }

  const sorted = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (sorted.length === 0) return `I don’t see any activities saved for ${dateKey}. You can check with your caregiver.`;
  const isNextQuestion = /\b(next|upcoming)\b/.test(question) && /today/.test(question);
  const matches = isNextQuestion ? sorted.filter((item) => item.startTime >= localTime) : sorted;
  if (isNextQuestion && matches.length === 0) return `There are no more saved activities for today. You can check the calendar with your caregiver.`;

  const specific = sorted.find((item) => question.includes(item.title.toLocaleLowerCase()));
  if (specific) return `**${specific.title}** is saved for ${friendlyTime(specific.startTime)}${specific.status === "completed" ? " and is marked complete" : ""}.`;
  const rows = matches.slice(0, 5).map((item) => `• **${friendlyTime(item.startTime)}** — ${item.title}${item.status === "completed" ? " (complete)" : ""}`);
  return `Here’s what is saved for ${dateKey}:\n\n${rows.join("\n")}\n\nI’m using your saved schedule, so I won’t guess about anything that isn’t listed.`;
}
