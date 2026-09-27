import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { activityRouter } from "./activityRouter";
import { assistantRouter } from "./assistantRouter";
import { demoRouter } from "./demoRouter";
import { peopleRouter } from "./peopleRouter";
import { profileRouter } from "./profileRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  care: router({
    profile: profileRouter,
    activities: activityRouter,
    people: peopleRouter,
    assistant: assistantRouter,
    demo: demoRouter,
  }),
});

export type AppRouter = typeof appRouter;
