export type AssistantLanguage = "en" | "ar";
type ScheduleItem = { title: string; startTime: string; status: "planned" | "completed" };

function friendlyTime(value: string, language: AssistantLanguage): string {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function friendlyDateKey(value: string, language: AssistantLanguage): string {
  if (language === "en") return value;
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("ar-EG-u-ca-gregory", { dateStyle: "full" }).format(new Date(year, month - 1, day, 12));
}

export function answerFromSavedSchedule(
  message: string,
  dateKey: string,
  items: ScheduleItem[],
  localTime: string,
  language: AssistantLanguage = "en",
): string {
  const question = message.toLocaleLowerCase().trim();
  const arabic = language === "ar";

  if (arabic ? /(تشخيص|علاج|دواء|أدوية|جرعة|أعراض|عرض|نصيحة طبية|طبي)/.test(question) : /\b(diagnos|treat|medicine|medication|dose|symptom|medical advice)\b/.test(question)) {
    return arabic
      ? "يمكنني مساعدتك في الخطط المحفوظة، لكن لا أستطيع تقديم نصائح طبية أو اقتراح علاجات. يُرجى التواصل مع فريق الرعاية."
      : "I can help with saved plans, but I can’t give medical advice or recommend treatments. Please check with your care team.";
  }

  if (arabic ? /(أين|كيف أجد|افتح|اعرض|أرني|أين أرى)/.test(question) : /\b(where|find|open|navigate|show me)\b/.test(question)) {
    if (arabic ? /(أشخاص|عائلة|صديق|شخص)/.test(question) : /people|family|friend|person/.test(question)) {
      return arabic ? "افتح «أشخاص أعرفهم» للاطلاع على الأشخاص المألوفين وأوصافهم." : "Open **People I Know** to look through familiar people and their descriptions.";
    }
    if (arabic ? /(تقويم|جدول|مواعيد|نشاط)/.test(question) : /calendar|schedule|agenda|activity/.test(question)) {
      return arabic ? "افتح «التقويم» لمراجعة اليوم أو اختيار تاريخ آخر." : "Open **Calendar** to see the day or choose another date.";
    }
    return arabic
      ? "يمكنك استخدام القائمة لفتح «اليوم» أو «التقويم» أو «أشخاص أعرفهم» أو «المساعدة»."
      : "You can use the menu to open **Today**, **Calendar**, **People I Know**, or **Help**.";
  }

  if (arabic ? /(أشخاص|عائلة|صديق|من هو|من هذه)/.test(question) : /\b(people|family|friend|who is)\b/.test(question)) {
    return arabic
      ? "افتح «أشخاص أعرفهم» لرؤية الأشخاص المألوفين الذين أضافهم مقدم الرعاية. لا أتعرف على الوجوه في هذه النسخة التجريبية."
      : "Open **People I Know** to see the familiar people your caregiver has added. I don’t identify faces in this demo.";
  }

  if (arabic ? !/(اليوم|غدًا|غدا|جدول|خطة|التالي|القادم|ما|ماذا|متى|موعد|نشاط|أفعل)/.test(question) : !/\b(today|tomorrow|schedule|agenda|next|upcoming|what|when|appointment|activity|plan|doing)\b/.test(question)) {
    return arabic
      ? "يمكنني مساعدتك في جدولك المحفوظ أو إرشادك إلى مكان الأشياء. يمكنك أن تسأل: «ما التالي اليوم؟»"
      : "I can help with your saved schedule or show you where to find things. You could ask, “What is next today?”";
  }

  const sorted = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const friendlyDate = friendlyDateKey(dateKey, language);
  if (sorted.length === 0) {
    return arabic
      ? `لا أرى أنشطة محفوظة لهذا اليوم (${friendlyDate}). يمكنك الاستفسار من مقدم الرعاية.`
      : `I don’t see any activities saved for ${dateKey}. You can check with your caregiver.`;
  }
  const isNextQuestion = arabic ? /(التالي|القادم)/.test(question) && /(اليوم)/.test(question) : /\b(next|upcoming)\b/.test(question) && /today/.test(question);
  const matches = isNextQuestion ? sorted.filter((item) => item.startTime >= localTime) : sorted;
  if (isNextQuestion && matches.length === 0) {
    return arabic
      ? "لا توجد أنشطة محفوظة أخرى لهذا اليوم. يمكنك مراجعة التقويم مع مقدم الرعاية."
      : "There are no more saved activities for today. You can check the calendar with your caregiver.";
  }

  const specific = sorted.find((item) => question.includes(item.title.toLocaleLowerCase()));
  if (specific) {
    const complete = specific.status === "completed" ? (arabic ? " ومعلّم كمكتمل" : " and is marked complete") : "";
    return arabic
      ? `تم حفظ **${specific.title}** في الساعة ${friendlyTime(specific.startTime, language)}${complete}.`
      : `**${specific.title}** is saved for ${friendlyTime(specific.startTime, language)}${complete}.`;
  }

  const rows = matches.slice(0, 5).map((item) => `• **${friendlyTime(item.startTime, language)}** — ${item.title}${item.status === "completed" ? (arabic ? " (مكتمل)" : " (complete)") : ""}`);
  return arabic
    ? `هذه الأنشطة المحفوظة ليوم ${friendlyDate}:\n\n${rows.join("\n")}\n\nأعتمد على جدولك المحفوظ، لذلك لن أخمّن بشأن أي شيء غير مدرج فيه.`
    : `Here’s what is saved for ${dateKey}:\n\n${rows.join("\n")}\n\nI’m using your saved schedule, so I won’t guess about anything that isn’t listed.`;
}
