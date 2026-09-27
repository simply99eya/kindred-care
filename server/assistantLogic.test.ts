import { describe, expect, it } from "vitest";
import { answerFromSavedSchedule } from "./assistantLogic";

const schedule = [
  { title: "Family visit", startTime: "15:30", status: "planned" as const },
  { title: "Lunch", startTime: "12:00", status: "completed" as const },
];

describe("schedule-aware demo companion", () => {
  it("answers from the supplied saved schedule and sorts by time", () => {
    const answer = answerFromSavedSchedule("What is on my schedule today?", "2026-09-27", schedule, "10:00");
    expect(answer.indexOf("Lunch")).toBeLessThan(answer.indexOf("Family visit"));
    expect(answer).toContain("saved schedule");
  });

  it("does not invent events when the saved day is empty", () => {
    expect(answerFromSavedSchedule("What is next today?", "2026-09-27", [], "10:00"))
      .toContain("don’t see any activities saved");
  });

  it("redirects medical questions to a professional care team", () => {
    expect(answerFromSavedSchedule("Should I change the medication dose?", "2026-09-27", schedule, "10:00"))
      .toContain("I can’t give medical advice");
  });

  it("answers Arabic schedule questions from only the supplied saved activities", () => {
    const arabicSchedule = [
      { title: "زيارة العائلة", startTime: "15:30", status: "planned" as const },
      { title: "الغداء", startTime: "12:00", status: "completed" as const },
    ];
    const answer = answerFromSavedSchedule("ما التالي اليوم؟", "2026-09-27", arabicSchedule, "10:00", "ar");
    expect(answer).toContain("هذه الأنشطة المحفوظة");
    expect(answer).toContain("سبتمبر");
    expect(answer).toContain("الغداء");
    expect(answer).toContain("زيارة العائلة");
  });

  it("keeps the medical safety redirect in Arabic", () => {
    expect(answerFromSavedSchedule("هل أغير جرعة الدواء؟", "2026-09-27", schedule, "10:00", "ar"))
      .toContain("لا أستطيع تقديم نصائح طبية");
  });
});
