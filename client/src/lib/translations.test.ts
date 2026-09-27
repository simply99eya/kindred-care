import { describe, expect, it } from "vitest";
import {
  directionForLanguage,
  localeForLanguage,
  normalizeLanguage,
  speechLocaleForLanguage,
  translate,
} from "./translations";

describe("English/Arabic localization helpers", () => {
  it("accepts only the supported language codes", () => {
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage("ar")).toBe("ar");
    expect(normalizeLanguage("fr")).toBeNull();
  });

  it("translates known interface copy and interpolates dynamic values", () => {
    expect(translate("ar", "Language")).toBe("اللغة");
    expect(translate("ar", "Next, {{title}}, at {{time}}.", { title: "زيارة العائلة", time: "٣:٣٠ م" }))
      .toBe("التالي: زيارة العائلة، الساعة ٣:٣٠ م.");
    expect(translate("ar", "Speech rate: {{rate}}%", { rate: 95 })).toBe("سرعة النطق: ٩٥٪");
    expect(translate("en", "Hello, {{name}}", { name: "Alex" })).toBe("Hello, Alex");
  });

  it("falls back to source text for unmapped strings", () => {
    expect(translate("ar", "An unmapped label")).toBe("An unmapped label");
  });

  it("sets locale and document direction for Arabic speech and layout", () => {
    expect(localeForLanguage("ar")).toBe("ar-EG-u-ca-gregory");
    expect(speechLocaleForLanguage("ar")).toBe("ar-SA");
    expect(directionForLanguage("ar")).toBe("rtl");
    expect(localeForLanguage("en")).toBe("en-US");
    expect(directionForLanguage("en")).toBe("ltr");
  });
});
