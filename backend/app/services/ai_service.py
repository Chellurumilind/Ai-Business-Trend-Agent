"""
services/ai_service.py
-----------------------
AI Insight Engine — supports OpenAI and Gemini.
Provider is selected via AI_PROVIDER in .env.

Responsibilities:
  - Build a structured business analytics prompt
  - Call the selected LLM provider
  - Parse and return actionable business insights
"""

from app.config import settings


# ── PROMPT BUILDER ────────────────────────────────────────────────────────────

def build_prompt(analytics: dict) -> str:
    """
    Constructs a detailed business analytics prompt from the analytics summary.
    Structured to guide the LLM toward actionable, specific insights.
    """
    summary    = analytics.get("summary", {})
    growth     = analytics.get("growth", {})
    volatility = analytics.get("volatility", {})
    categories = analytics.get("categories", [])

    # Format category data for readability inside the prompt
    category_text = "\n".join([
        f"  - {c['category']} ({c['type']}): ${c['total']:,.2f}"
        for c in categories[:10]  # Limit to top 10 to keep prompt concise
    ]) or "  No category data available"

    prompt = f"""
You are a senior business financial analyst AI. Analyze the following business
performance data and provide a professional, actionable report.

=== FINANCIAL SUMMARY ===
Total Revenue  : ${summary.get('total_revenue', 0):,.2f}
Total Expense  : ${summary.get('total_expense', 0):,.2f}
Net Profit     : ${summary.get('net_profit', 0):,.2f}
ROI            : {summary.get('roi', 0):.2f}%
Total Records  : {summary.get('total_records', 0)}

=== GROWTH ANALYSIS ===
Trend Direction      : {growth.get('trend_direction', 'unknown')}
Avg Revenue Growth   : {growth.get('avg_revenue_growth', 0):.2f}% per month
Avg Expense Growth   : {growth.get('avg_expense_growth', 0):.2f}% per month

=== FINANCIAL HEALTH ===
Expense Volatility   : {volatility.get('expense_volatility', 0):.2f}
  (0 = perfectly stable, 100 = extremely volatile)
Profit Stability     : {volatility.get('profit_stability', 0):.2f}/100
  (100 = perfectly stable profit)

=== TOP CATEGORIES ===
{category_text}

=== YOUR TASK ===
Provide a structured business insight report with these exact sections:

1. EXECUTIVE SUMMARY
   A 2-3 sentence overview of overall business health.

2. KEY STRENGTHS
   2-3 specific positive indicators from the data.

3. RISK ALERTS
   2-3 specific risks or warning signs detected. Be direct.

4. SPENDING ANOMALIES
   Identify any unusual patterns in the expense categories.

5. STRATEGIC RECOMMENDATIONS
   3 specific, actionable steps the business should take immediately.

6. OUTLOOK
   A one-sentence forward-looking forecast based on current trends.

Be specific, data-driven, and professional. Reference actual numbers from the data.
"""
    return prompt.strip()


# ── OPENAI PROVIDER ───────────────────────────────────────────────────────────

async def call_openai(prompt: str) -> str:
    """
    Calls OpenAI GPT-4o-mini with the analytics prompt.
    Uses async client for non-blocking FastAPI compatibility.
    """
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior financial analyst AI. "
                        "Always respond with structured, professional business insights. "
                        "Be specific and reference the actual data provided."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.4,   # Lower = more focused, less creative
            max_tokens=1200
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"OpenAI Error: {str(e)}"


# ── GEMINI PROVIDER ───────────────────────────────────────────────────────────

async def call_gemini(prompt: str) -> str:
    """
    Calls Google Gemini 1.5 Flash with the analytics prompt.
    Uses asyncio.to_thread since the Gemini SDK is synchronous.
    """
    try:
        import asyncio
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Run synchronous SDK call in a thread to avoid blocking the event loop
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,
                max_output_tokens=1200
            )
        )

        return response.text

    except Exception as e:
        return f"Gemini Error: {str(e)}"


# ── MAIN DISPATCHER ───────────────────────────────────────────────────────────

async def generate_insights(analytics: dict) -> dict:
    """
    Main entry point for the AI insight engine.

    1. Builds the prompt from analytics data
    2. Selects provider from settings.ai_provider
    3. Calls the appropriate LLM
    4. Returns structured response with provider info

    Returns:
    {
        "provider": "openai",
        "model":    "gpt-4o-mini",
        "insights": "... full AI report ..."
    }
    """
    prompt = build_prompt(analytics)

    provider = settings.ai_provider.lower().strip()

    if provider == "openai":
        insights = await call_openai(prompt)
        model    = "gpt-4o-mini"

    elif provider == "gemini":
        insights = await call_gemini(prompt)
        model    = "gemini-1.5-flash"

    else:
        insights = (
            f"Unknown AI provider '{provider}'. "
            "Set AI_PROVIDER to 'openai' or 'gemini' in your .env file."
        )
        model = "none"

    return {
        "provider": provider,
        "model":    model,
        "insights": insights
    }


async def answer_business_question(question: str, analytics: dict) -> dict:
    """Answer a focused business question using the current calculated metrics."""
    context = build_prompt(analytics)
    prompt = (
        f"{context}\n\n=== BUSINESS QUESTION ===\n{question}\n\n"
        "Answer this question directly using the available data. Keep the answer "
        "concise, actionable, and clear about any limits in the data."
    )
    provider = settings.ai_provider.lower().strip()

    if provider == "openai":
        answer = await call_openai(prompt)
        model = "gpt-4o-mini"
    elif provider == "gemini":
        answer = await call_gemini(prompt)
        model = "gemini-2.5-flash"
    else:
        answer = (
            f"Unknown AI provider '{provider}'. Set AI_PROVIDER to 'openai' or "
            "'gemini' in your .env file."
        )
        model = "none"

    return {"provider": provider, "model": model, "answer": answer}
