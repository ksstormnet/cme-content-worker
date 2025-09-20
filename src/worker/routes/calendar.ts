import { Hono } from "hono";
import { Env, APIResponse } from "../../types/database";
import { requireAuth } from "./auth";

export const calendarRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all calendar routes
calendarRoutes.use("*", requireAuth);

// Content calendar management interfaces
interface ContentCalendar {
  id?: number;
  week_start_date: string;
  year: number;
  week_number: number;
  status: 'draft' | 'approved' | 'published';
  themes: string[];
  seasonal_hooks: string[];
  milestone_hooks: string[];
  notes?: string;
}

interface WeeklyContentPlan {
  id?: number;
  calendar_id: number;
  post_day: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  main_theme: string;
  secondary_theme: string;
  tertiary_theme: string;
  post_type: 'awareness' | 'practical' | 'aspirational' | 'inspirational' | 'newsletter';
  persona?: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer';
  content_brief?: string;
  status: 'draft' | 'approved' | 'published';
}

// GET /api/calendar - Get content calendar overview
calendarRoutes.get("/", async (c) => {
  try {
    const year = parseInt(c.req.query("year") || new Date().getFullYear().toString());
    const limit = parseInt(c.req.query("limit") || "52");

    const calendars = await c.env.DB.prepare(`
      SELECT c.*, u.name as created_by_name
      FROM content_calendar c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.year = ?
      ORDER BY c.week_start_date ASC
      LIMIT ?
    `).bind(year, limit).all();

    // Parse JSON strings for themes and hooks
    const formattedCalendars = (calendars.results || []).map((calendar: any) => {
      try {
        return {
          ...calendar,
          themes: calendar.themes ? JSON.parse(calendar.themes) : [],
          seasonal_hooks: calendar.seasonal_hooks ? JSON.parse(calendar.seasonal_hooks) : [],
          milestone_hooks: calendar.milestone_hooks ? JSON.parse(calendar.milestone_hooks) : []
        };
      } catch (error) {
        console.error('Error parsing calendar JSON fields:', error);
        return {
          ...calendar,
          themes: [],
          seasonal_hooks: [],
          milestone_hooks: []
        };
      }
    });

    return c.json<APIResponse<any[]>>({
      success: true,
      data: formattedCalendars
    });

  } catch (error) {
    console.error("Calendar fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch calendar" 
    }, 500);
  }
});

