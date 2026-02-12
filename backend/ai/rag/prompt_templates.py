"""
Prompt templates for RAG system.
Contains system prompts and templates for different types of queries.
"""

from typing import Dict, Any, List
from string import Template


class PromptTemplates:
    """
    Collection of prompt templates for the RAG system.
    Provides structured prompts for career, learning, and general queries.
    """

    # Base system prompt
    BASE_SYSTEM_PROMPT = Template("""
You are CareerCompass AI, an intelligent career guidance assistant. Your role is to help users with career development, skill assessment, and learning recommendations.

Key guidelines:
- Be helpful, accurate, and encouraging
- Base your responses on the provided context and verified data
- If you don't have enough information, suggest what the user should do to get better guidance
- Keep responses focused and actionable
- Use the conversation history to provide personalized advice

Context information:
$context

Conversation history:
$conversation_history

Current user query: $query

Please provide a helpful response based on the available information.
""")

    # Career-specific prompts
    CAREER_ANALYSIS_PROMPT = Template("""
Based on the user's skills assessment and career data, analyze their career fit for different roles.

User skills: $skills_summary
Career matches: $career_matches
Skill gaps: $skill_gaps

Provide:
1. Top 3 career recommendations with match percentages
2. Key strengths that support these careers
3. Critical skill gaps to address
4. Next steps for career development

Response should be encouraging and actionable.
""")

    # Learning-specific prompts
    LEARNING_PATH_PROMPT = Template("""
Create a personalized learning path based on the user's current skills and career goals.

Current skills: $current_skills
Target career: $target_career
Skill gaps: $skill_gaps
Available resources: $learning_resources

Structure the learning path as:
1. Immediate next steps (1-2 weeks)
2. Short-term goals (1-3 months)
3. Long-term development (3-6 months)
4. Recommended resources and courses

Focus on practical, achievable steps.
""")

    # Skills analysis prompts
    SKILLS_ANALYSIS_PROMPT = Template("""
Analyze the user's skill assessment results and provide insights.

Assessment results: $assessment_results
Inferred skills: $inferred_skills
Skill trends: $skill_trends

Provide:
1. Summary of current skill level
2. Key strengths and areas for improvement
3. Skills that complement each other
4. Recommendations for skill development
""")

    # General query prompts
    GENERAL_QUERY_PROMPT = Template("""
Answer the user's general question about career development using the available context.

Context: $context
Question: $query

Provide a clear, helpful answer. If the question is outside your expertise, suggest appropriate resources or next steps.
""")

    # Fallback prompt for when RAG fails
    FALLBACK_PROMPT = Template("""
I don't have enough specific information to fully answer your question about "$query".

However, based on general career development best practices, here's what I can suggest:

General advice:
- Focus on building transferable skills
- Network with professionals in your target field
- Consider informational interviews
- Keep your resume and LinkedIn profile updated

To get more personalized advice, please:
1. Complete a skill assessment
2. Update your career goals
3. Provide more details about your background

Would you like help with any of these steps?
""")

    @classmethod
    def get_system_prompt(cls, intent: str, context: Dict[str, Any]) -> str:
        """Get the appropriate system prompt based on intent."""
        base_context = cls._format_context(context)

        if intent == "career":
            return cls.BASE_SYSTEM_PROMPT.substitute(
                context=base_context,
                conversation_history=context.get("conversation_history", "None"),
                query=context.get("query", "")
            )
        elif intent == "learning":
            return cls.BASE_SYSTEM_PROMPT.substitute(
                context=base_context,
                conversation_history=context.get("conversation_history", "None"),
                query=context.get("query", "")
            )
        elif intent == "skills":
            return cls.BASE_SYSTEM_PROMPT.substitute(
                context=base_context,
                conversation_history=context.get("conversation_history", "None"),
                query=context.get("query", "")
            )
        else:
            return cls.BASE_SYSTEM_PROMPT.substitute(
                context=base_context,
                conversation_history=context.get("conversation_history", "None"),
                query=context.get("query", "")
            )

    @classmethod
    def get_structured_prompt(cls, intent: str, context: Dict[str, Any]) -> str:
        """Get structured prompts for specific analysis types."""
        if intent == "career":
            return cls.CAREER_ANALYSIS_PROMPT.substitute(
                skills_summary=cls._format_skills(context.get("skills", {})),
                career_matches=cls._format_careers(context.get("career_matches", [])),
                skill_gaps=cls._format_skill_gaps(context.get("skill_gaps", []))
            )
        elif intent == "learning":
            return cls.LEARNING_PATH_PROMPT.substitute(
                current_skills=cls._format_skills(context.get("skills", {})),
                target_career=context.get("target_career", "Not specified"),
                skill_gaps=cls._format_skill_gaps(context.get("skill_gaps", [])),
                learning_resources=cls._format_resources(context.get("learning_resources", []))
            )
        elif intent == "skills":
            return cls.SKILLS_ANALYSIS_PROMPT.substitute(
                assessment_results=cls._format_assessment_results(context.get("assessment_results", {})),
                inferred_skills=cls._format_inferred_skills(context.get("inferred_skills", [])),
                skill_trends=cls._format_skill_trends(context.get("skill_trends", {}))
            )
        else:
            return cls.GENERAL_QUERY_PROMPT.substitute(
                context=cls._format_context(context),
                query=context.get("query", "")
            )

    @classmethod
    def get_fallback_prompt(cls, query: str) -> str:
        """Get fallback prompt when RAG doesn't have enough information."""
        return cls.FALLBACK_PROMPT.substitute(query=query)

    @classmethod
    def _format_context(cls, context: Dict[str, Any]) -> str:
        """Format context dictionary into readable string."""
        formatted = []
        for key, value in context.items():
            if isinstance(value, list):
                formatted.append(f"{key}: {', '.join(str(v) for v in value)}")
            elif isinstance(value, dict):
                formatted.append(f"{key}: {value}")
            else:
                formatted.append(f"{key}: {value}")
        return "\n".join(formatted)

    @classmethod
    def _format_skills(cls, skills: Dict[str, Any]) -> str:
        """Format skills data for prompts."""
        if not skills:
            return "No skills data available"

        formatted = []
        for skill_name, score in skills.items():
            formatted.append(f"{skill_name}: {score}")
        return ", ".join(formatted)

    @classmethod
    def _format_careers(cls, careers: List[Dict[str, Any]]) -> str:
        """Format career matches for prompts."""
        if not careers:
            return "No career matches available"

        formatted = []
        for career in careers[:3]:  # Top 3
            title = career.get("title", "Unknown")
            match = career.get("match_percentage", 0)
            formatted.append(f"{title} ({match:.1f}% match)")
        return ", ".join(formatted)

    @classmethod
    def _format_skill_gaps(cls, gaps: List[Dict[str, Any]]) -> str:
        """Format skill gaps for prompts."""
        if not gaps:
            return "No significant skill gaps identified"

        formatted = []
        for gap in gaps[:5]:  # Top 5 gaps
            skill = gap.get("skill", "Unknown")
            priority = gap.get("priority", "Medium")
            formatted.append(f"{skill} (Priority: {priority})")
        return ", ".join(formatted)

    @classmethod
    def _format_resources(cls, resources: List[Dict[str, Any]]) -> str:
        """Format learning resources for prompts."""
        if not resources:
            return "No specific resources available"

        formatted = []
        for resource in resources[:5]:  # Top 5 resources
            title = resource.get("title", "Unknown")
            resource_type = resource.get("type", "Course")
            formatted.append(f"{title} ({resource_type})")
        return ", ".join(formatted)

    @classmethod
    def _format_assessment_results(cls, results: Dict[str, Any]) -> str:
        """Format assessment results for prompts."""
        if not results:
            return "No assessment results available"

        total = results.get("total_skills", 0)
        average = results.get("average_score", 0)
        return f"Total skills assessed: {total}, Average score: {average:.1f}"

    @classmethod
    def _format_inferred_skills(cls, skills: List[str]) -> str:
        """Format inferred skills for prompts."""
        if not skills:
            return "No inferred skills"

        return ", ".join(skills)

    @classmethod
    def _format_skill_trends(cls, trends: Dict[str, Any]) -> str:
        """Format skill trends for prompts."""
        if not trends:
            return "No skill trends available"

        formatted = []
        for trend, value in trends.items():
            formatted.append(f"{trend}: {value}")
        return ", ".join(formatted)