// POST /api/calendar - Create yearly content calendar
calendarRoutes.post("/", async (c) => {
  try {
    const user = c.get("user");
    const { year, start_date } = await c.req.json();

    if (!year || !start_date) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Year and start date required" 
      }, 400);
    }

    // Generate 52 weeks starting from the given date
    const startDate = new Date(start_date);
    const calendarEntries = [];
    
    for (let week = 0; week < 52; week++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + (week * 7));
      
      const weekNumber = Math.ceil((weekStartDate.getDate() + new Date(weekStartDate.getFullYear(), 0, 1).getDay()) / 7);
      
      calendarEntries.push({
        week_start_date: weekStartDate.toISOString().split('T')[0],
        year: parseInt(year),
        week_number: weekNumber,
        status: 'draft',
        themes: '[]',
        seasonal_hooks: '[]',
        milestone_hooks: '[]',
        created_by: user.id
      });
    }

    // Bulk insert calendar entries
    for (const entry of calendarEntries) {
      await c.env.DB.prepare(`
        INSERT INTO content_calendar (
          week_start_date, year, week_number, status, themes, 
          seasonal_hooks, milestone_hooks, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        entry.week_start_date,
        entry.year,
        entry.week_number,
        entry.status,
        entry.themes,
        entry.seasonal_hooks,
        entry.milestone_hooks,
        entry.created_by
      ).run();
    }

    return c.json<APIResponse>({
      success: true,
      message: `Created ${calendarEntries.length} weeks for ${year}`
    });

  } catch (error) {
    console.error("Calendar creation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to create calendar" 
    }, 500);
  }
});

// GET /api/calendar/:id - Get specific week with content plans
calendarRoutes.get("/:id", async (c) => {
  try {
    const calendarId = c.req.param("id");

    // Get calendar week
    const calendar = await c.env.DB.prepare(`
      SELECT c.*, u.name as created_by_name
      FROM content_calendar c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `).bind(calendarId).first();

    if (!calendar) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Calendar week not found" 
      }, 404);
    }

    // Get content plans for this week
    const contentPlans = await c.env.DB.prepare(`
      SELECT * FROM weekly_content_plans 
      WHERE calendar_id = ? 
      ORDER BY 
        CASE post_day 
          WHEN 'monday' THEN 1 
          WHEN 'wednesday' THEN 2 
          WHEN 'friday' THEN 3 
          WHEN 'saturday' THEN 4 
          WHEN 'newsletter' THEN 5 
        END
    `).bind(calendarId).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        ...calendar,
        themes: JSON.parse(calendar.themes || '[]'),
        seasonal_hooks: JSON.parse(calendar.seasonal_hooks || '[]'),
        milestone_hooks: JSON.parse(calendar.milestone_hooks || '[]'),
        content_plans: contentPlans.results || []
      }
    });

  } catch (error) {
    console.error("Calendar detail fetch error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to fetch calendar details" 
    }, 500);
  }
});

// PUT /api/calendar/:id - Update calendar week
calendarRoutes.put("/:id", async (c) => {
  try {
    const calendarId = c.req.param("id");
    const { themes, seasonal_hooks, milestone_hooks, notes, status } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE content_calendar 
      SET themes = ?, seasonal_hooks = ?, milestone_hooks = ?, notes = ?, 
          status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      JSON.stringify(themes || []),
      JSON.stringify(seasonal_hooks || []),
      JSON.stringify(milestone_hooks || []),
      notes || null,
      status || null,
      calendarId
    ).run();

    return c.json<APIResponse>({
      success: true,
      message: "Calendar week updated successfully"
    });

  } catch (error) {
    console.error("Calendar update error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to update calendar week" 
    }, 500);
  }
});

// POST /api/calendar/:id/content-plans - Generate weekly content plans
calendarRoutes.post("/:id/content-plans", async (c) => {
  try {
    const user = c.get("user");
    const calendarId = c.req.param("id");
    const { auto_generate = true } = await c.req.json();

    // Get the calendar week details
    const calendar = await c.env.DB.prepare(
      "SELECT * FROM content_calendar WHERE id = ?"
    ).bind(calendarId).first();

    if (!calendar) {
      return c.json<APIResponse>({ 
        success: false, 
        error: "Calendar week not found" 
      }, 404);
    }

    const themes = JSON.parse(calendar.themes || '[]');
    const seasonalHooks = JSON.parse(calendar.seasonal_hooks || '[]');
    
    // Content plan templates following the CME system
    const contentPlans = [
      {
        post_day: 'monday',
        post_type: 'awareness',
        main_theme: themes[0] || 'Seasonal destination focus',
        secondary_theme: themes[1] || 'Industry timing',
        tertiary_theme: themes[2] || 'Planning urgency',
        persona: null // Generally applicable
      },
      {
        post_day: 'wednesday', 
        post_type: 'practical',
        main_theme: themes[1] || 'Planning expertise',
        secondary_theme: themes[2] || 'Comparison/contrast',
        tertiary_theme: themes[3] || 'Practical tips',
        persona: null
      },
      {
        post_day: 'friday',
        post_type: 'aspirational', 
        main_theme: themes[0] || 'Deep dive topic',
        secondary_theme: themes[1] || 'Forward-looking',
        tertiary_theme: themes[2] || 'Milestone connection',
        persona: null
      },
      {
        post_day: 'saturday',
        post_type: 'inspirational',
        main_theme: themes[0] || 'Inspirational angle', 
        secondary_theme: themes[1] || 'Wow-factor',
        tertiary_theme: themes[2] || 'Shareable element',
        persona: null
      },
      {
        post_day: 'newsletter',
        post_type: 'newsletter',
        main_theme: 'Weekly digest',
        secondary_theme: 'Featured posts',
        tertiary_theme: 'Milestone highlight',
        persona: null // Persona-specific intro handled in content generation
      }
    ];

    // Delete existing plans for this week
    await c.env.DB.prepare(
      "DELETE FROM weekly_content_plans WHERE calendar_id = ?"
    ).bind(calendarId).run();

    // Insert new content plans
    for (const plan of contentPlans) {
      const brief = auto_generate ? await this.generateContentBrief(plan, themes, seasonalHooks) : null;
      
      await c.env.DB.prepare(`
        INSERT INTO weekly_content_plans (
          calendar_id, post_day, main_theme, secondary_theme, tertiary_theme,
          post_type, persona, content_brief, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        calendarId,
        plan.post_day,
        plan.main_theme,
        plan.secondary_theme, 
        plan.tertiary_theme,
        plan.post_type,
        plan.persona,
        brief,
        'draft'
      ).run();
    }

    return c.json<APIResponse>({
      success: true,
      message: "Weekly content plans generated successfully"
    });

  } catch (error) {
    console.error("Content plans generation error:", error);
    return c.json<APIResponse>({ 
      success: false, 
      error: "Failed to generate content plans" 
    }, 500);
  }
});

// Helper function to generate content briefs
async function generateContentBrief(plan: any, themes: string[], seasonalHooks: string[]): Promise<string> {
  const brief = {
    post_day: plan.post_day,
    post_type: plan.post_type,
    themes: {
      main: plan.main_theme,
      secondary: plan.secondary_theme,
      tertiary: plan.tertiary_theme
    },
    content_approach: getContentApproach(plan.post_type),
    suggested_structure: getSuggestedStructure(plan.post_type),
    cta_strategy: getCtaStrategy(plan.post_type),
    persona_considerations: plan.persona ? getPersonaGuidelines(plan.persona) : null
  };

  return JSON.stringify(brief, null, 2);
}

function getContentApproach(postType: string): string {
  switch (postType) {
    case 'awareness':
      return 'Big picture, wanderlust, seasonal urgency → pivot to future planning';
    case 'practical':
      return 'Evergreen planning expertise, comparisons, myth-busting';
    case 'aspirational':
      return 'Milestones, future planning, deep dives';
    case 'inspirational':
      return 'Wow-factor, lifestyle resonance, shareable quotes';
    case 'newsletter':
      return 'Weekly digest with persona-specific intro, featured posts recap, practical tip';
    default:
      return 'General content approach';
  }
}

function getSuggestedStructure(postType: string): string[] {
  switch (postType) {
    case 'awareness':
      return [
        'Hook with seasonal/destination appeal',
        'Industry timing context',
        'Planning urgency callout',
        'Norwegian-specific details',
        'Future planning pivot',
        'Dual CTAs (booking + quiz/guide)'
      ];
    case 'practical':
      return [
        'Practical question/challenge intro',
        'Expert explanation/comparison',
        'NCL-specific guidance',
        'Planning tip callout',
        'Actionable next steps',
        'Dual CTAs'
      ];
    case 'aspirational':
      return [
        'Aspirational story/milestone connection',
        'Deep dive into topic',
        'Norwegian advantages',
        'Forward-looking elements',
        'Inspirational conclusion',
        'Dual CTAs'
      ];
    case 'inspirational':
      return [
        'Wow-factor opening',
        'Lifestyle/emotional connection',
        'Shareable quote/visual element',
        'Norwegian experience focus',
        'Call to dream/plan',
        'Dual CTAs'
      ];
    case 'newsletter':
      return [
        'Persona-specific intro paragraph',
        'Featured posts with summaries',
        'Cruise tip of the week',
        'Milestone highlight',
        'Dual CTAs (planning call + quiz)'
      ];
    default:
      return ['Standard blog post structure'];
  }
}

function getCtaStrategy(postType: string): string {
  return 'Maximum 2 CTAs: One transactional (booking), one community/funnel (quiz/guide/planning lounge)';
}

function getPersonaGuidelines(persona: string): string {
  switch (persona) {
    case 'easy_breezy':
      return 'Stress-free approach, gentle guidance, simplification focus';
    case 'thrill_seeker':
      return 'Adventure emphasis, unique experiences, active elements';
    case 'luxe_seafarer':
      return 'Premium experiences, sophisticated language, elevated service focus';
    default:
      return 'General persona approach';
  }
}

export default calendarRoutes;